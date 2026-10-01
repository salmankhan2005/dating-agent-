# Backend Architecture & AI Execution Guidelines

These rules dictate backend API design, database schemas, LLM prompt execution, and performance optimizations.

## 1. Backend Standards
- **Framework**: Python 3.10+ with FastAPI.
- **Validation**: Strict Pydantic v2 models for all request payloads, response bodies, and internal domain models.
- **CORS & Environment**: Configured for local Next.js frontend communication (`http://localhost:3000`).
- **Database**: SQLite with async/sync SQLAlchemy or SQLModel.
  - `people`: `id`, `name`, `linkedin_url`, `instagram_url`, `linkedin_content`, `instagram_content`, `profile_json`, `created_at`
  - `dates`: `id`, `person_a_id`, `person_b_id`, `transcript_json`, `evaluation_json`, `score`, `created_at`

## 2. API Endpoints Contract
1. `POST /api/people/analyze` — Validates URLs, extracts content, runs person analysis LLM, stores in DB, returns structured profile.
2. `POST /api/dating/run` — Executes a live multi-turn date simulation between `person_a` and `person_b`, evaluates the transcript, returns conversation + evaluation.
3. `GET /api/people/{person_id}` — Retrieves person profile, source evidence, and candidate status.
4. `GET /api/rankings/{person_id}` — Computes/retrieves multi-factor compatibility rankings for `person_id` against the candidate network.
5. `GET /api/demo` — Returns the precomputed 25-person network graph, profiles, date histories, and leaderboard.

## 3. Groq LLM & Prompt Execution
- **Provider**: Groq API (`groq` Python SDK).
- **Environment**: Configurable model via `GROQ_MODEL` (e.g. `llama-3.3-70b-versatile` or `mixtral-8x7b-32768`).
- **Reliability & Validation**:
  - Always enforce JSON response formats (`response_format={"type": "json_object"}`).
  - Parse output against Pydantic models.
  - Implement a 1-step repair retry: if JSON parsing fails, pass the raw string and error back to the LLM with a repair prompt before throwing an exception.
  - Log execution metrics (latency, token count, model used) without leaking API keys.

## 4. Performance & Scalability (Two-Stage Matching)
- **Avoid $O(N^2)$ LLM Date Explosions**:
  - Do not execute full LLM multi-turn dates for all 600 candidate pairs.
  - **Stage 1 (Pre-Screening)**: Compute embedding cosine similarity or rule-based weighted profile overlap (interests, lifestyle, communication).
  - **Stage 2 (Deep Simulation)**: Trigger 6–10 turn agent conversations only for the top 3–5 candidate pairs per profile.
- **Precomputed Demo Caching**:
  - Seed the demo database on startup with completed date transcripts and evaluations so the 25-person demo loads in under 1 second.
