# BEAUTIFUL UI IMPLEMENTATION GUIDE

Reference:
https://www.beautifului.dev/

Beautiful UI is the primary UI reference for the agent experience.

## Assignment-to-component mapping

| Product area | Beautiful UI component |
|---|---|
| Source ingestion | Loading State, Task Rows |
| Source evidence | Context Cards |
| Agent analysis | Thinking, Insight Cards |
| Agent tools/activity | Tool Chips |
| Agent conversation | Chat, Streaming Text |
| Full agent workspace | Agent Screen |
| New profile input | Prompt Bar |
| Date outcome | Recommendation Card |
| Compatibility signals | Insight Cards |
| Ranking | Records Table, Filter Table |
| Navigation | Sidebar Nav |
| Agent workflow | Flowchart |
| Search people | Search |

## Important

Use the site's component patterns and source where appropriate, but keep the implementation truthful. Do not fabricate functionality merely because a UI component exists.

The live date must actually stream messages from the backend.

The ranking table must use real calculated results.

The profile analysis must come from the two allowed public sources.

The "Thinking" UI must show only safe, high-level status text, never private chain-of-thought.

The Beautiful UI license page states the components are MIT licensed. Retain the required license/copyright notice for substantial copied code:
https://www.beautifului.dev/license
