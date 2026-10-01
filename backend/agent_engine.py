import os
import json
import time
import requests as http_requests  # renamed to avoid shadowing
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv
from backend.models import PersonProfile, Message, DateEvaluation, CandidateRanking, PersonResponse

load_dotenv(override=True)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

# HTTP status codes that indicate transient Groq overload — eligible for retry
_GROQ_RETRY_CODES = {429, 500, 502, 503, 529}

# Groq API URL
_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def _groq_headers() -> Dict[str, str]:
    api_key = os.environ.get("GROQ_API_KEY") or GROQ_API_KEY
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }


def _groq_post(payload: dict, timeout: int = 90) -> dict:
    """Make a single POST to the Groq API and return parsed JSON content."""
    resp = http_requests.post(
        _GROQ_API_URL,
        json=payload,
        headers=_groq_headers(),
        timeout=timeout,
    )
    resp.raise_for_status()
    data = resp.json()
    return data


def call_groq_json(
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_retries: int = 1,
    max_backoff_attempts: int = 4,
    max_tokens: int = 4096
) -> Dict[str, Any]:
    """
    Calls Groq API with JSON mode.
    - Exponential backoff (2s, 4s, 8s, 16s) for transient overload codes (429, 502, 503, 529).
    - 1-step repair retry on malformed JSON.
    Raises RuntimeError on all terminal failures.
    """
    api_key = os.environ.get("GROQ_API_KEY") or GROQ_API_KEY
    model = os.environ.get("GROQ_MODEL") or GROQ_MODEL
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. "
            "Add it to your .env file: GROQ_API_KEY=gsk_..."
        )

    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    last_error = None
    raw_content = ""

    # Outer loop: exponential backoff on Groq overload / rate-limit
    for backoff_attempt in range(max_backoff_attempts):
        try:
            data = _groq_post(payload)
            raw_content = data["choices"][0]["message"]["content"]

            # Inner: JSON repair retry
            for repair_attempt in range(max_retries + 1):
                try:
                    return json.loads(raw_content)
                except json.JSONDecodeError as e:
                    last_error = f"Groq returned invalid JSON: {e}"
                    if repair_attempt < max_retries:
                        repair_data = _groq_post({
                            **payload,
                            "messages": messages + [
                                {"role": "assistant", "content": raw_content},
                                {"role": "user", "content": (
                                    "Your previous response was not valid JSON. "
                                    "Output ONLY a valid JSON object. "
                                    "No markdown, no extra text."
                                )}
                            ]
                        })
                        raw_content = repair_data["choices"][0]["message"]["content"]
            raise RuntimeError(f"Groq LLM call failed: {last_error}")

        except http_requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            body = ""
            try:
                body = e.response.text[:400] if e.response is not None else str(e)
            except Exception:
                body = str(e)

            # Distinguish permanent key errors from transient overload
            if status == 401:
                raise RuntimeError(
                    "Groq API key is invalid (HTTP 401). "
                    "Go to https://console.groq.com/keys and generate a new key, "
                    "then update GROQ_API_KEY in your .env file."
                )
            if status == 403:
                raise RuntimeError(
                    f"Groq API returned 403 Forbidden. "
                    f"Your key may be revoked or the model '{GROQ_MODEL}' may not be available. "
                    f"Details: {body}"
                )

            last_error = f"Groq API HTTP {status}: {body}"
            if status in _GROQ_RETRY_CODES and backoff_attempt < max_backoff_attempts - 1:
                wait = 2 ** (backoff_attempt + 1)   # 2s, 4s, 8s, 16s
                print(f"  [Groq] HTTP {status} — retrying in {wait}s (attempt {backoff_attempt + 1}/{max_backoff_attempts})…")
                time.sleep(wait)
                continue
            break

        except http_requests.exceptions.ConnectionError as e:
            last_error = f"Network error reaching Groq API: {e}"
            break

        except http_requests.exceptions.Timeout:
            last_error = "Groq API request timed out (90s)"
            if backoff_attempt < max_backoff_attempts - 1:
                time.sleep(2 ** (backoff_attempt + 1))
                continue
            break

        except Exception as e:
            last_error = str(e)
            break

    raise RuntimeError(f"Groq LLM call failed: {last_error}")


