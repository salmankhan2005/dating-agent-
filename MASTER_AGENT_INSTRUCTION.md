# MASTER AGENT INSTRUCTION — AGENTIC DATING PLATFORM

You are an autonomous senior full-stack engineer and AI-agent architect. Build a complete, working MVP for the Agentic Dating assignment described below.

## PRIMARY OBJECTIVE

Build a real agentic dating website where:
1. Each real person is represented by an AI agent.
2. Each person's agent is created ONLY from that person's supplied public LinkedIn profile and public Instagram profile.
3. The agent analyzes the person and produces a structured profile.
4. Agents date other agents on behalf of their people.
5. The agents hold an actual multi-turn conversation.
6. The system evaluates the date.
7. Every person receives a ranking of the other people based on the dating interactions.
8. The website is fully functional, not a static mockup.
9. A pre-run demo containing at least 25 real people is included.
10. A user can also paste a new LinkedIn URL and public Instagram URL and run the same pipeline.

## NON-NEGOTIABLE SOURCE RULE

For every person, exactly TWO information sources may be used:
- The person's public LinkedIn profile.
- The person's public Instagram profile.

Do NOT enrich the person from:
- Google search
- Wikipedia
- GitHub
- X/Twitter
- YouTube
- news articles
- third-party biographies
- other social networks
- external profile databases
- LLM prior knowledge

The LLM must only receive extracted/validated content originating from those two supplied URLs.

Do not bypass authentication, CAPTCHAs, private profiles, access controls, or anti-bot protections. If a profile cannot be accessed publicly, report the failure clearly.

Do not fabricate source content, identities, URLs, or personal facts.

## RECOMMENDED ARCHITECTURE

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Python
- FastAPI
- Pydantic

AI:
- Groq API
- Use a suitable Groq-hosted chat model available through the API.
- Keep the model configurable through an environment variable.

Extraction:
- Playwright for public-page rendering.
- BeautifulSoup or equivalent HTML cleaning where useful.

Storage:
- SQLite for the MVP.
- JSON seed/demo data may be included for the pre-run demo.

Deployment should be straightforward and documented.

## SYSTEM FLOW

Implement this exact conceptual flow:

LinkedIn URL + Instagram URL
        ↓
Public source extraction
        ↓
Source validation and cleaning
        ↓
Person analysis
        ↓
Structured Agent Profile
        ↓
Person Agent
        ↓
Candidate matching
        ↓
Agent-to-agent dating conversation
        ↓
Date evaluation
        ↓
Compatibility score
        ↓
Per-person rankings

## PERSON PROFILE

Create a structured profile containing only evidence-supported information:

- name
- professional/background summary
- needs
- hobbies
- interests
- lifestyle signals
- communication style
- explicit preferences if publicly stated
- conversation topics
- positive compatibility signals
- potential incompatibility signals
- confidence/evidence notes
- concise agent summary

Important:
- Do not infer sensitive characteristics.
- Do not invent facts.
- Distinguish explicit evidence from reasonable non-sensitive interpretation.
- If something is unknown, mark it unknown.

## AGENT BEHAVIOR

Create a reusable DatingAgent abstraction.

The agent must:
1. Understand its person's profile.
2. Represent that person's interests and preferences.
3. Introduce itself naturally.
4. Ask meaningful questions.
5. Respond to the other agent.
6. Reference only information supported by the person's two source profiles.
7. Avoid pretending to know facts not contained in the source-derived profile.
8. Evaluate the conversation after the date.

The agent should NOT simply output a similarity percentage.

## ACTUAL AGENT-TO-AGENT DATING

This is a core grading requirement.

Create a visible multi-turn conversation such as:

Agent A:
"What kind of projects do you enjoy working on outside your main work?"

Agent B:
"Mostly creative projects and photography. I also enjoy exploring new places."

Agent A:
"That's interesting. I noticed travel is something I enjoy too. Do you prefer planned trips or spontaneous ones?"

The conversation must be generated dynamically by the agents.

Show:
- Agent A
- Agent B
- messages
- turn progression
- date status
- compatibility signals
- final date evaluation

Do not fake the transcript as static text.

## DATE EVALUATION

After the conversation, produce structured evaluation:

- shared interests
- lifestyle compatibility
- communication compatibility
- curiosity/engagement
- complementary traits
- potential friction
- strongest connection
- date summary
- compatibility score

Do not claim certainty about romantic compatibility. Treat the result as an AI-generated compatibility assessment based only on available public-source evidence and the simulated conversation.

## RANKING

For each person, rank other people.

Use a transparent scoring mechanism.

Example:

- Interest compatibility: 25%
- Lifestyle compatibility: 20%
- Communication compatibility: 20%
- Explicit preference compatibility: 20%
- Date interaction quality: 15%

