# Beautiful UI Design System & Component Guidelines

All frontend interfaces in the Agentic Dating platform must follow the AI-native design principles and component conventions of [Beautiful UI](https://www.beautifului.dev/).

## 1. Visual Aesthetics & Theme
- **Theme Archetype**: Premium Editorial / Warm AI Workspace.
- **Palette**:
  - Background: Warm off-white / light parchment (`#FBF9F5` / `#F8F6F0` or dark editorial equivalent if dark mode toggle is active).
  - Surface Cards: Pure white (`#FFFFFF`) or tinted slate with subtle 1px border (`#E5E0D8` / `#E2E8F0`).
  - Typography: Deep charcoal / near-black (`#18181B` / `#1A1A1A`) for high contrast readability. Muted text (`#71717A`).
  - Accent Colors: Sophisticated warm coral / blush rose (`#E11D48` / `#F43F5E`) or subtle amber for status accents.
- **Avoid**:
  - Cyberpunk / fluorescent neon lights.
  - Heavy or blurry glassmorphism that obscures text.
  - Generic SaaS bootstrap / bland admin dashboard styling.

## 2. Component Mapping Requirements

| Application View | Beautiful UI Component Pattern | UX Requirement |
| :--- | :--- | :--- |
| **Global Navigation** | `Sidebar Nav` / `Header Bar` | Clean tabbed navigation across Home, Create Agent, Live Date, Rankings, 25-Person Demo. |
| **New Person Ingestion** | `Prompt Bar` + `Task Rows` | Dual URL input (LinkedIn + Instagram) with live stepped extraction progress indicators. |
| **Source Evidence** | `Context Cards` | Distinct side-by-side cards for extracted LinkedIn and Instagram evidence chunks. |
| **Profile Analysis** | `Thinking` + `Insight Cards` | Safe high-level thinking badge + modular trait cards (Needs, Hobbies, Lifestyle, Style). |
| **Agent Creation** | `Task Rows` + `Tool Chips` | Step-by-step pipeline status showing agent initialization and candidate discovery. |
| **Live Agent Date** | `Agent Screen` + `Chat` + `Streaming Text` | Dual-avatar header, turn-by-turn conversational bubbles, streaming token animation, live compatibility signal ticker. |
| **Date Outcome** | `Recommendation Card` | Final compatibility score badge (0-100), key match verdict, and strongest connection breakdown. |
| **Rankings & Network** | `Records Table` + `Filter Table` | Sortable match table with scores, shared tags, and instant click-to-view date transcript modal/page. |
| **Agent Architecture** | `Flowchart` | Visual diagram of the 9-stage pipeline from ingestion to ranking. |

## 3. Privacy of Chain-of-Thought in UI
- **Never render raw LLM scratchpads or hidden CoT to the UI.**
- Use the `Thinking` component strictly for user-safe, human-readable status updates:
  - ✅ *"Analyzing shared creative interests..."*
  - ✅ *"Synthesizing communication compatibility..."*
  - ❌ *"Evaluating if User A is desperate based on token #4..."*

## 4. Licensing & Attribution
- Beautiful UI components are MIT licensed.
- Retain MIT license notices in source headers where component patterns are directly utilized.
