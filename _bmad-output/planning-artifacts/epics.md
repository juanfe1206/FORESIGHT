---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/_extracted-foresight-master-spec.md
---

# FORESIGHT - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FORESIGHT, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

**Parallel delivery (4 developers):** Complete **Epic 1** first (contracts + mock data + layout shell). Then **Epics 2–5** run in parallel with the file-ownership boundaries listed under each epic. **Epic 6** is the integration and demo-hardening convergence where the team merges streams and validates end-to-end behavior.

## Requirements Inventory

### Functional Requirements

FR1: User can enter a single either/or business decision in natural language.
FR2: User can provide structured business context using the product's supported context fields (industry, monthly revenue, location, customer base, additional details — max 5 fields).
FR3: User can start a paired-path simulation (two alternatives evaluated together) via a single CTA ("Simulate My Decision").
FR4: System can derive distinct Path A and Path B descriptions consistent with the user's decision wording.
FR5: System can classify the decision into a visualization category (geo/market reach → MAP, resource allocation → FLOW, relationship/stakeholder → NETWORK) exposed as a stable `viz_type` identifier.
FR6: System can assign the agent role palette that matches the visualization category (MAP: Customer/Competitor/Market/Cash Flow; FLOW: Resource Impact/Opportunity Cost/Market Timing/Cash Flow; NETWORK: Stakeholder/Partnership/Ecosystem/Risk-Reward).
FR7: For each path, system can run multiple agent roles (4 per path) such that role outputs are not visible to other roles during prediction for that path.
FR8: For each path, system can produce structured JSON outputs per agent role suitable for visualization and synthesis.
FR9: For each path, system can synthesize agent role outputs into an integrated assessment including overall score, KPIs, narrative, and headline.
FR10: User can observe progress while both paths finish predicting (live status updates via SSE or polling).
FR11: User can see which agent roles are waiting, in progress, or complete during a run (Agent HUD with dormant → thinking → insight → complete states).
FR12: User can see which visualization category applies to the current run (mode badge: Map/Flow/Network).
FR13: User can view side-by-side consequence visualizations for Path A and Path B in a three-panel layout.
FR14: When the decision is location/reach/local-market weighted, user can view geography-oriented consequence depictions (MapView with business pin, customer dots, competitor pins, heat overlay, cash flow ticker).
FR15: When the decision is budget/resource/investment weighted, user can view flow-oriented consequence depictions (FlowView with resource pool, channel pipes, particles, outcome pools, leak points).
FR16: When the decision is partnership/stakeholder weighted, user can view relationship-oriented consequence depictions (NetworkView with business node, stakeholder nodes, relationship lines, ripple effects, sentiment halos).
FR17: User can still complete the core comparison flow if the preferred visualization mode is unavailable, using a simplified consequence visualization (FallbackViz — 4-node diamond animation).
FR18: After completion, user can view a dashboard comparing Path A and Path B across multiple outcome dimensions (6 KPI cards in center panel).
FR19: User can compare revenue-oriented outcome signals across paths (Revenue Impact: €+/- per month, count-up animation).
FR20: User can compare risk-oriented outcome signals across paths (Risk Score: 1–10 color bar, bar-fill animation).
FR21: User can compare customer-oriented outcome signals across paths (Customer Impact: +/- count, count-up animation).
FR22: User can compare operating cost-oriented outcome signals across paths (Operating Costs: € total, count-up animation).
FR23: User can compare competitive exposure-oriented outcome signals across paths (Competitive Exposure: Low/Med/High badge, slide-in animation).
FR24: User can view opportunity-cost phrasing ("What You'd Miss": one-sentence typewriter animation) where synthesis provides it.
FR25: User can view an overall per-path score summarizing relative attractiveness (circular progress ring with count-up number, 1–100).
FR26: User can open a deeper narrative view ("Read Full Story") that goes beyond the comparison dashboard (Deep Dive with center panel expansion, side panels compress to strips).
FR27: User can read path-specific narrative content with attribution to contributing agent perspectives (tabbed Path A/Path B narrative with colored dots per agent, month-by-month story).
FR28: User can see confidence/grounding signals that distinguish user-supplied context from generalized assumptions.
FR29: User encounters clear positioning that outputs are simulated consequences, not guaranteed forecasts or personalized professional advice.
FR30: User can complete the comparison experience using a stored full result (cached JSON from localStorage or golden scenario) when live execution is unavailable.
FR31: Integrator can request the same paired-path simulation using the same input envelope (POST /api/simulate) available through the primary user experience.

### NonFunctional Requirements

NFR-P1 (Time-to-insight): Hero simulation phase completes within 12 seconds at p75 under nominal provider latency.
NFR-P2 (Orchestration throughput): Full paired-path run completes end-to-end server work within 8 seconds at p75 under nominal conditions.
NFR-P3 (Client responsiveness): During primary run, UI remains interactive — no prolonged main-thread freeze that blocks navigation or cancellation affordances.
NFR-P4 (Results choreography): After synthesis completes, stable comparison dashboard reached within 3 seconds at p75.
NFR-S1 (Secrets): LLM credentials and map provider tokens exist only in server-side configuration; never embedded in client bundles or exposed to browser.
NFR-S2 (Transport): Production traffic uses HTTPS for all client–server communication.
NFR-S3 (Data minimization): System does not require storing structured simulation outputs in a persistent user account database for MVP; cache is bounded (size/TTL/overwrite).
NFR-A1 (Keyboard): Primary intake and run initiation are operable with keyboard (focusable controls, no keyboard traps).
NFR-A2 (Contrast): Default dark-theme text and interactive states meet WCAG 2.1 AA contrast for normal text on primary surfaces.
NFR-A3 (Motion): Product respects prefers-reduced-motion for non-essential decorative animations where feasible.
NFR-I1 (Provider degradation): If LLM provider fails mid-run, product can satisfy FR30 via stored/cached full results for demo continuity.
NFR-I2 (Mapping degradation): If map services fail or WebGL unavailable, degrade to non-map or simplified visualization without blocking comparison dashboard path.
NFR-I3 (Quota awareness): Optional third-party places/map usage stays within declared free-tier budgets (no silent runaway polling).

