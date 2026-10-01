# AI Usage & Architecture Documentation

## 1. Where AI / LLM is Used
1. **Public Source Analysis (`POST /api/people/analyze`)**:
   - Ingests public LinkedIn and public Instagram text extracted for a candidate.
   - Extracts structured traits (needs, hobbies, interests, lifestyle signals, communication style, explicit preferences, conversation topics, and positive/incompatible signals).
   - Enforces a strict two-source boundary; external prior knowledge and sensitive inferences are forbidden.
2. **Autonomous Agent Persona Synthesis**:
   - Instantiates an AI proxy representing the individual with strict knowledge bounds matching their source-derived profile.
3. **Simulated Multi-Turn Date Simulation (`POST /api/dating/run`)**:
   - Generates a natural 6 to 10 turn conversational exchange between two autonomous agent proxies.
   - Uncovers shared hobbies, lifestyle cadence, and intellectual curiosity.
4. **Objective Date Evaluation**:
   - Scores the simulated date across 5 explicit dimensions (Interest fit, Lifestyle pacing, Communication flow, Explicit preferences, and Interactive chemistry).
   - Generates structured evaluation summaries, complementary synergy notes, and potential friction observations.
5. **Multi-Factor Candidate Ranking (`GET /api/rankings/{person_id}`)**:
   - Computes weighted composite rankings using profile overlap and date interaction scores.

---

## 2. Prompt Engineering Strategy
- **Strict Grounding**: Prompts explicitly instruct the LLM that outside knowledge, search enrichment, or hallucinated facts are prohibited.
- **Pydantic Validation & 1-Step Repair**: All LLM completions use JSON response formats validated against strict Pydantic schemas. If a JSON decode error occurs, an automatic 1-step repair retry resolves schema inconsistencies.
- **Privacy Protection for Chain-of-Thought**: Private LLM reasoning is never exposed to the frontend; safe high-level thinking state messages are generated for user transparency.

---

## 3. What Was Manually Designed & Implemented
- **Frontend Design System**: Unification of Stitch's refined editorial typography (`Newsreader` + `Geist`), warm rag-paper surface palette (`#FCF9F6`), and [Beautiful UI](https://www.beautifului.dev/) AI-native components (`Agent Screen`, `Chat`, `Streaming Text`, `Thinking`, `Context Cards`, `Insight Cards`, `Task Rows`, `Prompt Bar`, `Recommendation Card`, `Records Table`).
- **FastAPI Backend & SQLite Persistence**: Structured endpoints with Pydantic typing, SQLite database caching for instant demo loading, and dual-source public extraction.
- **25-Person Verified Real Demo Dataset**: Curated network of 25 real individuals with verified public LinkedIn and Instagram sources.

---

## 4. Limitations & Boundaries
- **Strict 2-Source Restriction**: The system only accesses the two explicitly provided public URLs. Inaccessible or private profiles fail cleanly.
- **Non-Romantic Certainty**: Date evaluations are AI-simulated assessments of conversational and lifestyle compatibility based only on available public evidence, not deterministic romantic guarantees.