def analyze_person_profile(
    name: str,
    headline: str,
    linkedin_content: str,
    instagram_content: str
) -> PersonProfile:
    """
    Analyze a person strictly from the 2 provided source texts using Groq LLM.
    Raises RuntimeError if LLM call fails or returns malformed data.
    """
    system_prompt = load_prompt("person_analysis.txt") or (
        "You are an expert dating agent analyst. "
        "Analyze a person ONLY from their public LinkedIn and Instagram content. "
        "Never infer sensitive attributes. Output strictly valid JSON."
    )

    user_prompt = f"""Analyze this person based ONLY on the following two public sources:

PERSON NAME: {name}
PROFESSIONAL HEADLINE: {headline}

SOURCE 1 — PUBLIC LINKEDIN CONTENT:
{linkedin_content[:3000]}

SOURCE 2 — PUBLIC INSTAGRAM CONTENT:
{instagram_content[:3000]}

Output a JSON object with these exact keys:
{{
  "professional_summary": "...",
  "needs": ["...", "..."],
  "hobbies": ["...", "..."],
  "interests": ["...", "..."],
  "lifestyle_signals": ["...", "..."],
  "communication_style": "...",
  "explicit_preferences": ["...", "..."],
  "conversation_topics": ["...", "..."],
  "positive_compatibility_signals": ["..."],
  "potential_incompatibility_signals": ["..."],
  "evidence_notes": ["Cite exactly what in LinkedIn/Instagram supports each field"],
  "agent_summary": "A 2-sentence agent summary grounded in source evidence only."
}}"""

    res = call_groq_json([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ], temperature=0.2)

    required_keys = ["hobbies", "interests", "professional_summary", "agent_summary"]
    missing = [k for k in required_keys if k not in res]
    if missing:
        raise RuntimeError(
            f"Groq returned incomplete profile analysis. Missing fields: {missing}. "
            "Raw response: " + json.dumps(res)[:400]
        )

    return PersonProfile(
        professional_summary=res["professional_summary"],
        needs=res.get("needs", []),
        hobbies=res.get("hobbies", []),
        interests=res.get("interests", []),
        lifestyle_signals=res.get("lifestyle_signals", []),
        communication_style=res.get("communication_style", ""),
        explicit_preferences=res.get("explicit_preferences", []),
        conversation_topics=res.get("conversation_topics", []),
        positive_compatibility_signals=res.get("positive_compatibility_signals", []),
        potential_incompatibility_signals=res.get("potential_incompatibility_signals", []),
        evidence_notes=res.get("evidence_notes", []),
        agent_summary=res["agent_summary"],
    )


def simulate_date_conversation(person_a: PersonResponse, person_b: PersonResponse) -> List[Message]:
    """
    Generate an 8-turn, profile-grounded first-date conversation using Groq LLM.
    Raises RuntimeError if the LLM call fails or returns an unusable response.
    """
    conv_prompt = load_prompt("date_conversation.txt") or (
        "You are a careful first-date conversation writer. "
        "Write a natural, authentic, respectful conversation between two people. "
        "Each agent speaks authentically based only on their provided profile. "
        "Never mention agents, simulation, prompts, scoring, or hidden reasoning in spoken messages. "
        "Output strictly valid JSON."
    )

    messages_prompt = f"""Write an authentic 8-turn first-date conversation between:

AGENT A: {person_a.name} ({person_a.headline})
Profile summary: {person_a.profile.agent_summary}
Interests: {", ".join(person_a.profile.interests[:5])}
Hobbies: {", ".join(person_a.profile.hobbies[:5])}
Communication style: {person_a.profile.communication_style}
Conversation topics they enjoy: {", ".join(person_a.profile.conversation_topics[:3])}

AGENT B: {person_b.name} ({person_b.headline})
Profile summary: {person_b.profile.agent_summary}
Interests: {", ".join(person_b.profile.interests[:5])}
Hobbies: {", ".join(person_b.profile.hobbies[:5])}
Communication style: {person_b.profile.communication_style}
Conversation topics they enjoy: {", ".join(person_b.profile.conversation_topics[:3])}

Rules:
- Stay strictly within the supplied profile evidence. Unknown facts stay unknown.
- Do not make either person sound like a chatbot, interviewer, therapist, salesperson, or dating app.
- Avoid generic romantic clichés, exaggerated metaphors, polished speeches, and instant chemistry claims.
- Each turn should respond to the previous turn, reveal one small supported detail, and ask or invite a natural follow-up.
- Include one light moment, one meaningful question, one shared interest, and one respectful difference.
- Do not mention agents, profiles, sources, scoring, compatibility, simulation, or hidden reasoning in spoken messages.
- Alternate speakers: A, B, A, B, A, B, A, B (exactly 8 turns).
- thinking_summary must be a brief internal note about the agent's reasoning (never shown to the date).

Output JSON:
{{
  "conversation": [
    {{
      "turn": 1,
      "speaker": "agent_a",
      "speaker_name": "{person_a.name}",
      "message": "...",
      "thinking_summary": "..."
    }},
    ...
  ]
}}"""

    res = call_groq_json([
        {"role": "system", "content": conv_prompt},
        {"role": "user", "content": messages_prompt}
    ], temperature=0.6)

    raw_list = None
    if isinstance(res, list):
        raw_list = res
    elif isinstance(res, dict):
        for key in ["conversation", "transcript", "turns", "messages", "dialogue"]:
            if key in res and isinstance(res[key], list):
                raw_list = res[key]
                break
        if raw_list is None:
            for val in res.values():
                if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
                    raw_list = val
                    break

    if not raw_list or len(raw_list) < 2:
        raise RuntimeError(
            "Groq returned an invalid date conversation. "
            "Raw response: " + json.dumps(res)[:400]
        )

    transcript: List[Message] = []
    for i, item in enumerate(raw_list):
        if not isinstance(item, dict):
            continue
        turn_num = item.get("turn", i + 1)
        speaker = item.get("speaker") or ("agent_a" if i % 2 == 0 else "agent_b")
        default_name = person_a.name if speaker == "agent_a" else person_b.name
        speaker_name = item.get("speaker_name") or default_name
        msg_text = item.get("message") or item.get("text") or item.get("content") or ""
        if msg_text:
            transcript.append(Message(
                turn=turn_num,
                speaker=speaker,
                speaker_name=speaker_name,
                message=msg_text,
                thinking_summary=""
            ))

    return transcript