### Additional Requirements

- ADR-01: Next.js 14 App Router as unified frontend + API platform on Vercel (project scaffold, layout, routing, API routes).
- ADR-02: Single orchestrator endpoint (POST /api/simulate) for MVP simplicity and contract stability.
- ADR-03: Parallel isolated agent execution with per-path synthesis (8 parallel agent calls + 2 synthesis calls via Promise.all).
- ADR-04: viz_type as backend-owned routing decision to keep UI deterministic.
- ADR-05: Fallback and cache are first-class success paths, not exceptional UX.
- Environment variables required: LLM_API_KEY, LLM_MODEL_PARSE_CLASSIFY, LLM_MODEL_AGENT, LLM_MODEL_SYNTHESIS, MAPBOX_ACCESS_TOKEN, ENABLE_GOLDEN_REPLAY, SIMULATION_TIMEOUT_MS.
- Build/release controls: PR checks (typecheck + lint + build), smoke test per viz mode, pre-demo checklist.
- State management: Local React state + reducer; explicit state transitions (uiStage: input|running|dashboard|deepDive; runStatus: idle|submitting|inProgress|completed|fallback|error).
- Error handling strategy: Retry with jitter for provider timeouts; partial completion handling; cache replay; visualization fallback; honest messaging.
- Performance controls: Parallel agent calls with concurrency cap; lazy-load viz modules by viz_type; compact payloads; memoized rendering for KPI/panel components.
- Scoring/comparison module: KPI normalization and winner derivation logic.
- Telemetry module: Latency, error type, fallback reason, token/cost estimates per run.
- Input validation: Decision and context fields (length/type constraints).
- Output schema validation: Before client caching/render.
- Security: Route-level rate limits/burst protection; log redaction for sensitive free-text fields.
- Cost target: ~€0.10–0.30 per decision, ~11 LLM calls per run.
- TypeScript types in lib/types.ts synchronized with prompt contracts.
- Deployment: Vercel free tier; branch strategy (main integration, live production promotion) per docs/DEPLOYMENT.md.

### UX Design Requirements

