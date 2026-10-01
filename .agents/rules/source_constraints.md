# Strict Source Constraints & Data Privacy Rules

These rules govern how data is extracted, ingested, and processed for all candidate profiles in the Agentic Dating platform.

## 1. Allowed Data Sources
Each person entity may only be derived from:
1. **Official Public LinkedIn Profile URL**
2. **Verified Public Instagram Profile URL**

## 2. Strict Enrichment Prohibition
- **No Third-Party Enrichment**: Absolutely no querying of Google Search, Wikipedia, GitHub, X (Twitter), YouTube, Crunchbase, news sites, or blog posts.
- **No LLM Prior Knowledge Injection**: The LLM must be instructed in its system prompts to disallow any external recollection or hallucination about known or public figures.
- **No Synthetic Persona Fabrication**: Real profiles must contain real extracted text or verified seed data from these two sources.

## 3. Privacy, Safety & Ethical Guidelines
- **No Sensitive Traits**: Never infer, prompt for, or evaluate sensitive protected traits (sexual orientation, religious beliefs, medical history, ethnicity, political affiliations) unless explicitly stated in the public source content.
- **Explicit vs. Inferred**: Always distinguish direct factual quotes (e.g. job title, stated hobbies in bio) from reasonable non-sensitive inferences (e.g. conversational style, creative inclination).
- **Graceful Handling of Unknowns**: If information is missing or ambiguous, explicitly set the field to `null` or `"unknown"`.

## 4. Extraction & Anti-Scraping Compliance
- Only access publicly readable pages.
- Do not bypass authentication walls, login prompts, CAPTCHAs, or anti-bot mechanisms.
- If a target Instagram account is private or LinkedIn is behind an authentication gate that fails public render, fail fast with a descriptive error code:
  - `PROFILE_PRIVATE`: Target account is private.
  - `PROFILE_UNAVAILABLE`: Profile not reachable or deleted.
  - `EXTRACTION_EMPTY`: Public page did not yield readable profile content.