Make the weights configurable.

The final ranking should use the actual date evaluation rather than only static profile similarity.

Do not expose hidden chain-of-thought. Show concise reasons/evidence instead.

## PERFORMANCE STRATEGY

Do NOT run 300 full conversations for 25 people.

Use a two-stage approach:
1. Fast candidate pre-screening from structured profiles.
2. Run actual agent-to-agent dates for the top 3–5 candidates per person.

For the demo, cache completed results so the demo loads quickly.

The same underlying code path should support both:
- precomputed 25-person demo
- newly supplied profiles

## REQUIRED WEBSITE PAGES

### 1. Landing page

Show:
- product name
- short explanation
- "How it works"
- CTA to create a person
- CTA to open 25-person demo

### 2. Add Person

Inputs:
- LinkedIn public URL
- Instagram public URL

Buttons:
- Validate
- Analyze Person

Show extraction progress.

### 3. Person Profile

Display:
- name
- source links
- needs
- hobbies
- interests
- lifestyle
- communication style
- compatibility signals
- agent summary

Clearly identify that the analysis came from exactly two supplied sources.

### 4. Agent Date

Display:
- two agent identities
- live conversation
- turn-by-turn messages
- current date status
- extracted compatibility signals
- final date evaluation

This must be the visual centerpiece of the application.

### 5. Rankings

For a selected person show:
- ranked matches
- score
- shared interests
- date score
- short reason for placement

Clicking a match should open their profile and/or date.

### 6. Demo

Create a finished, already-run example with at least 25 real people.

The demo must not require the reviewer to manually enter all 25 people.

## DEMO DATA REQUIREMENT

Create a seed dataset containing at least 25 real people.

Each entry must contain:
- real person's name
- official/public LinkedIn URL
- public Instagram URL

Verify that the Instagram account is public at the time the dataset is prepared.

Do not fabricate accounts.

Do not use fan accounts.

Do not substitute other sources.

Store source URLs in a clear demo dataset file.

If automated extraction is unavailable for a source during runtime, allow the demo to use previously extracted/cached source content that was genuinely obtained from those same two URLs.

## UI DESIGN

Use a premium editorial product-design aesthetic.

Avoid:
- cyberpunk
- neon
- excessive gradients
- generic SaaS dashboard appearance
- unnecessary glassmorphism

Prefer:
- warm/off-white background
- deep charcoal typography
- generous whitespace
- strong editorial headings
- subtle borders
- restrained accent color
- polished cards
- smooth but minimal animations

The dating conversation should feel like the central product experience.

## BACKEND API

Implement at minimum:

POST /api/people/analyze
POST /api/dating/run
GET /api/people/{person_id}
GET /api/rankings/{person_id}
GET /api/demo

Use Pydantic request/response models.

Add clear error responses.

## DATABASE

Use SQLite with tables/models equivalent to:

people
- id
- name
- linkedin_url
- instagram_url
- linkedin_content
- instagram_content
- profile_json
- created_at

dates
- id
- person_a
- person_b
- transcript_json
- evaluation_json
- score
- created_at

## SECURITY AND CONFIGURATION

Use environment variables.

Required example variables:

GROQ_API_KEY=
GROQ_MODEL=
DATABASE_URL=

Never hardcode API keys.

Do not expose API keys to the frontend.

Add .env.example.

## ERROR HANDLING

Handle:
- invalid LinkedIn URL
- invalid Instagram URL
- private Instagram profile
- inaccessible page
- empty extraction
- insufficient content
- Groq API errors
- malformed LLM JSON
- rate limits
- timeout
- duplicate person
- duplicate URL

Return useful messages to the UI.

## LLM OUTPUT

Prefer structured JSON output.

Validate every LLM response with Pydantic.

If parsing fails:
1. retry once with a repair prompt
2. if still invalid, return a controlled error

Never silently invent missing fields.

## PROMPT FILES

Create separate prompt templates for:

1. person_analysis
2. agent_system
3. date_conversation
4. date_evaluation
5. ranking

Keep prompts versioned and easy to edit.

## OBSERVABILITY

Log:
- extraction status
- agent creation
- date ID
- participants
- model used
- errors
- execution duration

Do not log API keys.

## REPOSITORY

Create:

agentic-dating/
├── frontend/
├── backend/
├── data/
├── prompts/
├── README.md
├── AI_USAGE.md
├── .env.example
└── .gitignore

README must include:
- project overview
- architecture
- setup
- environment variables
- local development
- demo instructions
- deployment
- source restrictions
- agent workflow
- API endpoints

AI_USAGE.md must explain:
- where AI was used
- what the AI generated
- how prompts were designed
- what was manually implemented
- limitations



