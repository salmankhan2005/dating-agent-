---
name: beautiful-ui-components
description: >-
  Guide for implementing and integrating Beautiful UI AI-native components (Agent Screen, Chat, Streaming Text, Thinking,
  Context Cards, Insight Cards, Task Rows, Prompt Bar, Recommendation Card, Records Table, Filter Table, and Flowchart)
  for the Agentic Dating web application.
---

# Beautiful UI Component Implementation Guide

This skill details how to structure, style, and integrate the AI-native component patterns from [Beautiful UI](https://www.beautifului.dev/).

---

## 1. Core Component Catalogue

### 1.1 Agent Screen (`AgentScreen.tsx`)
- **Purpose**: Full-bleed immersive container for live agent-to-agent interactions.
- **Layout**:
  - Header: Split avatar profile cards for Agent A and Agent B with status pulse indicators.
  - Body: Scrollable central chat area with streaming tokens.
  - Side Panel / Drawer: Dynamic `Insight Cards` showing real-time extracted compatibility signals.

### 1.2 Chat & Streaming Text (`Chat.tsx`, `StreamingText.tsx`)
- **Purpose**: Displays the multi-turn simulated date conversation with real-time text appearance.
- **Features**:
  - Distinct message bubbles:
    - Agent A: Left aligned, subtle slate container with speaker badge.
    - Agent B: Right aligned, subtle warm rose/coral container with speaker badge.
  - Smooth typewriter/token streaming effect for active speaking turns.

### 1.3 Thinking Badge (`Thinking.tsx`)
- **Purpose**: Non-intrusive, safe progress indicator showing high-level agent cognition without exposing private chain-of-thought.
- **Visuals**: Animated pulse orb + concise status message (e.g. *"Synthesizing lifestyle alignment..."*).

### 1.4 Context Cards (`ContextCards.tsx`)
- **Purpose**: Visualizes the two strict public sources (LinkedIn & Instagram) with source badges, direct links, and extracted snippet quotes.
- **Format**:
  - LinkedIn Card: Professional headline, experience highlights, verified badge.
  - Instagram Card: Bio excerpts, public interests, photo caption tags.

### 1.5 Insight Cards (`InsightCards.tsx`)
- **Purpose**: Compact modular cards categorizing person traits and compatibility dynamics.
- **Variants**:
  - `Needs & Preferences`
  - `Hobbies & Lifestyle`
  - `Communication Style`
  - `Positive Synergy` / `Potential Friction`

### 1.6 Task Rows (`TaskRows.tsx`)
- **Purpose**: Visual pipeline stepper when ingesting a new profile or running a date.
- **States**: `pending`, `running` (with spinner), `completed` (check icon), `error` (alert badge).
- **Default Steps**:
  1. Validate LinkedIn URL
  2. Validate Instagram URL
  3. Extract Public Text
  4. Synthesize Person Profile
  5. Instantiate Agent
  6. Match Candidates
  7. Run Simulation
  8. Compute Rankings

### 1.7 Prompt Bar (`PromptBar.tsx`)
- **Purpose**: Polished floating or anchored input container for entering dual URLs (LinkedIn + Instagram) with keyboard shortcut support and quick validate action.

### 1.8 Recommendation Card (`RecommendationCard.tsx`)
- **Purpose**: High-impact match summary card for the top-ranked compatibility pair.
- **Elements**: Circular compatibility gauge (0-100), key compatibility highlights, date summary, and CTA to replay date.

### 1.9 Records Table & Filter Table (`RecordsTable.tsx`)
- **Purpose**: Clean, high-density leaderboard displaying all candidate rankings with sortable columns:
  - Rank, Avatar & Name, Composite Score, Date Score, Shared Interests, Action ("View Date").

---

## 2. Style Tokens & Tailwind Classes

```css
/* Warm Editorial Theme Variables */
:root {
  --bg-primary: #FBF9F5;
  --bg-surface: #FFFFFF;
  --bg-subtle: #F3EFEA;
  --border-color: #E6E1DA;
  --text-primary: #18181B;
  --text-muted: #71717A;
  --accent-coral: #E11D48;
  --accent-coral-soft: #FFE4E6;
  --accent-amber: #D97706;
}
```

---

## 3. Best Practices
1. **Dynamic Data Binding**: Ensure components receive live state from React Query / SWR / FastAPI rather than hardcoded mock strings.
2. **Animation Restraint**: Use subtle transitions (`transition-all duration-200 ease-out`) rather than distracting continuous loops.
3. **Accessibility**: Maintain WCAG AA contrast ratio between charcoal text and warm off-white surfaces.
