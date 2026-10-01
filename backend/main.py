import os
import sys
import uuid
import json
from pathlib import Path

# Ensure both current directory and parent directory are on sys.path
_cur_dir = Path(__file__).resolve().parent
_par_dir = _cur_dir.parent
for _p in (_cur_dir, _par_dir):
    _sp = str(_p)
    if _sp not in sys.path:
        sys.path.insert(0, _sp)

from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(override=True)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

try:
    from backend.models import (
        AnalyzeRequest, PersonResponse, PersonUpdateRequest, PersonCreateRequest,
        DateRunRequest, DateResult, RankingsResponse, DemoNetworkResponse, PersonProfile
    )
    from backend.database import (
        init_db, get_all_people, get_person_by_id, save_person,
        delete_person, delete_all_people, save_date, get_all_dates, get_date_by_id
    )
    from backend.extractor import validate_sources, extract_public_content
    from backend.agent_engine import (
        analyze_person_profile, simulate_date_conversation,
        evaluate_date, compute_rankings_for_person
    )
except ImportError:
    from models import (
        AnalyzeRequest, PersonResponse, PersonUpdateRequest, PersonCreateRequest,
        DateRunRequest, DateResult, RankingsResponse, DemoNetworkResponse, PersonProfile
    )
    from database import (
        init_db, get_all_people, get_person_by_id, save_person,
        delete_person, delete_all_people, save_date, get_all_dates, get_date_by_id
    )
    from extractor import validate_sources, extract_public_content
    from agent_engine import (
        analyze_person_profile, simulate_date_conversation,
        evaluate_date, compute_rankings_for_person
    )

app = FastAPI(
    title="PAIR//AGENTS API",
    description="Autonomous Agentic Dating Platform based strictly on public LinkedIn and Instagram profiles.",
    version="2.5.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "pair-agents-api", "version": "2.5.0"}

@app.get("/api/health/groq")
def groq_health():
    """Validate Groq API key and model availability with a minimal test call."""
    import requests as http_req
    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
    if not groq_key:
        return JSONResponse(status_code=500, content={"status": "error", "message": "GROQ_API_KEY not set in .env"})
    try:
        resp = http_req.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json={
                "model": groq_model,
                "messages": [{"role": "user", "content": 'Output a valid JSON object with key ok and value true.'}],
                "response_format": {"type": "json_object"},
                "max_tokens": 500,
            },
            headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
            timeout=25,
        )
        if resp.status_code == 401:
            return JSONResponse(status_code=401, content={
                "status": "error",
                "message": "Groq API key is invalid. Generate a new one at https://console.groq.com/keys"
            })
        if resp.status_code == 403:
            return JSONResponse(status_code=403, content={
                "status": "error",
                "message": f"Groq returned 403. Key may be revoked or model '{groq_model}' unavailable."
            })
        if resp.status_code >= 500:
            return JSONResponse(status_code=502, content={
                "status": "overloaded",
                "message": f"Groq API returned {resp.status_code}. Try again in a few seconds."
            })
        resp.raise_for_status()
        return {"status": "ok", "model": groq_model, "key_prefix": groq_key[:8] + "…"}
    except Exception as e:
        return JSONResponse(status_code=502, content={"status": "error", "message": str(e)})

