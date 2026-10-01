---
name: demo-network-management
description: >-
  Procedures and scripts for preparing, verifying, seeding, and caching the 25-person real profile network dataset
  with verified public LinkedIn and public Instagram sources for rapid demo execution.
---

# Demo Network Management Skill

This skill explains how to manage the required 25-person precomputed demo dataset for the Agentic Dating platform.

---

## 1. Demo Dataset Requirements

Every entry in the demo network must satisfy:
1. **Real Person**: A real individual with genuine public presence.
2. **Public LinkedIn URL**: An accessible, valid public LinkedIn profile URL.
3. **Public Instagram URL**: An active, public Instagram handle/URL.
4. **No Synthetic Sources**: No enrichment from Wikipedia, personal websites, or unverified social platforms.
5. **Precomputed Artifacts**:
   - Extracted source text (cached for deterministic, instantaneous offline demo playback).
   - Structured `PersonProfile` JSON.
   - Pre-simulated top match date transcripts.
   - Pre-calculated ranking matrices.

---

## 2. Seed Data File Structure (`data/demo_seed.json`)

```json
[
  {
    "id": "person-01",
    "name": "Sarah Jenkins",
    "linkedin_url": "https://www.linkedin.com/in/sarah-jenkins-demo",
    "instagram_url": "https://www.instagram.com/sarahj_creative",
    "cached_linkedin_content": "Product Designer specializing in AI interfaces...",
    "cached_instagram_content": "Ceramics on weekends ☕️ | Coffee enthusiast | Exploring urban architecture",
    "profile": {
      "professional_summary": "Lead Product Designer focused on generative AI workflows.",
      "needs": ["Work-life balance", "Creative stimulation"],
      "hobbies": ["Ceramics", "Specialty Coffee", "Urban Architecture Photography"],
      "interests": ["Design Systems", "AI UX", "Minimalism"],
      "lifestyle_signals": ["Morning routine", "Weekend studio sessions", "City explorer"],
      "communication_style": "Reflective, inquisitive, warm",
      "explicit_preferences": ["Enjoys spontaneous weekend road trips", "Prefers quiet cafes"],
      "conversation_topics": ["Ceramic pottery techniques", "Ethical AI design", "Pour-over brews"],
      "positive_compatibility_signals": ["Values craft and visual aesthetics", "Open to new artistic hobbies"],
      "potential_incompatibility_signals": ["Dislikes crowded noisy clubs"],
      "evidence_notes": ["LinkedIn confirms 8 yrs design experience; Instagram shows ceramic studio work."],
      "agent_summary": "A thoughtful product designer with a passion for handcrafted ceramics and coffee culture."
    }
  }
]
```

---

## 3. Seeding Workflow

1. **Verification**: Run URL verification script to check HTTP accessibility.
2. **Database Population**: On FastAPI startup or seed command (`python -m backend.seed`), populate SQLite database `people` and `dates` tables if empty.
3. **Instant API Response**: The `/api/demo` endpoint serves the pre-cached graph and rankings without requiring live LLM calls, ensuring sub-second response times for review demos.
4. **Live Ingestion Parity**: Newly submitted profiles via `/api/people/analyze` join the active network seamlessly and can date any of the 25 demo agents.
