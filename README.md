# FORESIGHT

> **Built with the [BMad Method](https://github.com/bmadcode/BMAD-METHOD)** — a structured AI-assisted development workflow that guided this project from brainstorming and PRD creation through architecture, epic/story planning, and iterative implementation. Every planning artifact, story file, and implementation contract in `_bmad-output/` was produced by BMad agents (PM, Architect, SM, Dev, QA) running inside Cursor.

---

**"See what happens before you decide."**

FORESIGHT is a browser-based **visual A/B decision simulator** for small business owners who face everyday either/or choices without a data team or advisor. Enter a concrete decision and a few lines of business context; FORESIGHT runs **two parallel simulations** (Path A vs Path B) through four independent LLM-backed agents and delivers a **split-screen consequence experience** — live agent activity, adaptive visualization, a KPI comparison dashboard, and a deep-dive narrative — all before you commit to anything.

**Hackathon context:** Built at the Cursor Hackathon · IE University · March 2026 (organized by TechIE × Building and Tech, sponsored by Cursor). Challenge: *Make one person's hard day easier.*

Live deployment: **[https://foresight-web.vercel.app](https://foresight-web.vercel.app)**

---

## Table of Contents

1. [What Makes This Special](#what-makes-this-special)
2. [Tech Stack](#tech-stack)
3. [How It Works](#how-it-works)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Development Workflow](#development-workflow)
7. [Deployment](#deployment)
8. [Demo Scenarios](#demo-scenarios)
9. [API Contract](#api-contract)
10. [Project Structure](#project-structure)
11. [BMad Artifacts](#bmad-artifacts)
12. [Build Status](#build-status)

---

## What Makes This Special

| Differentiator | Detail |
|----------------|--------|
| **Multi-agent isolation** | Four agents per path predict independently — no agent sees another's output. Results are *emergent*, not a single model doing "optimistic vs pessimistic." |
| **Visual-first product** | The simulation *is* the interface — animated Agent HUD, mode-specific canvases, timed transitions — not a chat transcript with charts bolted on. |
| **Adaptive visualization** | A backend classifier routes each decision to **Map** (geo/foot-traffic/local-market), **Flow** (budget/resources/time), or **Network** (partnerships/stakeholders), with FallbackViz for any edge case. |
| **A/B framing** | Side-by-side panels use the user's exact wording, not generic "Scenario A/B." |
| **Credible failure posture** | Cached golden replay + FallbackViz protect live demos; the product completes gracefully even when the LLM provider is unavailable. |
| **Transparency** | Confidence signals distinguish user-supplied context from assumed data (FR28). Outputs are framed as *simulated consequences*, never advice. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| Maps | react-map-gl 8 + Mapbox GL JS 3 |
| AI / LLM | OpenAI SDK 6 (server-side only) |
| Concurrency | p-limit 7 (parallel agent calls) |
| Testing | Vitest 4 + Testing Library |
| Hosting | Vercel (serverless, free tier) |

### Design tokens (dark command-center theme)

```
--bg:       #0F1923   --surface:  #1B2838   --border:   #2A3A4A
--accent:   #00D4AA   --blue:     #2196F3   --red:      #FF4757
--gold:     #FFD700   --warm:     #FF6B35   --purple:   #7B68EE
--text:     #F0F4F8   --text-dim: #8892A0
```

Fonts: **Space Grotesk** (headings), **DM Sans** (body/labels), **JetBrains Mono** (KPI numbers).

---

## How It Works

### Four UI states

```
[Input] → [Running] → [Dashboard] → [Deep Dive]
```

1. **Input** — User enters an either/or decision + up to 5 context fields (industry, revenue, location, customer base, details), then taps *Simulate My Decision*.
2. **Running** — Three-panel split screen: Path A canvas | center Agent HUD | Path B canvas. Four agents progress `dormant → thinking → insight → complete` per path. A mode badge shows the active visualization type.
3. **Dashboard** — Six KPI cards (Revenue Impact, Risk, Customer Impact, Operating Costs, Competitive Exposure, What You'd Miss), per-path score rings, and winner cues settle with count-up animations.
4. **Deep Dive** — Tabbed Path A / Path B narrative, month-by-month story with colored attribution dots per agent.

### Backend orchestration (`POST /api/simulate`)

```
Parse + classify viz_type (1 LLM call)
  ↓
8 parallel agent calls (4 agents × 2 paths) — agents are isolated per path
  ↓
2 synthesis calls (one per path)
  ↓
KPI scoring + winner derivation
  ↓
Structured JSON response → client render
```

~11 LLM calls per decision · target ~5–8s backend · ~€0.10–0.30 per run.

### Adaptive visualization

| `viz_type` | Decision class | Agent roles |
|-----------|----------------|-------------|
| `map` | Geo / foot traffic / local market | Customer · Competitor · Market · Cash Flow |
| `flow` | Budget / resource / investment | Resource Impact · Opportunity Cost · Market Timing · Cash Flow |
| `network` | Partnership / stakeholder | Stakeholder · Partnership · Ecosystem · Risk-Reward |
| `fallback` | Any (graceful degradation) | 4-node diamond animation |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key (or compatible LLM provider)
- A Mapbox public token (for Map mode)

### Install and run

```bash
git clone https://github.com/your-org/foresight.git
cd foresight
npm install
cp .env.example .env.local   # then fill in values — see section below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

### Build check

```bash
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values below. The file is gitignored; `.env.example` is tracked as a reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_API_KEY` | Yes | Server-side OpenAI (or compatible) API key — **never** exposed to the browser. |
| `LLM_MODEL_PARSE_CLASSIFY` | No | Model for parse/classify step. Default: `gpt-4o-mini`. |
| `LLM_MODEL_AGENT` | No | Model for the 8 agent calls. Default: `gpt-4o-mini`. |
| `LLM_MODEL_SYNTHESIS` | No | Model for the 2 synthesis calls. Default: `gpt-4o-mini`. |
| `SIMULATION_TIMEOUT_MS` | No | Per-run timeout in milliseconds. Default: `30000`. |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Map mode | Public Mapbox token for `react-map-gl` in the browser. URL-restrict in the Mapbox dashboard. |
| `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY` | No | Set `"true"` to enable the cached golden replay fallback (recommended for demos). |
| `NEXT_PUBLIC_PUBLIC_DEMO_SCENARIO_ID` | No | Expose one demo button to all users. Values: `demo-map-v1` \| `demo-flow-v1` \| `demo-network-v1`. |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL for OG tags / absolute links. |

Secrets (`LLM_API_KEY`, `MAPBOX_ACCESS_TOKEN`) must exist only in server-side config and Vercel environment settings — never in client bundles.

---

## Development Workflow

This project follows the branch strategy from [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md):

| Branch | Role |
|--------|------|
| `main` | Integration branch — open all PRs here. |
| `live` | Production branch — merge `main → live` to ship. |

```bash
git checkout main && git pull
git checkout -b feature/short-description
# ... work ...
git push -u origin feature/short-description
# open PR into main
```

PR checks: typecheck + lint + build must pass. Run a smoke test per viz mode before merging to `live`.

---

## Deployment

The project is deployed on Vercel as **`foresight-web`**.

**Production URL:** [https://foresight-web.vercel.app](https://foresight-web.vercel.app)

Vercel is configured to track the `live` branch for production. Pushes to `main` create preview deployments.

### Manual production deploy (CLI)

```bash
npx vercel deploy --prod
```

### Required Vercel environment variables

Set all variables from the table above in **Vercel → Settings → Environment Variables** for the Production environment. In particular: `LLM_API_KEY`, `LLM_MODEL_*`, `SIMULATION_TIMEOUT_MS`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY`.

---

## Demo Scenarios

Three canned scenarios are built in to prove classifier → viz_type routing:

| ID | Decision | `viz_type` | Who |
|----|----------|-----------|-----|
| `demo-map-v1` | *€500 Instagram ads vs cross-promo with Café Central* | `map` | Elena, Malasaña bakery |
| `demo-flow-v1` | *Upgrade the oven (€2K) vs hire part-time social help* | `flow` | Elena, production vs presence |
| `demo-network-v1` | *Join the local business association vs stay independent* | `network` | Elena, shared delivery vs solo |

Use these for rehearsal, judge demos, and offline cached replay. The golden replay plays the same animations even when the LLM provider is unavailable.

### 60-second demo script

1. Open the app; navigate to demo scenario 1 (Map).
2. Tap *Simulate My Decision* — show the split-screen HUD and Map canvases animating in parallel.
3. Dashboard lands — point to KPI cards, score rings, winner badge.
4. Open *Read Full Story* — show the tabbed narrative with agent attribution.
5. Switch to demo 2 (Flow) — highlight the `flow` mode badge.
6. Mention demo 3 (Network) exists; if time allows, show it.

---

## API Contract

### `POST /api/simulate`

**Request**

```json
{
  "decision": "Should I invest in Instagram ads or partner with Cafe Central?",
  "context": {
    "industry": "bakery",
    "monthlyRevenue": 3000,
    "location": "Malasana, Madrid",
    "customerBase": "200 regulars",
    "details": "Foot traffic heavy, limited marketing budget"
  },
  "options": {
    "stream": false,
    "useCachedOnFailure": true,
    "demoScenarioId": "demo-map-v1"
  }
}
```

**Response (canonical)**

```json
{
  "runId": "run_01HXYZ...",
  "status": "completed",
  "viz_type": "map",
  "path_labels": { "A": "Invest in Instagram ads", "B": "Partner with Cafe Central" },
  "progress": {
    "agents_per_path": 4,
    "agent_states": {
      "A": ["complete", "complete", "complete", "complete"],
      "B": ["complete", "complete", "complete", "complete"]
    }
  },
  "paths": {
    "A": {
      "agents": [
        { "role": "customer", "insight": "...", "confidence": 0.72, "grounding": "mixed" }
      ],
      "synthesis": {
        "summary": "...",
        "timeline": [{ "month": 1, "narrative": "...", "drivers": ["customer", "cashflow"] }]
      },
      "kpis": {
        "revenueImpact": 12,
        "risk": 58,
        "customerImpact": 71,
        "operatingCosts": 43,
        "competitiveExposure": 50,
        "opportunityCost": "Potentially miss local referral momentum",
        "overallScore": 67
      }
    },
    "B": { "agents": [], "synthesis": {}, "kpis": {} }
  },
  "comparison": {
    "winnerByKpi": { "revenueImpact": "A", "risk": "B" },
    "overallWinner": "A"
  },
  "meta": {
    "latencyMs": 8120,
    "llmCalls": 11,
    "estimatedCostEur": 0.19,
    "fallbackUsed": false,
    "cachedReplay": false,
    "generatedAt": "2026-03-24T20:12:00Z"
  }
}
```

**Error response**

```json
{
  "runId": "run_...",
  "status": "error",
  "error": { "code": "PROVIDER_TIMEOUT", "message": "Live simulation unavailable.", "recoverable": true },
  "recovery": { "canUseCache": true, "fallbackViz": true }
}
```

Full integration contracts: [`docs/integration-contracts.md`](./docs/integration-contracts.md)

---

## Project Structure

```
src/
  app/                  # Next.js App Router (layout, page, API routes)
    api/simulate/       # POST /api/simulate — orchestrator route
  components/
    forms/              # DecisionForm, ContextFields, GlowButton
    shell/              # App shell, panel layout
    simulation/         # SimulationContainer, PanelHeader, ModeBadge, AgentHUD
    results/            # KPICard, ScoreRing, WinnerBadge
    narrative/          # DeepDivePanel (tabbed, attribution markers)
    viz/
      MapView/          # react-map-gl — geo/foot-traffic visualization
      FlowView/         # Resource pipeline animation
      NetworkView/      # Graph/stakeholder relationship visualization
      FallbackViz/      # Mode-agnostic fallback
  lib/
    agents.ts           # Agent role definitions and prompt logic
    types.ts            # Canonical TypeScript domain types
    orchestrator.ts     # Parallel execution + synthesis assembly
    cache.ts            # Client-side golden replay / bounded cache
_bmad-output/           # All BMad planning and implementation artifacts
  planning-artifacts/   # PRD, architecture, UX spec, epics
  implementation-artifacts/  # Per-story specs and progress notes
docs/
  DEPLOYMENT.md         # Branch strategy and Vercel setup
  integration-contracts.md  # API contract details
```

---

## BMad Artifacts

All planning documents generated during the BMad workflow live in `_bmad-output/`:

| Artifact | Path |
|----------|------|
| Product Requirements Document | `_bmad-output/planning-artifacts/prd.md` |
| Technical Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| UX Design Specification | `_bmad-output/planning-artifacts/ux-design-specification.md` |
| Epic & Story Breakdown | `_bmad-output/planning-artifacts/epics.md` |
| Implementation Readiness Report | `_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-24.md` |
| Sprint Status | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Deferred Work | `_bmad-output/implementation-artifacts/deferred-work.md` |

Story files in `_bmad-output/implementation-artifacts/` follow the naming convention `{epic}-{story}-{slug}.md` and contain the full context used by the Dev agent during implementation.

---

## Build Status

All six foundation epics are complete. Epic 7 (enhancements) is in progress.

| Epic | Title | Status |
|------|-------|--------|
| 1 | Foundation, contracts, scaffold | ✅ done |
| 2 | Simulate API route + agent orchestration | ✅ done |
| 3 | Decision form + FlowView visualization | ✅ done |
| 4 | MapView + mode badge + Deep Dive panel | ✅ done |
| 5 | Agent HUD + KPI stack + NetworkView + FallbackViz | ✅ done |
| 6 | End-to-end integration + cache + transparency + demo kit | ✅ done |
| 7 | Distrito data overlay, wizard input, agent transparency | 🔄 in progress |

Performance targets: simulation p75 ≤ 12s · backend p75 ≤ 8s · dashboard settle ≤ 3s.

---

*FORESIGHT — built in one day with BMad + Cursor.*