@app.post("/api/people/analyze/stream")
def analyze_person_stream(req: AnalyzeRequest):
    """
    Streaming SSE endpoint that emits real-time task progress events
    as each pipeline stage completes. Use this for live UI updates.
    """
    def event_stream():
        def emit(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        try:
            # Step 1 & 2: URL validation
            valid, msg = validate_sources(req.linkedin_url, req.instagram_url)
            if not valid:
                yield emit("error", {"step": "validate", "message": msg})
                return
            yield emit("step", {"id": "1", "status": "completed", "label": "Validate LinkedIn Profile", "detail": "LinkedIn URL format is valid"})
            yield emit("step", {"id": "2", "status": "completed", "label": "Validate Instagram Profile", "detail": "Instagram URL format is valid"})

            # Step 3: Real public content extraction
            yield emit("step", {"id": "3", "status": "running", "label": "Extract Public Content", "detail": "Fetching public profile text via Playwright…"})
            try:
                extracted = extract_public_content(req.linkedin_url, req.instagram_url, req.name)
            except RuntimeError as e:
                yield emit("error", {"step": "extract", "message": str(e)})
                return
            yield emit("step", {"id": "3", "status": "completed", "label": "Extract Public Content", "detail": f"Extracted {len(extracted['linkedin_content'])} chars from LinkedIn, {len(extracted['instagram_content'])} chars from Instagram"})

            name = req.name or extracted["name"]
            headline = req.headline or name

            # Step 4: Groq LLM profile synthesis
            yield emit("step", {"id": "4", "status": "running", "label": "Synthesize Knowledge Graph", "detail": "Deriving interests, hobbies & communication style via Groq LLM…"})
            try:
                profile = analyze_person_profile(
                    name=name,
                    headline=headline,
                    linkedin_content=extracted["linkedin_content"],
                    instagram_content=extracted["instagram_content"]
                )
            except RuntimeError as e:
                yield emit("error", {"step": "analyze", "message": str(e)})
                return
            yield emit("step", {"id": "4", "status": "completed", "label": "Synthesize Knowledge Graph", "detail": f"Mapped {len(profile.interests)} interests, {len(profile.hobbies)} hobbies"})

            # Step 5: Save and return
            yield emit("step", {"id": "5", "status": "running", "label": "Instantiate Agent Persona", "detail": "Finalising autonomous LLM agent persona…"})
            person_id = f"person-{uuid.uuid4().hex[:8]}"
            person = PersonResponse(
                id=person_id,
                name=name,
                headline=headline,
                linkedin_url=req.linkedin_url or "",
                instagram_url=req.instagram_url or "",
                cached_linkedin_content=extracted["linkedin_content"],
                cached_instagram_content=extracted["instagram_content"],
                profile=profile
            )
            save_person(person)
            yield emit("step", {"id": "5", "status": "completed", "label": "Instantiate Agent Persona", "detail": "Agent persona ready"})
            yield emit("done", person.model_dump())

        except Exception as e:
            yield emit("error", {"step": "unknown", "message": f"Unexpected error: {str(e)}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.post("/api/people/analyze", response_model=PersonResponse)
def analyze_person(req: AnalyzeRequest):
    """
    Validate URLs, extract public content from strictly 2 sources (LinkedIn + Instagram),
    and synthesize a structured agent profile via Groq LLM.
    All errors are surfaced clearly — no silent fallbacks.
    """
    valid, msg = validate_sources(req.linkedin_url, req.instagram_url)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    try:
        extracted = extract_public_content(req.linkedin_url, req.instagram_url, req.name)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    name = req.name or extracted["name"]
    headline = req.headline or name

    try:
        profile = analyze_person_profile(
            name=name,
            headline=headline,
            linkedin_content=extracted["linkedin_content"],
            instagram_content=extracted["instagram_content"]
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    person_id = f"person-{uuid.uuid4().hex[:8]}"
    person = PersonResponse(
        id=person_id,
        name=name,
        headline=headline,
        linkedin_url=req.linkedin_url or "",
        instagram_url=req.instagram_url or "",
        cached_linkedin_content=extracted["linkedin_content"],
        cached_instagram_content=extracted["instagram_content"],
        profile=profile
    )
    save_person(person)
    return person

# === CRUD ENDPOINTS FOR AGENTS ===

# CREATE (Manual)
@app.post("/api/people", response_model=PersonResponse)
def create_person_manual(req: PersonCreateRequest):
    """Create an agent while preserving the required LinkedIn/Instagram source boundary."""
    valid, msg = validate_sources(req.linkedin_url, req.instagram_url)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    person_id = f"person-{uuid.uuid4().hex[:8]}"
    profile = PersonProfile(
        professional_summary=f"{req.name} — {req.headline}",
        hobbies=req.hobbies or [],
        interests=req.interests or [],
        communication_style=req.communication_style or "Reflective, inquisitive",
        conversation_topics=req.conversation_topics or [],
        agent_summary=req.agent_summary or f"{req.name} is a {req.headline}.",
        evidence_notes=["Manually registered agent"]
    )
    person = PersonResponse(
        id=person_id,
        name=req.name,
        headline=req.headline,
        linkedin_url=req.linkedin_url,
        instagram_url=req.instagram_url,
        profile=profile
    )
    save_person(person)
    return person

# READ ALL
@app.get("/api/people", response_model=List[PersonResponse])
def list_people():
    return get_all_people()

# READ ONE
@app.get("/api/people/{person_id}", response_model=PersonResponse)
def get_person(person_id: str):
    p = get_person_by_id(person_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Person with ID '{person_id}' not found.")
    return p

# UPDATE
@app.put("/api/people/{person_id}", response_model=PersonResponse)
@app.patch("/api/people/{person_id}", response_model=PersonResponse)
def update_person(person_id: str, req: PersonUpdateRequest):
    """Update an existing agent's metadata or persona attributes."""
    existing = get_person_by_id(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Person with ID '{person_id}' not found.")

    linkedin_url = req.linkedin_url or existing.linkedin_url
    instagram_url = req.instagram_url or existing.instagram_url
    valid, msg = validate_sources(linkedin_url, instagram_url)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    prof_data = existing.profile.model_dump()

    if req.name is not None:
        existing.name = req.name
    if req.headline is not None:
        existing.headline = req.headline
    if req.linkedin_url is not None:
        existing.linkedin_url = linkedin_url
    if req.instagram_url is not None:
        existing.instagram_url = instagram_url

    if req.agent_summary is not None:
        prof_data["agent_summary"] = req.agent_summary
    if req.hobbies is not None:
        prof_data["hobbies"] = req.hobbies
    if req.interests is not None:
        prof_data["interests"] = req.interests
    if req.communication_style is not None:
        prof_data["communication_style"] = req.communication_style
    if req.conversation_topics is not None:
        prof_data["conversation_topics"] = req.conversation_topics

    existing.profile = PersonProfile(**prof_data)
    save_person(existing)
    return existing

# DELETE ONE
@app.delete("/api/people/{person_id}")
def delete_person_endpoint(person_id: str):
    """Delete an agent and all their dates/transcripts."""
    existing = get_person_by_id(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Person with ID '{person_id}' not found.")
    deleted = delete_person(person_id)
    return {"status": "ok", "deleted_id": person_id, "message": f"Agent '{existing.name}' deleted successfully."}

# RE-SYNC FROM URLS
@app.post("/api/people/{person_id}/resync", response_model=PersonResponse)
def resync_person(person_id: str):
    """Re-scrape LinkedIn & Instagram URLs and re-synthesize agent persona with Groq."""
    existing = get_person_by_id(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Person with ID '{person_id}' not found.")

    try:
        extracted = extract_public_content(existing.linkedin_url, existing.instagram_url, existing.name)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    name = existing.name or extracted["name"]
    headline = existing.headline or name

    try:
        profile = analyze_person_profile(
            name=name,
            headline=headline,
            linkedin_content=extracted["linkedin_content"],
            instagram_content=extracted["instagram_content"]
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    existing.cached_linkedin_content = extracted["linkedin_content"]
    existing.cached_instagram_content = extracted["instagram_content"]
    existing.profile = profile
    save_person(existing)
    return existing

@app.post("/api/dating/run/stream")
def run_agent_date_stream(req: DateRunRequest):
    """
    Streaming SSE endpoint for a live agent date simulation.
    Emits step-by-step events as the conversation and evaluation complete.
    """
    def event_stream():
        def emit(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        person_a = get_person_by_id(req.person_a_id)
        person_b = get_person_by_id(req.person_b_id)

        if not person_a or not person_b:
            yield emit("error", {"message": "One or both agent profiles could not be found."})
            return

        if person_a.id == person_b.id:
            yield emit("error", {"message": "An agent cannot date itself."})
            return

        yield emit("step", {"id": "connecting", "label": f"Connecting {person_a.name} ↔ {person_b.name}", "status": "completed"})
        yield emit("step", {"id": "conversation", "label": "Conversation is underway…", "status": "running"})

        try:
            transcript = simulate_date_conversation(person_a, person_b)
        except RuntimeError as e:
            yield emit("error", {"step": "conversation", "message": str(e)})
            return

        yield emit("step", {
            "id": "conversation",
            "label": f"Conversation complete — {len(transcript)} turns",
            "status": "completed"
        })
        # Emit each turn for live display
        for msg in transcript:
            yield emit("turn", msg.model_dump())

        yield emit("step", {"id": "evaluation", "label": "Evaluating compatibility…", "status": "running"})

        try:
            evaluation = evaluate_date(person_a, person_b, transcript)
        except RuntimeError as e:
            yield emit("error", {"step": "evaluation", "message": str(e)})
            return

        yield emit("step", {
            "id": "evaluation",
            "label": f"Evaluation complete — compatibility score {evaluation.score}/100",
            "status": "completed"
        })

        date_id = f"date-{uuid.uuid4().hex[:8]}"
        result = DateResult(
            id=date_id,
            person_a_id=person_a.id,
            person_b_id=person_b.id,
            person_a_name=person_a.name,
            person_b_name=person_b.name,
            transcript=transcript,
            evaluation=evaluation,
            score=evaluation.score
        )
        save_date(result)
        yield emit("done", result.model_dump())

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.post("/api/dating/run", response_model=DateResult)
def run_agent_date(req: DateRunRequest):
    """
    Run a real multi-turn LLM date conversation between two agents and evaluate compatibility.
    All errors from Groq or the pipeline are surfaced — no silent fallbacks.
    """
    person_a = get_person_by_id(req.person_a_id)
    person_b = get_person_by_id(req.person_b_id)

    if not person_a or not person_b:
        raise HTTPException(status_code=404, detail="One or both agent profiles could not be found.")

    if person_a.id == person_b.id:
        raise HTTPException(status_code=400, detail="An agent cannot date itself.")

    try:
        transcript = simulate_date_conversation(person_a, person_b)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Date conversation failed: {str(e)}")

    try:
        evaluation = evaluate_date(person_a, person_b, transcript)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Date evaluation failed: {str(e)}")

    date_id = f"date-{uuid.uuid4().hex[:8]}"
    result = DateResult(
        id=date_id,
        person_a_id=person_a.id,
        person_b_id=person_b.id,
        person_a_name=person_a.name,
        person_b_name=person_b.name,
        transcript=transcript,
        evaluation=evaluation,
        score=evaluation.score
    )
    save_date(result)
    return result


@app.get("/api/dates/{date_id}", response_model=DateResult)
def get_date(date_id: str):
    d = get_date_by_id(date_id)
    if not d:
        raise HTTPException(status_code=404, detail=f"Date with ID '{date_id}' not found.")
    return d

@app.get("/api/rankings/{person_id}", response_model=RankingsResponse)
def get_rankings(person_id: str):
    target = get_person_by_id(person_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Person with ID '{person_id}' not found.")

    all_people = get_all_people()
    try:
        rankings = compute_rankings_for_person(target, all_people)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Rankings computation failed: {str(e)}")

    return RankingsResponse(
        person_id=target.id,
        person_name=target.name,
        rankings=rankings
    )

@app.get("/api/demo", response_model=DemoNetworkResponse)
def get_demo_network():
    """
    Returns the precomputed 25-person network graph, profiles, date histories, and leaderboard instantly.
    """
    people = get_all_people()
    dates = get_all_dates()
    
    top_dyad = None
    if dates:
        top_date = dates[0]
        top_dyad = {
            "date_id": top_date.id,
            "person_a_name": top_date.person_a_name,
            "person_b_name": top_date.person_b_name,
            "score": top_date.score,
            "summary": top_date.evaluation.date_summary
        }
        
    return DemoNetworkResponse(
        total_people=len(people),
        total_agents=len(people),
        total_simulated_dates=len(dates),
        people=people,
        recent_dates=dates[:10],
        top_dyad=top_dyad
    )

# Static file serving for standalone web application
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "PAIR//AGENTS API Running. Access frontend at http://localhost:8000"}
