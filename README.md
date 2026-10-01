# PAIR//AGENTS — Autonomous Resonance Protocol

An autonomous agentic dating platform where AI agents date other AI agents on behalf of real people based strictly and solely on their public LinkedIn and public Instagram profiles.

---

## Key Features

- **Strict Dual-Source Grounding**: Exactly two sources are used per individual (public LinkedIn and public Instagram). No external search, Wikipedia, or prior knowledge enrichment.
- **Beautiful UI + Editorial Aesthetics**: Combines Stitch's warm archival rag-paper palette (`#FCF9F6`), `Newsreader` + `Geist` typography, and [Beautiful UI](https://www.beautifului.dev/) AI-native components (`Agent Screen`, `Chat`, `Streaming Text`, `Thinking`, `Context Cards`, `Insight Cards`, `Task Rows`, `Prompt Bar`, `Recommendation Card`, `Records Table`).
- **Live Dynamic Multi-Turn Dates**: Agents hold dynamic multi-turn conversations exploring hobbies, travel philosophies, and lifestyle cadence with live streaming tokens and safe thinking indicators.
- **Transparent Multi-Factor Rankings**: Compatibility scored on interest overlap (25%), lifestyle pacing (20%), communication style (20%), explicit preferences (20%), and date chemistry (15%).
- **25-Person Precomputed Demo Network**: Instant sub-second loading for 25 verified real profiles, with live pipeline support for new candidate ingestion.

---

## Tech Stack

- **Frontend**: Next.js / React / TypeScript + Tailwind CSS + Beautiful UI Design System
- **Backend**: Python 3.10+ + FastAPI + Pydantic v2 + Uvicorn
- **AI / LLM**: Groq API (`GROQ_API_KEY`, `GROQ_MODEL`) with JSON repair retry
- **Storage**: SQLite (`pair_agents.db`) + Seed Dataset (`data/demo_seed.json`)

---

## Quickstart

### 1. Configure Environment
Create `.env` based on `.env.example`:
```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 2. Start the Unified Server
```bash
# Start the FastAPI backend and frontend server
py -3.10 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at **`http://localhost:8000`**.

---

## API Endpoints

- `POST /api/people/analyze` — Validate dual URLs, extract public content, and synthesize structured profile.
- `GET /api/people` — List all registered profiles in the network.
- `GET /api/people/{id}` — Retrieve profile dossier, source citations, and traits.
- `POST /api/dating/run` — Simulate multi-turn agent date and return structured evaluation.
- `GET /api/dates/{id}` — Retrieve full date transcript and evaluation.
- `GET /api/rankings/{person_id}` — Compute multi-factor compatibility rankings.
- `GET /api/demo` — Instant access to the precomputed 25-person network graph.

---

## Design System Reference

- [Frontend Audit & System Architecture](file:///C:/Users/samit/.gemini/antigravity-ide/brain/33269c31-f8c5-4e06-b90b-3e3860a78de4/frontend_audit.md)
- [AI Usage Documentation](file:///e:/agentic_dating_instructions_beautifului/AI_USAGE.md)
- [Master Instructions](file:///e:/agentic_dating_instructions_beautifului/MASTER_AGENT_INSTRUCTION.md)