def evaluate_date(
    person_a: PersonResponse,
    person_b: PersonResponse,
    transcript: List[Message]
) -> DateEvaluation:
    """
    Evaluate a simulated date conversation and compute compatibility scores.
    Raises RuntimeError if evaluation cannot be completed.
    """
    eval_prompt = load_prompt("date_evaluation.txt") or (
        "You are an expert relationship compatibility analyst. "
        "Evaluate the provided date transcript and output a structured compatibility assessment. "
        "Be honest and specific. Base all assessments strictly on the transcript and profiles. "
        "Output strictly valid JSON."
    )

    transcript_text = "\n".join([
        f"[Turn {m.turn}] {m.speaker_name}: {m.message}"
        for m in transcript
    ])

    user_prompt = f"""Evaluate this date transcript:

PERSON A: {person_a.name} — {person_a.headline}
Agent summary: {person_a.profile.agent_summary}

PERSON B: {person_b.name} — {person_b.headline}
Agent summary: {person_b.profile.agent_summary}

DATE TRANSCRIPT:
{transcript_text}

Output a JSON object with these exact keys:
{{
  "shared_interests": ["list of actual shared interests/topics discussed"],
  "lifestyle_fit": "1-2 sentence assessment of lifestyle compatibility",
  "communication_fit": "1-2 sentence assessment of conversational chemistry",
  "engagement_score": <number 0-100>,
  "complementary_traits": ["trait A complements trait B", "..."],
  "potential_friction": ["honest friction point", "..."],
  "strongest_connection": "The single most compelling connection point from the conversation",
  "date_summary": "A 2-3 sentence summary of the date quality and chemistry",
  "score": <overall compatibility score 0-100, float>
}}"""

    res = call_groq_json([
        {"role": "system", "content": eval_prompt},
        {"role": "user", "content": user_prompt}
    ], temperature=0.2)

    if "score" not in res:
        raise RuntimeError(
            "Groq returned an invalid date evaluation (missing 'score'). "
            "Raw response: " + json.dumps(res)[:400]
        )

    return DateEvaluation(
        shared_interests=res.get("shared_interests", []),
        lifestyle_fit=res.get("lifestyle_fit", ""),
        communication_fit=res.get("communication_fit", ""),
        engagement_score=float(res.get("engagement_score", res["score"])),
        complementary_traits=res.get("complementary_traits", []),
        potential_friction=res.get("potential_friction", []),
        strongest_connection=res.get("strongest_connection", ""),
        date_summary=res.get("date_summary", ""),
        score=float(res["score"]),
    )


