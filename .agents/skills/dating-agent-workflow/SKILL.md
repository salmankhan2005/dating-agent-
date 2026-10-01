---
name: dating-agent-workflow
description: >-
  Orchestrates the end-to-end Agentic Dating pipeline from dual-source profile ingestion (LinkedIn + Instagram)
  through structured person analysis, candidate pre-screening, live agent-to-agent date simulation, evaluation,
  and multi-factor ranking. Use when implementing or executing dating pipeline workflows.
---

# Dating Agent Workflow Runbook

This skill outlines the step-by-step procedure to execute or implement the autonomous agentic dating pipeline.

## Pipeline Architecture Overview

```
[LinkedIn URL + Instagram URL]
              ↓
  1. Public Source Extraction (Playwright + BeautifulSoup)
              ↓
  2. Source Validation & Cleaning (Strict 2-source boundary)
              ↓
  3. Structured Person Analysis (Groq LLM + Pydantic)
              ↓
  4. Person Agent Persona Creation
              ↓
  5. Candidate Pre-Screening (Fast top 3–5 candidate matching)
              ↓
  6. Agent-to-Agent Date Simulation (6–10 turns multi-agent dialogue)
              ↓
  7. Date Evaluation & Compatibility Scoring (0–100 multi-criteria)
              ↓
  8. Leaderboard & Per-Person Compatibility Rankings
              ↓
  9. Beautiful UI Visual Presentation (Agent Screen, Chat, Insight Cards)
```

---

## Detailed Step-by-Step Execution

### Step 1: Ingestion & Public Source Extraction
1. Receive `linkedin_url` and `instagram_url` from the user or demo dataset.
2. Validate URL formats:
   - LinkedIn: `https://(www\.)?linkedin\.com/in/[\w-]+/?`
   - Instagram: `https://(www\.)?instagram\.com/[\w\._-]+/?`
3. Launch Playwright headless browser to render public DOM.
4. Extract text nodes: bio, headline, experiences, education, public post captions, tags.
5. If private or blocked, catch error and return `PROFILE_PRIVATE` or `PROFILE_UNAVAILABLE`.

### Step 2: Structured Person Analysis
1. Combine extracted text chunks with strict prompt boundaries (no external enrichment).
2. Call Groq LLM using `PERSON_ANALYSIS_PROMPT`.
3. Validate response with `PersonProfile` Pydantic model:
   - `name`: string
   - `professional_summary`: string
   - `needs`: list[string]
   - `hobbies`: list[string]
   - `interests`: list[string]
   - `lifestyle_signals`: list[string]
   - `communication_style`: string
   - `explicit_preferences`: list[string]
   - `conversation_topics`: list[string]
   - `positive_compatibility_signals`: list[string]
   - `potential_incompatibility_signals`: list[string]
   - `evidence_notes`: list[string]
   - `agent_summary`: string

### Step 3: Candidate Pre-Screening (Performance Strategy)
To avoid running $N \times (N-1)$ expensive multi-turn LLM dates ($25 \times 24 = 600$ dates):
1. Compute profile similarity matrix across all stored profiles (interest overlap, lifestyle alignment).
2. Select top 3 to 5 candidate matches for each individual.

### Step 4: Multi-Turn Agent-to-Agent Date Simulation
1. Instantiate `Agent A` (representing Person 1) and `Agent B` (representing Person 2).
2. Feed their respective structured profiles into system instructions.
3. Run a dynamic 6 to 10 turn dialogue where:
   - Turn 1: Agent A greets & introduces a conversational hook.
   - Turn 2: Agent B responds and shares a hobby/interest.
   - Turns 3–8: Agents ask follow-up questions, discover shared values, and explore potential differences.
   - Turn 9–10: Wrap up and share parting impressions.
4. Record full transcript with speaker IDs, timestamps, and active status.

### Step 5: Date Evaluation & Compatibility Scoring
1. Send full date transcript + both structured profiles to Groq LLM using `DATE_EVALUATION_PROMPT`.
2. Generate structured evaluation:
   - `shared_interests`: list[string]
   - `lifestyle_fit`: string
   - `communication_fit`: string
   - `engagement_score`: float (0-100)
   - `complementary_traits`: list[string]
   - `potential_friction`: list[string]
   - `strongest_connection`: string
   - `date_summary`: string
   - `final_score`: float (0-100)

### Step 6: Multi-Factor Ranking Formulation
Calculate final candidate score using weighted formula:
- **Interest Compatibility**: 25%
- **Lifestyle Compatibility**: 20%
- **Communication Compatibility**: 20%
- **Explicit Preference Alignment**: 20%
- **Date Interaction Quality**: 15%

### Step 7: Beautiful UI Rendering
1. Display the live or replay date in `Agent Screen` with `Chat` message bubbles and typing indicator.
2. Render `Context Cards` for LinkedIn and Instagram source facts.
3. Render `Recommendation Card` and `Insight Cards` for match evaluation.
4. Display sorted leaderboard in `Records Table`.