UX-DR1: Implement design token system — color palette (--bg #0F1923, --surface #1B2838, --border #2A3A4A, --accent #00D4AA, --blue #2196F3, --red #FF4757, --gold #FFD700, --warm #FF6B35, --purple #7B68EE, --text #F0F4F8, --text-dim #8892A0) in globals.css / Tailwind theme extension.
UX-DR2: Implement typography system with Space Grotesk (headings, bold, tracking-tight, 24–36px), DM Sans (body/labels, regular/medium, 14–16px), JetBrains Mono (data/numbers, counters/scores) with defined hierarchy (H1 32–36px bold, H2 24–28px semibold, H3 18–20px semibold, body 14–16px, caption 12–13px, KPI numeric 20–28px mono).
UX-DR3: Implement 8px base spacing system (4/8/16/24/32/40/48 scale) with dense dashboard rhythm and strategic whitespace around KPI groupings.
UX-DR4: Build GlowButton component — accent (#00D4AA) filled, glow on hover (boxShadow with agent color, 1.5s), active/disabled/loading states, minimum 40px target height, loading state preserves width.
UX-DR5: Build ModeBadge component — visualization mode indicator pill ("🗺️ Map View — Location-based decision detected" format) with mode-specific accent tinting.
UX-DR6: Build PanelHeader component — user's exact decision text as path labels (never generic "Scenario A/B"), consistent height/alignment across states.
UX-DR7: Build AgentHUD component — 4 agent nodes with states (dormant gray → pulsing color → insight text → checkmark complete), fixed slot colors (Slot 1 #2196F3 blue, Slot 2 #FF4757 red, Slot 3 #00D4AA green, Slot 4 #FFD700 gold), role labels adapting by viz_type from AGENT_ROLES lookup, ARIA live region for status changes, compact and standard variants.
UX-DR8: Build KPICard component — metric title, A/B values, comparison bars, winner badge, count-up animation (1s easeOut), stagger entrance (y:40→0, 0.15s delay between cards), skeleton loading state, numeric/categorical/narrative variants.
UX-DR9: Build ScoreRing component — circular progress indicator with count-up number inside, clockwise fill with accent color, per-path overall score (1–100), synchronized entrance after KPI reveal.
UX-DR10: Build WinnerBadge component — colored pill with arrow "→ Path A Wins" at top-right of KPI card, slides in 0.3s after values settle.
UX-DR11: Build ComparisonBar component — proportional fill bars (winner = accent green, loser = muted gray), animated fill.
UX-DR12: Build DeepDivePanel component — path tabs (Path A / Path B toggle), narrative blocks with month-by-month story, agent attribution colored dots per paragraph, center panel expansion with side panels compressing to narrow strips showing miniaturized viz + score, keyboard tab navigation.
UX-DR13: Build FallbackViz component — simplified 4-node diamond pattern with connection lines drawing between them as agents activate, mode-agnostic, works for any decision type, seamless swap-in without collapsing flow.
UX-DR14: Implement Direction 6 KPI-centric center layout — center-dominant comparison, three-panel rhythm (Path A | Center Intelligence | Path B), center column as context anchor (HUD during run, KPI stack in results), mirrored side panels.
UX-DR15: Implement state transitions with Framer Motion choreography: Input→Simulation (1.2s — CTA pulses/shrinks, form scales to 0.95/fades 60%, three-panel expands, agent HUD appears), Simulation→Dashboard (2.5s — HUD fades 0.3s, header slides down, KPI cards stagger 0.15s, count-up 1s, winner badges 0.3s delay, score rings appear, deep dive button fades in), Dashboard→Deep Dive (0.6s — side panels compress, KPIs dissolve, narrative fades in, path tabs appear).
UX-DR16: Implement responsive breakpoints (sm ≥640, md ≥768, lg ≥1024, xl ≥1280, 2xl ≥1536) with desktop-first logic at lg+; controlled degradation below lg preserving task completion and orientation anchors.
UX-DR17: Implement WCAG 2.1 AA contrast compliance for all core text and KPI values on dark surfaces; non-color-only status communication (labels/icons + color).
UX-DR18: Implement keyboard-operable primary journey (input → simulate → results → deep dive) with visible focus states on all interactive elements, logical tab order, minimum target sizes.
UX-DR19: Implement prefers-reduced-motion support — respect OS setting for non-essential animations while preserving comprehension of results.
UX-DR20: Implement ARIA live regions for AgentHUD simulation progress, completion events, and fallback state announcements; semantic HTML landmarks and heading hierarchy per state.
UX-DR21: Implement DecisionForm with inline validation (immediate, specific guidance), placeholder examples reflecting real SMB decisions, large decision text area with auto-detect "A or B" vs "should I or shouldn't I" framing, progressive disclosure for optional context.
UX-DR22: Implement loading/skeleton states — skeleton KPI cards, AgentHUD progress as primary trust signal, <300ms perceived response on submit transition.
UX-DR23: Implement fallback/degraded state messaging — same layout grammar as normal flow, calm explicit copy ("Live run unavailable — showing saved comparison"), optional replay badge, retry action affordance.
UX-DR24: Implement consistent animation standards: agent activation (scale 0→1, opacity fade, spring stiffness:200/damping:20), pulse/glow (boxShadow with agent color, 1.5s infinite), line drawing (strokeDashoffset full→0, 0.8s ease-out), score card entrance (y:40→0 + opacity, staggered 0.15s), particles (offset-distance 0%→100%, 2–4s linear, staggered), node movement (x/y spring, 0.6s), color transitions (0.4s ease-in-out), count-up numbers (1s easeOut, JetBrains Mono).

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | Enter either/or business decision (DecisionForm) |
| FR2 | Epic 3 | Provide structured business context (ContextFields) |
| FR3 | Epic 3 | Start paired-path simulation via CTA (GlowButton) |
| FR4 | Epic 2 | Derive Path A and Path B descriptions |
| FR5 | Epic 2 | Classify decision into visualization category |
| FR6 | Epic 2 | Assign agent role palette by viz category |
| FR7 | Epic 2 | Run isolated agent roles per path |
| FR8 | Epic 2 | Produce structured outputs per agent |
| FR9 | Epic 2 | Synthesize agent outputs per path |
| FR10 | Epic 5 | Observe progress during simulation (AgentHUD) |
| FR11 | Epic 5 | See agent role states (waiting/in-progress/complete) |
| FR12 | Epic 4 | See which visualization category applies (ModeBadge) |
| FR13 | Epic 3 | View side-by-side consequence visualizations (SimulationContainer) |
| FR14 | Epic 4 | View geography-oriented depictions (MapView) |
| FR15 | Epic 3 | View flow-oriented depictions (FlowView) |
| FR16 | Epic 5 | View relationship-oriented depictions (NetworkView) |
| FR17 | Epic 5 | Complete flow with simplified viz (FallbackViz) |
| FR18 | Epic 5 | View comparative dashboard across dimensions |
| FR19 | Epic 5 | Compare revenue-oriented signals (KPICard) |
| FR20 | Epic 5 | Compare risk-oriented signals (KPICard) |
| FR21 | Epic 5 | Compare customer-oriented signals (KPICard) |
| FR22 | Epic 5 | Compare operating cost signals (KPICard) |
| FR23 | Epic 5 | Compare competitive exposure signals (KPICard) |
| FR24 | Epic 5 | View opportunity-cost phrasing (KPICard) |
| FR25 | Epic 5 | View overall per-path score (ScoreRing) |
| FR26 | Epic 4 | Open deeper narrative view (DeepDivePanel) |
| FR27 | Epic 4 | Read path-specific narrative with attribution |
| FR28 | Epic 6 | See confidence/grounding signals |
| FR29 | Epic 6 | Encounter simulated-consequence positioning |
| FR30 | Epic 6 | Complete experience using stored results |
| FR31 | Epic 2 | Programmatic API access |

## Epic List

> **Parallel Development Strategy:** Epic 1 is completed first by one developer (~1-2 hours) to establish contracts and unblock all others. Epics 2-5 then run **in parallel** — one per developer — with no file overlap. Epic 6 is a convergence phase where all developers integrate and harden.

## Cross-Epic Dependency Contract (Mandatory Before Parallel Start)

- Epic 1 must finish first and provide: typed contracts, state machine shell, slot ownership boundaries, and one working mock end-to-end slice.
- Epics 2-5 may start only after Epic 1 completion artifacts are merged.
- Epic 6 is convergence only and must not be referenced as a prerequisite for story-level completion in Epics 2-5.
- Any cross-epic behavior must be represented as interface contracts (props/events/state), not "wait for future epic" wording.

### Dependency Matrix

| Epic | Hard Dependencies | Allowed Soft Dependencies | Forbidden Forward Dependencies |
|------|-------------------|---------------------------|-------------------------------|
| Epic 1 | None | None | Any dependency on Epic 2+ |
| Epic 2 | Epic 1 contracts/types | Stubbed UI consumer during development | Dependency on Epic 3/4/5 UI completion |
| Epic 3 | Epic 1 shell/contracts | Mock API fixture while Epic 2 is in progress | Dependency on Epic 4/5 visuals |
| Epic 4 | Epic 1 shell/contracts | Mock narrative payload until Epic 2 live data is ready | Dependency on Epic 5 dashboard completion or Epic 6 convergence |
| Epic 5 | Epic 1 shell/contracts | Mock KPI payload until Epic 2 live data is ready | Dependency on Epic 4 deep dive completion or Epic 6 convergence |
| Epic 6 | Epic 2 + Epic 3 + Epic 4 + Epic 5 | None | Any dependency on future (non-existent) epics |

### Story Definition of Independently Done (DoID)

A story is complete only if all are true:
- Delivers a testable user-observable outcome (or a directly testable integration contract for developer-facing stories).
- Can be verified without waiting on a future story/epic.
- Acceptance criteria are measurable and pass/fail clear.
- Error/degraded behavior for that story scope is explicitly handled.
- FR/NFR/UX-DR trace tags are present in the story.

<!-- Cross-epic integration contracts (read/maintain when scoping this epic): docs/integration-contracts.md | src/lib/integration-contracts.ts | src/lib/types.ts (SimulationResponse). Epic 1 owns the contract layer foundation. -->
### Epic 1: First Value Slice (Input -> Mock Compare) *(All Devs / 1 Dev fast — BLOCKING)*
Deliver a user-visible vertical slice end-to-end: user enters decision + context, starts simulation, sees running-state orientation, and lands on a mock comparison dashboard using a validated fixture. Include only the minimum scaffolding needed for this slice and for parallel team unblocking.
**FRs covered:** FR1, FR2, FR3, FR13, FR18 (mock-data slice)
**NFRs addressed:** NFR-A2 (contrast), NFR-A3 (motion), NFR-S2 (HTTPS)
**UX-DRs addressed:** UX-DR1, UX-DR2, UX-DR3, UX-DR14, UX-DR16, UX-DR17, UX-DR19
**Architecture:** ADR-01 (Next.js 14 App Router scaffold on Vercel), state management, lib/types.ts

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C6 API / SimulationResponse (producer). Implement against src/lib/types.ts; mock: src/lib/mock-fixture.ts (MOCK_BAKERY_MAP_FIXTURE / MOCK_SIMULATION_RESPONSE). -->
### Epic 2: Simulation Engine & API *(Dev 2 — PARALLEL)*
System can receive a decision, parse it into Path A / Path B, classify the visualization type, run 4 isolated agents per path in parallel, synthesize per-path results, and return a complete structured payload via a stable API contract. Integrators can access the same endpoint.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR31
**NFRs addressed:** NFR-P1, NFR-P2, NFR-S1 (secrets), NFR-I3 (quota)
**Architecture:** ADR-02, ADR-03, ADR-04; env config, input/output validation, rate limits, cost guardrails, telemetry
**File ownership:** `app/api/`, `lib/agents.ts`, `lib/classifier.ts`

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 VizSlotProps (FlowView path); mount inside PanelSlots; shell state via useUiShell() from src/lib/ui-shell-context.tsx. -->
### Epic 3: Input, Simulation Shell & Flow Visualization *(Dev 1 — PARALLEL)*
User can enter a business decision with context, launch the simulation, and see the three-panel split-screen layout with flow-oriented visualization. Owns the page state machine and routing between screen states.
**FRs covered:** FR1, FR2, FR3, FR13, FR15
**NFRs addressed:** NFR-A1 (keyboard), NFR-P3 (client responsiveness)
**UX-DRs addressed:** UX-DR4, UX-DR6, UX-DR15 (Input→Simulation transition), UX-DR18, UX-DR21, UX-DR22, UX-DR24 (particles)
**File ownership:** `app/page.tsx`, `components/input/`, `components/simulation/`, `components/viz/FlowView/`, `components/shared/GlowButton.tsx`

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 VizSlotProps (MapView), C5 DeepDivePanelSlotProps; deepDive stage slot map in doc. -->
### Epic 4: Map Visualization & Deep Dive *(Dev 3 — PARALLEL)*
User can view geography-oriented consequence depictions when the decision is location-weighted, see which visualization mode applies, and explore detailed month-by-month narratives with agent attribution after reviewing the dashboard.
**FRs covered:** FR12, FR14, FR26, FR27
**NFRs addressed:** NFR-I2 (mapping degradation)
**UX-DRs addressed:** UX-DR5, UX-DR12, UX-DR15 (Dashboard→Deep Dive transition), UX-DR24 (map animations)
**File ownership:** `components/viz/MapView/`, `components/narrative/`, `components/shared/ModeBadge.tsx`

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 Network/FallbackViz, C2 AgentHUD, C3 KPI stack, C4 ScoreRing; running + dashboard slot map in doc. -->
### Epic 5: Agent HUD, Dashboard & Network Visualization *(Dev 4 — PARALLEL)*
User can see agent progress during simulation, view a KPI comparison dashboard with winner cues and score rings after completion, and see relationship-oriented visualizations or a simplified fallback when needed.
**FRs covered:** FR10, FR11, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25
**NFRs addressed:** NFR-P4 (results choreography), NFR-A3 (motion)
**UX-DRs addressed:** UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR13, UX-DR15 (Simulation→Dashboard transition), UX-DR20, UX-DR22, UX-DR24 (agent/node animations)
**File ownership:** `components/agents/`, `components/dashboard/`, `components/viz/NetworkView/`, `components/viz/FallbackViz.tsx`, `components/shared/CountUpNumber.tsx`

<!-- Cross-epic integration contracts: docs/integration-contracts.md - convergence: wire real API to UI; preserve shapes in src/lib/types.ts and src/lib/integration-contracts.ts; see No-Epic-6 guarantee in doc. -->
### Epic 6: Integration, Resilience & Demo Readiness *(All Devs — CONVERGENCE)*
All developer streams converge: wire real API to UI, add confidence/transparency signals, implement cache/fallback recovery, and prepare 3 demo-ready scenarios with a rehearsed presentation script.
**FRs covered:** FR28, FR29, FR30
**NFRs addressed:** NFR-I1 (provider degradation), NFR-I2 (mapping degradation), NFR-S3 (data minimization)
**UX-DRs addressed:** UX-DR23
**Architecture:** ADR-05; cache strategy, golden JSON, bounded TTL, pre-demo checklist

---

<!-- Cross-epic integration contracts (read/maintain when scoping this epic): docs/integration-contracts.md | src/lib/integration-contracts.ts | src/lib/types.ts (SimulationResponse). Epic 1 owns the contract layer foundation. -->
## Epic 1: First Value Slice (Input -> Mock Compare)

Deliver a user-visible end-to-end MVP slice with mock data so the team validates journey shape early and then parallelizes safely against stable contracts.

### Story 1.1: Thin-Slice Scaffold (User-Visible First Run)

As a small business owner,
I want the app to open into a working decision flow that reaches a visible mock comparison outcome,
So that the product demonstrates value immediately, even before live orchestration is integrated.

**Acceptance Criteria:**

**Given** a developer runs `npm install && npm run dev`
**When** the application starts
**Then** the app renders a working thin slice: decision input -> simulate action -> running state shell -> mock comparison dashboard
**And** this thin slice can be completed without any live API dependency
**And** the layout preserves Path A | center | Path B orientation across running and dashboard states
**And** a Next.js 14 App Router project is running with TypeScript, Tailwind CSS, and Framer Motion configured
**And** `layout.tsx` loads Google Fonts (Space Grotesk, DM Sans, JetBrains Mono) and sets page metadata
**And** `globals.css` defines CSS custom properties for the core color palette required by the thin slice (--bg, --surface, --border, --accent, --blue, --red, --gold, --text, --text-dim)
**And** Tailwind config extends the theme with the token colors, typography scale (H1–caption), and 8px spacing scale (4/8/16/24/32/40/48)
**And** responsive breakpoints are configured (sm 640, md 768, lg 1024, xl 1280, 2xl 1536) desktop-first
**And** a `prefers-reduced-motion` utility class is available for non-essential animation
**And** base focus-visible styles are defined for interactive elements
**And** text tokens on dark surfaces meet WCAG 2.1 AA contrast for normal text

### Story 1.2: TypeScript Domain Types & Mock Data Fixture

As a developer,
I want shared TypeScript interfaces for the full API contract and a realistic mock response fixture,
So that frontend and backend teams can develop independently against the same data shapes.

**Acceptance Criteria:**

**Given** a developer imports from `lib/types.ts`
**When** they use the type definitions
**Then** types exist for: `SimulationRequest` (decision, context, options), `SimulationResponse` (runId, status, viz_type, path_labels, progress, paths with agents and synthesis, comparison, meta), per-agent output shape, synthesis shape, KPI shape, and `ErrorResponse` (code, message, recoverable, recovery hints)
**And** an `AGENT_ROLES` lookup constant maps MAP / FLOW / NETWORK to four role label strings each
**And** `viz_type` is typed as a union consistent with the architecture doc (e.g. `map | flow | network | fallback`)

**Given** a developer imports the mock fixture module
**When** they load the default fixture
**Then** at least one complete `SimulationResponse` exists (Map bakery scenario) with both paths populated (agents, synthesis, kpis, comparison)
**And** the fixture is structurally valid at compile time against `SimulationResponse`

### Story 1.3: Application State Machine & Slot Ownership

As a developer,
I want the top-level page state machine and three-panel layout skeleton wired up,
So that all frontend devs can mount their components into the correct slots and states.

**Acceptance Criteria:**

**Given** the application is running
**When** the state machine initializes
**Then** `page.tsx` (or a dedicated store module) exposes `uiStage`: `input | running | dashboard | deepDive`
**And** `runStatus`: `idle | submitting | inProgress | completed | fallback | error`
**And** initial state is `input` / `idle`

**Given** `uiStage` is `running`
**When** the simulation layout renders
**Then** a three-panel skeleton appears: Path A (left), center intelligence column, Path B (right), with mirrored side structure per Direction 6
**And** named slot regions or wrapper components exist so Epic 3–5 owners can mount viz, HUD, KPI without editing each other's primary files unnecessarily

**Given** developers need to preview a state during integration
**When** they toggle `uiStage` via a temporary dev-only control or documented prop
**Then** the correct shell for that stage renders (input area vs three-panel vs dashboard vs deep-dive expansion)

### Story 1.4: Parallel Integration Contract & Ownership Boundaries

As a developer,
I want explicit contracts for cross-epic integration points,
So that Epics 2-5 can execute in parallel without forward dependency blocking.

**Acceptance Criteria:**

**Given** all parallel epic owners are ready to start
**When** they open the integration contract document
**Then** the contract defines state/event interfaces between simulation shell, HUD/KPI stack, and deep-dive handoff
**And** each contract includes owner epic, source-of-truth file path, and expected payload shape
**And** each contract includes mock fallback behavior for independent local verification
**And** no story completion criteria in Epics 2-5 require "waiting for Epic 6"
**And** a short test checklist verifies contract compatibility without requiring full cross-epic merge

---

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C6 API / SimulationResponse (producer). Implement against src/lib/types.ts; mock: src/lib/mock-fixture.ts (MOCK_BAKERY_MAP_FIXTURE / MOCK_SIMULATION_RESPONSE). -->
## Epic 2: Simulation Engine & API

System receives a decision, parses Path A/B, classifies visualization type, runs four isolated agents per path in parallel, synthesizes per path, and returns a stable JSON contract for UI and integrators.

### Story 2.1: Simulate API Route Scaffold & Environment Wiring

As an integrator,
I want a documented POST `/api/simulate` endpoint with validation and error shape,
So that the client and tests can call one stable contract.

**Acceptance Criteria:**

**Given** a POST to `/api/simulate` with JSON body matching `SimulationRequest`
**When** the route receives the request
**Then** request body is validated (decision length, context field types/limits per architecture)
**And** LLM and timeout env vars are read server-side only (`LLM_API_KEY`, model vars, `SIMULATION_TIMEOUT_MS`); no secrets in client bundles
**And** on validation failure, response returns `status: error` with a recoverable flag and machine-readable `code`
**And** optional basic rate limiting or burst protection is applied at route level
**And** production uses HTTPS when deployed (NFR-S2 satisfied by platform)

### Story 2.2: Decision Parser, Classifier & Agent Role Resolution

As a user (via the system),
I want my natural-language decision split into two paths and a visualization mode,
So that the UI can label panels correctly and pick the right metaphor.

**Acceptance Criteria:**

**Given** a valid `decision` string and `context`
**When** the parse/classify step runs (one LLM call or deterministic rules where agreed)
**Then** response includes `path_labels` (or equivalent) for A and B using the user’s wording, not generic scenario names
**And** `viz_type` is one of `map | flow | network` (or `fallback` if explicitly chosen by policy)
**And** the four agent role labels for the run are resolved from `AGENT_ROLES[viz_type]` (FR4, FR5, FR6)
**And** parse/classify failures return structured error, not raw stack traces to the client

### Story 2.3: Parallel Isolated Agent Execution

As a user (via the system),
I want four independent agents per path to run in parallel without seeing each other’s outputs,
So that outcomes feel emergent rather than a single blended answer.

**Acceptance Criteria:**

**Given** parsed paths and resolved roles
**When** agent execution runs for both paths
**Then** eight agent LLM calls are issued in parallel (four per path) with bounded concurrency and timeout handling
**And** each agent prompt receives only its role, path description, and shared context — not other agents’ outputs for that path (FR7)
**And** each agent returns parseable JSON matching the agreed schema in `lib/types.ts` (FR8)
**And** partial failures are classified (which path/slot failed) for recovery logic in Epic 6

### Story 2.4: Per-Path Synthesis, KPI Assembly & Telemetry

As a user (via the system),
I want each path’s agents synthesized into KPIs, scores, and narrative,
So that the dashboard and deep dive have one canonical payload.

**Acceptance Criteria:**

**Given** four completed agent outputs for a path
**When** synthesis runs for that path
**Then** synthesis reads only that path’s agent outputs (FR9)
**And** the assembled response includes per-path KPI fields needed for the six cards and overall score, plus narrative/timeline fields for deep dive
**And** response includes `comparison` (winner by KPI and overall) consistent with architecture examples
**And** `meta` includes latency estimate, llmCalls count (~11), and estimated cost band where feasible (NFR-P2 alignment)
**And** full response is validated against schema before returning; invalid synthesis triggers error or recoverable path per Epic 6 policy

---

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 VizSlotProps (FlowView path); mount inside PanelSlots; shell state via useUiShell() from src/lib/ui-shell-context.tsx. -->
## Epic 3: Input, Simulation Shell & Flow Visualization

User enters decision and context, launches simulation, and sees the three-panel experience with flow-mode visualization when applicable.

### Story 3.1: Decision Form & Context Fields

As a small business owner,
I want to enter my either/or decision and up to five context fields with clear guidance,
So that the simulation is grounded in my situation.

**Acceptance Criteria:**

**Given** the user is on the input screen
**When** they view the form
**Then** a large textarea captures the decision with SMB-flavored placeholder copy (FR1)
**And** five fields are present: Industry, Monthly Revenue, Location, Customer Base, Additional Details (FR2)
**And** inline validation appears on submit with specific messages; empty decision blocks submit (UX-DR21)
**And** primary controls are keyboard operable with visible focus and no traps (NFR-A1, UX-DR18)

### Story 3.2: Simulate CTA & Submit Wiring

As a small business owner,
I want one obvious button to start my paired-path simulation,
So that I am not unsure what to do next.

**Acceptance Criteria:**

**Given** valid form input
**When** the user activates the primary CTA
**Then** `GlowButton` shows label “Simulate My Decision”, accent styling, hover glow, height ≥ 40px, loading state preserves width (FR3, UX-DR4)
**And** perceived transition toward running state begins within ~300ms of click (UX-DR22)
**And** `runStatus` moves to `submitting` then `inProgress` as appropriate

**Given** invalid input
**When** the user clicks the CTA
**Then** the button does not enter loading; validation messages show

### Story 3.3: Simulation Container, Panel Headers & Input→Running Transition

As a small business owner,
I want to see my own words as path titles and a clear three-panel layout when the run starts,
So that I stay oriented during the hero moment.

**Acceptance Criteria:**

**Given** a transition from `input` to `running`
**When** Framer Motion runs the Input→Simulation choreography (~1.2s per spec)
**Then** `SimulationContainer` renders Path A | center | Path B with mirrored structure (FR13, UX-DR14, UX-DR15)
**And** `PanelHeader` shows user-derived path labels, not “Scenario A/B” (UX-DR6)
**And** `VizRouter` receives `viz_type` and renders the correct mode slot; for `flow` it mounts FlowView; for others it renders a thin placeholder or Epic 4/5 components when integrated
**And** reduced-motion path skips or shortens non-essential motion (UX-DR19)

### Story 3.4: Flow View — Resource Allocation Visualization

As a small business owner,
When my decision is about budget or resources,
I want to see flowing allocation metaphors on both sides,
So that the tradeoff matches how I think about money and time.

**Acceptance Criteria:**

**Given** `viz_type` is `flow` and path data is available (mock or live)
**When** each side panel renders
**Then** `FlowView` / `FlowHalf` show resource pool, SVG channel pipes, animated particles along paths, outcome pools, and leak/waste cues per master spec (FR15)
**And** animation uses Framer Motion / CSS offset-path as specified; respects reduced motion for decorative particle density where feasible (UX-DR24, NFR-A3)
**And** components live under `components/viz/FlowView/` per architecture file ownership

---

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 VizSlotProps (MapView), C5 DeepDivePanelSlotProps; deepDive stage slot map in doc. -->
## Epic 4: Map Visualization & Deep Dive

Geography-weighted decisions show Map mode; users can open narrative deep dive with attribution.

### Story 4.1: Mode Badge & Map Shell Integration

As a small business owner,
I want to see which visualization mode the system chose,
So that I trust the UI is adapting to my decision type.

**Acceptance Criteria:**

**Given** a run with resolved `viz_type`
**When** the simulation UI renders
**Then** `ModeBadge` displays a textual pill (e.g. map/flow/network) with icon or label — never color-only (FR12, UX-DR5)
**And** badge placement is consistent across states (top of layout per spec)
**And** when `viz_type` is `map`, the left/right panels reserve map canvas regions for MapView

### Story 4.2: Map View — Geographic Simulation (Split Screen)

As a small business owner,
When my decision involves location and reach,
I want a split map with pins, customers, competitors, and overlays,
So that I can see geographic consequences side by side.

**Acceptance Criteria:**

**Given** `viz_type` is `map` and Mapbox token is configured for client map
**When** both sides render
**Then** `MapView` / `MapHalf` use react-map-gl with business pin, customer dots, competitor pins, heat overlay, and cash flow ticker driven by path/agent data (FR14)
**And** WebGL-unavailable or map init failure surfaces a non-blocking message and does not crash the app; comparison path can still proceed via the current fallback contract (NFR-I2)
**And** animation timeline aligns with master spec phases where data is available (UX-DR24)
**And** components live under `components/viz/MapView/`

### Story 4.3: Deep Dive Panel, Path Tabs & Narrative With Attribution

As a small business owner,
After seeing KPIs, I want a tabbed month-by-month story with clear agent attribution,
So that I understand why each path diverges.

**Acceptance Criteria:**

**Given** `uiStage` moves to `deepDive` from dashboard
**When** the transition runs (~0.6s per spec)
**Then** side panels compress to strips with mini viz/score context; center expands (FR26, UX-DR12, UX-DR15)
**And** `PathTabs` switch Path A / Path B; keyboard operable (FR27, UX-DR18)
**And** narrative paragraphs show colored attribution markers tied to agent roles/slots
**And** content reads from synthesis narrative/timeline fields from the response object — no prompt parsing in UI

---

<!-- Cross-epic integration contracts: docs/integration-contracts.md - C1 Network/FallbackViz, C2 AgentHUD, C3 KPI stack, C4 ScoreRing; running + dashboard slot map in doc. -->
## Epic 5: Agent HUD, Dashboard & Network Visualization

Progress during run; KPI comparison and score rings after; network mode or fallback when needed.

### Story 5.1: Agent HUD & Agent Nodes

As a small business owner,
While the simulation runs, I want to see four agents wake up one by one with short insights,
So that I believe real analysis is happening.

**Acceptance Criteria:**

**Given** `uiStage` is `running` and agent progress props are supplied (mock timers or real updates)
**When** each agent slot updates
**Then** `AgentHUD` shows four nodes with states: dormant → thinking (pulse) → insight text → complete checkmark (FR10, FR11, UX-DR7, UX-DR24)
**And** slot colors are fixed (blue, red, green, gold) and labels come from `AGENT_ROLES` for current `viz_type`
**And** an ARIA live region announces meaningful status changes (UX-DR20)
**And** components live under `components/agents/`

### Story 5.2: KPI Comparison Stack & Supporting Primitives

As a small business owner,
After the run, I want six comparison cards with winner cues,
So that I can scan tradeoffs in seconds.

**Acceptance Criteria:**

**Given** completed synthesis for both paths
**When** dashboard stage renders
**Then** six `KPICard` rows cover revenue impact, risk, customer impact, operating costs, competitive exposure, and “What you’d miss” (FR18–FR24)
**And** each card shows A/B values, `ComparisonBar`, and `WinnerBadge` with staggered entrance and ~1s count-up on numerics (UX-DR8, UX-DR10, UX-DR11, UX-DR22)
**And** `CountUpNumber` uses JetBrains Mono for numeric emphasis (UX-DR2)

### Story 5.3: Score Rings & Simulation→Dashboard Transition

As a small business owner,
I want an overall score per path at the bottom of each side panel,
So that I have a single glanceable signal beside the KPI stack.

**Acceptance Criteria:**

**Given** synthesis provides overall scores
**When** dashboard entrance plays (~2.5s choreography)
**Then** `ScoreRing` animates fill and inner count-up per path (FR25, UX-DR9, UX-DR15)
**And** “Read Full Story” / deep dive affordance fades in after KPI settle (ties to Epic 4)
**And** dashboard reaches stable layout within transition budget (NFR-P4)

### Story 5.4: Network View & Fallback Visualization

As a small business owner,
When my decision is about relationships, I want a node graph; if a mode fails, I still see a coherent viz,
So that the demo never dead-ends.

**Acceptance Criteria:**

**Given** `viz_type` is `network`
**When** side panels render
**Then** `NetworkView` shows center business node, stakeholder nodes on a circle, animated relationship lines, ripple effects (FR16)
**Given** preferred viz errors or time-box exceeded
**When** `VizRouter` or error boundary triggers fallback
**Then** `FallbackViz` renders the four-node diamond with connecting lines animating with agent activation (FR17, UX-DR13)
**And** network and fallback components live under `components/viz/NetworkView/` and `components/viz/FallbackViz.tsx`

---

<!-- Cross-epic integration contracts: docs/integration-contracts.md - convergence: wire real API to UI; preserve shapes in src/lib/types.ts and src/lib/integration-contracts.ts; see No-Epic-6 guarantee in doc. -->
## Epic 6: Integration, Resilience & Demo Readiness

Wire streams together, add transparency, cache/replay, and lock demo scenarios.

### Story 6.1: End-to-End Client ↔ API Integration & Progress Updates

As a small business owner,
I want the real backend to drive my run from submit through dashboard,
So that the product is not mock-only.

**Acceptance Criteria:**

**Given** Epic 2 route is deployed and env keys set
**When** the user submits the form
**Then** client calls POST `/api/simulate` with the same envelope as `SimulationRequest`
**And** agent completion updates HUD deterministically via polling or SSE (architecture choice documented)
**And** `viz_type` and payloads drive `VizRouter`, AgentHUD, KPI, and Map/Flow/Network without ad-hoc parsing
**And** hero simulation phase stays within intended perceived pacing where provider latency allows (NFR-P1, NFR-P3)

### Story 6.2: Cached Golden Replay & Bounded Client Cache

As a presenter,
If the API fails during a demo, I want a saved run to play through the same UI,
So that judges still see the full story.

**Acceptance Criteria:**

**Given** a prior successful `SimulationResponse` or checked-in golden JSON
**When** live call fails and policy allows replay
**Then** client loads cached/golden full payload, runs the same animations, and lands on dashboard (FR30, NFR-I1, ADR-05)
**And** cache storage is bounded (count/TTL/overwrite) — no unbounded growth (NFR-S3)
**And** optional honest UI label indicates replay/offline mode (UX-DR23)

### Story 6.3: Transparency, Confidence & Non-Advice Framing

As a small business owner,
I want to see how much is grounded in my inputs versus assumptions, and that this is a simulation,
So that I do not mistake output for guaranteed advice.

**Acceptance Criteria:**

**Given** results are on screen
**When** the user scans KPI and narrative areas
**Then** confidence/grounding cues are visible where architecture provides `grounding` or confidence fields (FR28)
**And** clear copy states outputs are simulated consequences, not professional advice or guarantees (FR29)
**And** cues are not color-only (labels/icons + color) (UX-DR17)

### Story 6.4: Demo Scenarios, Script & Pre-Demo Checklist

As a presenter,
I want three canned inputs that each force a different viz mode plus a short script,
So that rehearsal is repeatable under pressure.

**Acceptance Criteria:**

**Given** demo mode or documented fixtures
**When** the team runs Demo 1 / 2 / 3 inputs from the master spec
**Then** classifier yields map, flow, and network respectively (or documented acceptable substitute with FallbackViz for network if time-boxed)
**And** a `docs/` or `_bmad-output` demo script doc lists the 60-second narration beats
**And** checklist covers: cached replay path tested once, FallbackViz tested, projector contrast spot-check, screenshot backup captured

---

## Epic 7: Data-Enriched Demo Polish

Map-only visualization pivot with real Madrid distrito demographics, guided 4-step wizard input with live competitor discovery from OpenStreetMap, and transparent agent reasoning with structured assumption output.

**Context:** Epics 1-6 delivered a working thin-slice demo. Epic 7 enriches it with real geographic data, guided input collection, and agent transparency — pivoting from three shallow viz modes to one deep, data-driven map view.

**Dependencies:** Epic 6 (all done). No new external paid APIs — OpenStreetMap Overpass is free and keyless.

### Story 7.1: Map-Only Viz + Madrid Distrito Data Overlay

As a small business owner,
I want to always see a rich geographic map with real distrito demographics for both paths,
So that I can visually compare how each decision plays out in my actual neighborhood.

**Acceptance Criteria:**

**Given** any `viz_type` classification (map, flow, or network)
**When** the simulation renders
**Then** both side panels always show the map visualization with Madrid distrito boundary polygons color-coded by commercial density
**And** Path A and Path B maps center on different locations (candidate vs existing)
**And** a typed GeoJSON fixture with 21 Madrid distritos and demographic properties is embedded

### Story 7.2: 4-Step Wizard Input + Live Competitor Discovery

As a small business owner,
I want a guided step-by-step input flow that confirms my location and shows real competitors found nearby,
So that the simulation is grounded in my actual business context.

**Acceptance Criteria:**

**Given** the user is on the input screen
**When** they begin the wizard
**Then** a 4-step flow guides them: Decision → Business details → Confirm location → Confirm competitors (from OpenStreetMap)
**And** each step slides with Framer Motion transitions
**And** the final payload includes all wizard data plus confirmed competitor coordinates

### Story 7.3: Agent Prompt Overhaul + Assumption Transparency

As a small business owner,
I want to see what the simulation agents assumed versus what I told them,
So that I understand why confidence varies and can trust the results more.

**Acceptance Criteria:**

**Given** enriched context from the wizard
**When** agents run
**Then** each agent outputs a structured `assumptions: string[]` listing what it assumed vs what was supplied
**And** the deep dive panel shows assumptions alongside agent insights
**And** agents reference distrito demographics and confirmed competitors when available