def compute_rankings_for_person(
    target_person: PersonResponse,
    all_people: List[PersonResponse]
) -> List[CandidateRanking]:
    """
    Two-Stage Matching Architecture (per AGENTS.md):
    - Stage 1: Fast candidate pre-screening using structured profile compatibility (interest overlap, lifestyle signals, communication style).
    - Checks database for existing date simulations and integrates real date scores.
    - Stage 2: Deep LLM compatibility scoring and rationale generation for top candidates.
    """
    from backend.database import get_all_dates
    
    # Load all existing simulated dates for this person to use real date scores
    existing_dates = get_all_dates()
    date_score_map = {}
    for d in existing_dates:
        if d.person_a_id == target_person.id:
            date_score_map[d.person_b_id] = (d.score, d.evaluation.date_summary)
        elif d.person_b_id == target_person.id:
            date_score_map[d.person_a_id] = (d.score, d.evaluation.date_summary)

    candidates_stage1 = []
    target_tags = set(target_person.profile.interests + target_person.profile.hobbies)
    target_lifestyle = set(target_person.profile.lifestyle_signals)

    for candidate in all_people:
        if candidate.id == target_person.id:
            continue

        cand_tags = set(candidate.profile.interests + candidate.profile.hobbies)
        cand_lifestyle = set(candidate.profile.lifestyle_signals)
        shared = list(target_tags.intersection(cand_tags))
        shared_lifestyle = list(target_lifestyle.intersection(cand_lifestyle))

        # Check if a real date was simulated
        if candidate.id in date_score_map:
            real_date_score, date_summary = date_score_map[candidate.id]
            composite = round(real_date_score * 0.7 + min(70.0 + len(shared) * 5.0, 95.0) * 0.3, 1)
            date_score = round(real_date_score, 1)
            rationale = date_summary or f"Simulated live date completed with {real_date_score}% compatibility."
            candidates_stage1.append({
                "candidate": candidate,
                "composite": composite,
                "date_score": date_score,
                "shared": shared or [candidate.profile.hobbies[0] if candidate.profile.hobbies else "Creative Work"],
                "rationale": rationale,
                "has_real_date": True
            })
            continue

        # Stage 1 structured baseline score
        overlap_score = min(68.0 + len(shared) * 5.5 + len(shared_lifestyle) * 4.0, 94.0)
        comm_bonus = 3.0 if (target_person.profile.communication_style and 
                             candidate.profile.communication_style and
                             target_person.profile.communication_style.lower() in candidate.profile.communication_style.lower()) else 0.0
        composite = round(overlap_score + comm_bonus, 1)
        date_score = round(composite * 0.94, 1)
        
        shared_list = shared or (candidate.profile.hobbies[:2] if candidate.profile.hobbies else ["Creative Work"])
        rationale = f"Profile overlap on {', '.join(shared_list[:2])} with complementary lifestyle rhythms."
        
        candidates_stage1.append({
            "candidate": candidate,
            "composite": composite,
            "date_score": date_score,
            "shared": shared_list,
            "rationale": rationale,
            "has_real_date": False
        })

    # Sort descending by composite score
    candidates_stage1.sort(key=lambda x: x["composite"], reverse=True)

    # Stage 2: Deep LLM evaluation for the top 3 candidates that don't have a real date yet
    top_to_refine = [item for item in candidates_stage1[:3] if not item["has_real_date"]]
    for item in top_to_refine:
        cand = item["candidate"]
        try:
            score_prompt = f"""Rate the romantic compatibility between these two people on a scale of 0-100.
PERSON A: {target_person.name} — {target_person.headline}
Summary: {target_person.profile.agent_summary}
Interests: {", ".join(target_person.profile.interests[:3])}
Hobbies: {", ".join(target_person.profile.hobbies[:3])}
Needs: {", ".join(target_person.profile.needs[:2])}

PERSON B: {cand.name} — {cand.headline}
Summary: {cand.profile.agent_summary}
Interests: {", ".join(cand.profile.interests[:3])}
Hobbies: {", ".join(cand.profile.hobbies[:3])}
Needs: {", ".join(cand.profile.needs[:2])}

Output JSON:
{{
  "composite_score": <0-100 float>,
  "date_score": <0-100 float>,
  "match_rationale": "1 concise sentence explaining the match strength"
}}"""
            res = call_groq_json([
                {"role": "system", "content": "You are a relationship compatibility expert. Output valid JSON only."},
                {"role": "user", "content": score_prompt}
            ], temperature=0.2, max_tokens=1000)
            
            if "composite_score" in res:
                item["composite"] = float(res["composite_score"])
            if "date_score" in res:
                item["date_score"] = float(res["date_score"])
            if "match_rationale" in res:
                item["rationale"] = res["match_rationale"]
        except Exception:
            pass  # Retain structured Stage 1 score on any LLM hiccup

    # Re-sort after refinement
    candidates_stage1.sort(key=lambda x: x["composite"], reverse=True)

    return [
        CandidateRanking(
            candidate_id=r["candidate"].id,
            candidate_name=r["candidate"].name,
            candidate_headline=r["candidate"].headline,
            rank=idx + 1,
            composite_score=r["composite"],
            date_score=r["date_score"],
            shared_tags=r["shared"][:4],
            match_rationale=r["rationale"],
        )
        for idx, r in enumerate(candidates_stage1)
    ]
