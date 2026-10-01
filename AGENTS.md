# Agentic Dating Platform — Workspace Guidelines & Rules

## Project Mission
Build a production-grade, real agentic dating platform where AI agents date other AI agents on behalf of real people based strictly and solely on their public LinkedIn and public Instagram profiles.

---

## 1. Non-Negotiable Source Rule (Strict Boundary)
For every person, **exactly TWO information sources** may be used:
1. Public LinkedIn profile
2. Public Instagram profile

### Prohibitions:
- **NEVER** enrich profiles from Google search, Wikipedia, GitHub, X/Twitter, YouTube, news articles, third-party bios, or external databases.
- **NEVER** use LLM prior knowledge to fill in facts about real individuals.
- **NEVER** infer sensitive personal characteristics (e.g., race, religion, health, sexual orientation, political beliefs) unless explicitly stated in source text.
- **NEVER** fabricate source content, URLs, identities, or personal facts.
- Distinguish explicit evidence from reasonable non-sensitive interpretation. If a field is unknown, mark it `unknown`.
- Respect access boundaries: Do not bypass authentication, CAPTCHAs, or private profile protections. If a profile is private or inaccessible, report the error cleanly.

---

## 2. Core Architecture & Tech Stack

| Layer | Technologies | Key Guidelines |
| :--- | :--- | :--- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui | Beautiful UI design system, warm editorial aesthetic |
| **Backend** | Python, FastAPI, Pydantic, Uvicorn | Strict typing, robust error models, structured JSON responses |
| **AI / LLM** | Groq API (`GROQ_API_KEY`, `GROQ_MODEL`) | Model name configurable via environment variable |
| **Extraction** | Playwright (public rendering), BeautifulSoup (cleaning) | Public extraction only; handle failures gracefully |
| **Storage** | SQLite (`sqlite3` / SQLAlchemy / SQLModel) | Tables for `people` and `dates`; JSON seed data for demo |

---

## 3. UI/UX Design System (Beautiful UI)
- **Primary Reference**: [Beautiful UI](https://www.beautifului.dev/) AI-native component patterns.
- **Aesthetic Direction**:
  - Warm/off-white background (`#FBF9F5` / `#F8F6F0`), deep charcoal typography (`#1A1A1A`), restrained accent color (warm coral/rose or subtle amber).
  - Subtle borders, generous whitespace, strong editorial typography.
  - **AVOID**: Cyberpunk, dark neon, heavy glassmorphism, generic SaaS dashboard aesthetics.
- **Live Agent Date**: Must be the visual centerpiece featuring dynamic multi-turn conversation (`Chat`, `Streaming Text`), safe `Thinking` states, `Context Cards` for source evidence, and `Insight Cards` for compatibility traits.
- **Chain-of-Thought Rule**: Never expose private LLM reasoning. Only show safe high-level status (e.g., *"Comparing creative hobbies"*, *"Evaluating conversation flow"*).

---

## 4. Execution Workflow & Performance Strategy
1. **Two-Stage Matching**:
   - Do NOT run all $N \times (N-1)$ combinatorial date conversations ($25 \times 24 = 600$ dates).
   - **Stage 1**: Fast candidate pre-screening using structured profile compatibility (embedding / keyword / profile overlap).
   - **Stage 2**: Run live multi-turn agent-to-agent dates (6–10 turns) for the top 3–5 candidates per person.
2. **Demo-First Requirement**:
   - Include a pre-seeded, precomputed network of at least 25 real individuals with verified public LinkedIn and Instagram URLs.
   - Cache results so the demo loads instantly, while supporting live runs for newly submitted URL pairs on the exact same code path.

---

## 5. Security & Error Handling
- Never hardcode or log API keys (`GROQ_API_KEY`).
- Always validate LLM responses with Pydantic schemas. Implement a 1-step repair retry on malformed JSON before throwing controlled errors.
- Always provide user-friendly error messages for invalid/private URLs, extraction timeouts, and rate limits.