## REQUIRED UI/UX COMPONENT SOURCE — BEAUTIFUL UI

Use Beautiful UI as the primary source of AI-agent interface patterns and components:
https://www.beautifului.dev/

Beautiful UI currently provides AI-native primitives including:
- Loading State
- Thinking
- Streaming Text
- Approval Card
- Tool Chips
- Task Rows
- Chat
- Prompt Bar
- Recommendation Card
- Context Cards
- Records Table
- Filter Table
- Sidebar Nav
- Search
- Flowchart
- Insight Cards
- Code Block
- Selection Actions
- Agent Screen

Use these component patterns throughout the agent experience instead of inventing unrelated generic dashboard widgets.

### Component mapping for this assignment

HOME / DASHBOARD
- Sidebar Nav
- Search
- Records Table

PROFILE ANALYSIS
- Loading State while LinkedIn/Instagram are being processed
- Thinking or analysis-state presentation for the analysis pipeline
- Context Cards for the two source-derived evidence sections
- Insight Cards for summarized traits/signals

AGENT CREATION / WORKFLOW
- Task Rows for:
  1. Validate LinkedIn
  2. Validate Instagram
  3. Extract public content
  4. Analyze person
  5. Create dating agent
  6. Find candidates
  7. Run dates
  8. Evaluate dates
  9. Build rankings
- Tool Chips for visible extraction/agent tool activity
- Flowchart for the overall agent pipeline

LIVE AGENT DATE
- Agent Screen as the primary immersive agent view when appropriate
- Chat for Agent A ↔ Agent B conversation
- Streaming Text for messages being generated
- Thinking component for compact, user-safe activity status; NEVER expose hidden chain-of-thought
- Context Cards for source-derived compatibility evidence
- Recommendation Card for "date outcome" / match recommendation
- Insight Cards for compatibility signals

RANKINGS
- Records Table for the full ranking list
- Recommendation Card for the selected top match
- Insight Cards for why a candidate matched
- Selection Actions for opening profile/date details

NEW PERSON INPUT
- Prompt Bar style URL input/composer
- Loading State
- Task Rows
- Context Cards
- Clear success/error state

### Beautiful UI implementation rules

1. Prefer the existing Beautiful UI primitives/styles/patterns where the project can legally and technically use them.
2. The Beautiful UI site states its components are MIT licensed; retain required license/copyright notices when copying substantial source code. Do not remove attribution/license text from copied code.
3. Do not claim a component was imported from a package if it was actually reimplemented from the site's documented pattern. Be accurate in README documentation.
4. Preserve accessibility and responsive behavior.
5. Keep the agent conversation visually dominant.
6. Avoid generic AI dashboard styling where a Beautiful UI component already addresses the interaction.
7. Do not expose private chain-of-thought. A "Thinking" UI may show safe high-level status such as "Comparing interests" or "Evaluating conversation signals", not hidden reasoning.
8. Keep all actual data dynamic. Components are presentation; they must be connected to the FastAPI/Groq pipeline.

### Design direction

Use Beautiful UI's AI-native interaction language as the visual foundation, with:
- warm editorial background
- charcoal typography
- restrained accent color
- subtle borders
- generous whitespace
- premium motion
- clear agent states
- high information density only where it improves the demo

The result should feel like a polished AI-agent product, not a static template gallery.

## DEMO-FIRST REQUIREMENT

Before polishing the UI, make this flow work end-to-end:

25 people
→ profiles
→ agents
→ candidate selection
→ actual agent dates
→ evaluations
→ rankings

Then make the UI polished.

## FINAL ACCEPTANCE TEST

Before declaring the project complete, test:

1. A new LinkedIn + Instagram pair can be submitted.
2. Public content is extracted.
3. A structured profile is generated.
4. A person agent is created.
5. Two agents can actually converse.
6. The conversation is visible in the UI.
7. The date receives an evaluation.
8. Rankings are generated.
9. The 25-person demo loads.
10. The demo contains at least 25 real people.
11. Each demo person has exactly two source URLs.
12. No external profile enrichment is used.
13. API keys are not exposed.
14. README and AI_USAGE.md exist.
15. The app can be run by another developer from the repository.

## IMPORTANT EXECUTION RULE

Do not stop after creating mockups, schemas, or placeholder screens.

Implement the working system.

If a feature cannot be fully implemented within the available time, prioritize in this order:

1. Real two-source ingestion
2. Person analysis
3. Actual agent-to-agent dating
4. Date evaluation
5. Rankings
6. 25-person demo
7. Live new-person flow
8. UI polish
9. Documentation

The final result must be demonstrable in under 3 minutes and must clearly show that the agents are actually dating on behalf of real people.
