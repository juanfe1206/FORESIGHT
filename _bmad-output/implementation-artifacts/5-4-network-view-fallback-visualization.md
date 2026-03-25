# Story 5.4: Network View & Fallback Visualization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
When my decision is about relationships, I want a node graph; if a mode fails, I still see a coherent viz,
so that the demo never dead-ends.

## Acceptance Criteria

_trace: FR16, FR17, UX-DR13, NFR-I2 (graceful degradation spirit); C1 Viz slot in `docs/integration-contracts.md`; architecture: `viz_type` → VizRouter_

1. **Given** `viz_type` is **`network`** and **`VizSlotProps`** are supplied for each path **when** the **running** stage renders **left/right** visualization slots **then** each side shows **`NetworkView`** (not placeholder copy): **center “business” node** (use `pathLabel` as primary label), **peripheral nodes** on a **circle** (labels derived sensibly from `pathData.agents[].role` and/or `AGENT_ROLES.network` — four stakeholders around the hub), **animated relationship edges** (stroke draw / opacity / motion) between hub and satellites, and **subtle ripple or pulse** on hub or edges during agent-active phases (FR16, UX: network mode accent `--purple` token in `ux-design-specification.md`).

2. **And** **`NetworkView`** is **path-scoped**: left panel = Path A `pathData` + `pathLabel`, right = Path B; **visual grammar** matches other run cards (border, `bg-surface`, min-height) and **does not** collapse layout when content is short.

3. **Given** `viz_type` is **`fallback`** **or** the shell policy sets **forced fallback viz** (see AC5) **when** a side panel renders through **`VizRouter`** **then** **`FallbackViz`** shows the **four-node diamond** layout with **edges** whose animation **correlates with `agentStates` for that path** (e.g. line emphasis or draw-in when the corresponding agent slot moves past `dormant`) (FR17, UX-DR13). **Roles/labels** must align with **`AGENT_ROLES.fallback`**.

4. **And** **`FallbackViz`** accepts **`VizSlotProps` + `agentStates: AgentState[]`** (length 4) passed from the same source as **`AgentHUD`** for that path so **running** choreography stays **in sync**; document the prop shape in **`src/lib/integration-contracts.ts`** (extend or add `FallbackVizProps` / export type) and keep **`npm run test -- src/lib/integration-contracts.test.ts`** passing.

5. **And** **`VizRouter`** (new **`src/components/viz/VizRouter.tsx`**) is the **single switch** on `viz_type` for **side-panel viz** in the thin slice: `network` → `NetworkView`; `fallback` → `FallbackViz`; `map` | `flow` → **explicit lightweight placeholder** (copy + optional static icon) **until** Epic 3/4 components land — placeholders must use **`VizSlotProps`** and **must not** throw. **Optional:** React **`errorBoundary`** wrapper (client component) around mode renderers: on render error, **swap to `FallbackViz`** without unmounting the whole **`SimulationShell`** (aligns with PRD/architecture “mode failure → fallback”).

6. **And** **`ThinSliceDemo`** **running** stage replaces the current **“Path A/B — framing”** stubs in **left/right** articles with **`<VizRouter ... />`** (or a thin wrapper) using **`MOCK_BAKERY_MAP_FIXTURE`** fields: build **`VizSlotProps`** for each path from fixture `paths.A` / `paths.B`, `path_labels`, and `viz_type`. **`AgentHUD`** continues to receive **`AGENT_ROLES[viz_type]`** — when exercising **network** or **fallback**, **dev preview** must allow **`viz_type`** override so HUD + side panels stay consistent (add a **non-production** `<select>` for `viz_type` next to existing dev controls, defaulting to fixture value).

7. **And** **accessibility / resilience:** non-color-only status for fallback (visible **“Simplified view”** or similar **text** + optional `aria-label` on the viz region); **`prefers-reduced-motion`**: reduce or disable ripple/edge choreography consistently with **`AgentHUD`** / **`ScoreRing`** patterns (`useReducedMotionConfig`).

8. **And** **file layout:** `src/components/viz/NetworkView/NetworkView.tsx` (and **`NetworkHalf.tsx`** if split helps reuse for left/right), `src/components/viz/FallbackViz.tsx`, `src/components/viz/VizRouter.tsx`; colocated **`*.test.tsx`** for **`VizRouter`** (switch cases), **`FallbackViz`** (diamond renders, reduced motion smoke), **`NetworkView`** (network mode renders hub + 4 satellites).

9. **And** **`docs/integration-contracts.md`** C1 row updated with **actual component paths** once files exist; add **`MOCK_VIZ_SLOT_PROPS_*`** variants **or** document in story notes that **`MOCK_VIZ_SLOT_PROPS_A`** is duplicated with `viz_type: "network"` for tests — **must** include at least one **network** and one **fallback** mock constant for contract tests if types change.

10. **And** **`npm run test`**, **`npm run lint`**, **`npm run build`** pass.

## Tasks / Subtasks

- [x] **Contracts** (AC: 4, 9, 10)
  - [x] Add `FallbackVizProps` (or equivalent) to `integration-contracts.ts`; extend tests; add mocks for network/fallback viz props if needed.

- [x] **VizRouter** (AC: 5, 6, 8, 10)
  - [x] Implement `VizRouter.tsx` with switch + placeholders for map/flow + optional error boundary inner fallback.

- [x] **NetworkView** (AC: 1, 2, 7, 8, 10)
  - [x] SVG or div-based layout with Framer Motion; use design tokens (`--purple` / Tailwind theme classes already mapped in app).

- [x] **FallbackViz** (AC: 3, 4, 7, 8, 10)
  - [x] Diamond layout; four nodes mapped to agent indices; edge animation keyed to `agentStates`.

- [x] **Shell wiring** (AC: 5, 6, 7, 10)
  - [x] `ThinSliceDemo`: viz_type state (default from fixture), dev preview select, pass `agentStatesByPath.A/B` into `FallbackViz` when `viz_type === "fallback"`; pass appropriate props to `NetworkView` when `network`.

- [x] **Docs & tests** (AC: 8, 9, 10)
  - [x] Integration contracts doc; component tests.

## Dev Notes

### Non-negotiable contracts

- **C1 — Viz slot:** All mode components consume **`VizSlotProps`** (`viz_type`, `pathData`, `pathLabel`). [Source: `docs/integration-contracts.md`, `src/lib/integration-contracts.ts`]
- **`viz_type` authority:** Router + **`AGENT_ROLES`** must stay aligned; no stringly-typed modes. [Source: `src/lib/types.ts`, `architecture.md` § Data Flow Rules]
- **Dual-path symmetry:** Left/right panels share the same component types; only props differ (same pattern as **`AgentHUD`**). [Source: `docs/integration-contracts.md` § Slot mounting guide]

### Coordination with Stories 5.1–5.3 (done)

- **`AgentHUD`** already receives **`viz_type`** and **`roles`**; after this story, **dev preview `viz_type`** must update **both** HUD **and** **`VizRouter`** so judges never see map roles with a network viz. [Source: `src/components/shell/ThinSliceDemo.tsx`]
- **Running** layout uses **`SimulationShell`** + **`runCardClassLeft/Right`**; viz content should **`flex-1 min-h-0`** where needed to avoid overflow clipping **insights** in **`AgentHUD`**.

### UX & visual tokens

- **Network mode accent** `--purple` / semantic purple in UX spec. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- **VizRouter + FallbackViz** UX-DR: mode-agnostic fallback, **seamless swap-in**, textual mode / fallback labeling. [Source: same file § VizRouter + Mode Shells, § FallbackViz]

### Reuse / avoid reinventing

- Reuse **`motion` / `useReducedMotionConfig`** patterns from **`ScoreRing`**, **`KpiStack`**, **`ThinSliceDemo`**.
- Do **not** fork **`AgentState`** semantics; drive FallbackViz from the same arrays as **`AgentHUD`**.

### Project structure notes

- **New:** `src/components/viz/VizRouter.tsx`, `NetworkView/*`, `FallbackViz.tsx`, tests.
- **Touch:** `src/components/shell/ThinSliceDemo.tsx`, `src/lib/integration-contracts.ts`, `src/lib/integration-contracts.test.ts`, `docs/integration-contracts.md`.

### Testing

- Vitest + Testing Library; follow **`ScoreRing.test.tsx`** / **`AgentHUD.test.tsx`** for **`MotionConfig`** reduced-motion patterns.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.4]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR16, FR17]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — VizRouter, FallbackViz, tokens]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — viz routing, fallback behavior]
- [Source: `docs/integration-contracts.md` — C1, running slot map]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — current viz placeholders, dev preview]
- [Source: `_bmad-output/planning-artifacts/_extracted-foresight-master-spec.md` — FallbackViz diamond description]

### Previous story intelligence

- **5.3** established **`dashboard-choreography`**, **`READ_FULL_STORY_DELAY_S`**, and strict **side-panel vs center** ownership; **do not** move KPIs into side panels. **`CountUpNumber`** + **`useReducedMotionConfig`** are the standard for motion-sensitive numeric UI. [Source: `_bmad-output/implementation-artifacts/5-3-score-rings-simulation-dashboard-transition.md`]
- **5.3** completion: **`ThinSliceDemo`** owns **running → dashboard** **0.3s** exit opacity; keep viz panels **stable** during that transition (no layout explosion). [Source: same file § Completion Notes]

### Git intelligence (recent patterns)

- Recent work: **`ThinSliceDemo`** integration (**`bd87551`**), **dual-path `AgentHUD`** (**`04bcb18`**), **`ScoreRing` / dashboard** (**`3aa4e78`**). Continue **`@/`** imports, **`data-testid`** for test hooks, client **`"use client"`** where hooks are used.

### Latest stack note

- **Next.js `16.x`**, React **19**, Tailwind **v4**, Framer Motion **12.x** — verify in `package.json` (planning docs may still say older Next). [Source: `package.json`, `AGENTS.md`]

### Project context reference

- No `project-context.md` in repo; use **`AGENTS.md`** + `node_modules/next/dist/docs/` when Next APIs differ from prior versions.

## Dev Agent Record

### Agent Model Used

Cursor agent (GPT-5.1) — dev-story workflow execution

### Debug Log References

(none)

### Completion Notes List

- Implemented `VizRouter` with `network` → `NetworkView`, `fallback` (or shell `runStatus === "fallback"`) → `FallbackViz`, `map`/`flow` → lightweight placeholders; class `VizRenderErrorBoundary` swaps to `FallbackViz` on render error.
- `NetworkView`: hub + four satellites on a circle, labels from `pathData.agents[].role` with `AGENT_ROLES.network` fallback; hub/edge motion gated by `useReducedMotionConfig`.
- `FallbackViz`: diamond spokes + `AGENT_ROLES.fallback` labels, “Simplified view” copy, edge emphasis from per-slot `agentStates`.
- `ThinSliceDemo`: `devVizType` state (default fixture), dev-only `viz_type` select aligned with `AgentHUD` roles; left/right run slots mount `VizRouter` with path-scoped `pathData` / `agentStates`.
- Added `--purple` / `--color-purple` for network accent; `FallbackVizProps`, `MOCK_VIZ_SLOT_PROPS_NETWORK`, `MOCK_FALLBACK_VIZ_PROPS_A`; `isVizType` guard for dev select.
- Tests: `VizRouter.test.tsx`, `NetworkView.test.tsx`, `FallbackViz.test.tsx`; extended `integration-contracts.test.ts`, `types.test.ts`. `npm run test`, `lint`, `build` pass.

### File List

- `src/app/globals.css`
- `src/lib/types.ts`
- `src/lib/types.test.ts`
- `src/lib/integration-contracts.ts`
- `src/lib/integration-contracts.test.ts`
- `src/components/viz/VizRouter.tsx`
- `src/components/viz/VizRouter.test.tsx`
- `src/components/viz/FallbackViz.tsx`
- `src/components/viz/FallbackViz.test.tsx`
- `src/components/viz/NetworkView/NetworkView.tsx`
- `src/components/viz/NetworkView/NetworkView.test.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `docs/integration-contracts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-4-network-view-fallback-visualization.md`

### Review Findings

- [x] [Review][Decision] AC5 MapFlowPlaceholder VizSlotProps conformance — resolved: widened to accept `VizSlotProps`; call sites pass `pathData` explicitly
- [x] [Review][Patch] FallbackViz aria-label is path-agnostic — fixed: now uses `pathLabel` [src/components/viz/FallbackViz.tsx]
- [x] [Review][Patch] Pointless motion.g wrapping satellite nodes in FallbackViz — fixed: replaced with plain `<g>` [src/components/viz/FallbackViz.tsx]
- [x] [Review][Patch] VizRouterSwitch missing default case — fixed: added `never` exhaustiveness guard with FallbackViz fallback [src/components/viz/VizRouter.tsx]
- [x] [Review][Patch] NetworkView SVG role="img" conflicts with parent aria-label — fixed: added `aria-hidden` to SVG, removed `<title>` [src/components/viz/NetworkView/NetworkView.tsx]
- [x] [Review][Patch] MapFlowPlaceholder uses ⎇ (U+2387) non-standard glyph — fixed: replaced with `→` [src/components/viz/VizRouter.tsx]
- [x] [Review][Patch] Missing VizRouter test: viz_type="fallback" passed explicitly — fixed: added test case [src/components/viz/VizRouter.test.tsx]
- [x] [Review][Patch] VizRenderErrorBoundary has no componentDidCatch — fixed: added `componentDidCatch` with console.error [src/components/viz/VizRouter.tsx]
- [x] [Review][Patch] agentStates padded via while+push during render — fixed: replaced with `Array.from` in both FallbackViz and NetworkView [src/components/viz/FallbackViz.tsx, src/components/viz/NetworkView/NetworkView.tsx]
- [x] [Review][Defer] Hub label 8px text inside scaling motion.g may blur on sub-retina [src/components/viz/NetworkView/NetworkView.tsx] — deferred, visual preference not spec violation
- [x] [Review][Defer] ErrorBoundary key reset causes full animation replay on devVizType change [src/components/viz/VizRouter.tsx] — deferred, intentional boundary reset design
- [x] [Review][Defer] runCardClassLeft extended via string concatenation — potential Tailwind class conflict [src/components/shell/ThinSliceDemo.tsx] — deferred, pre-existing project composition pattern

### Change Log

- 2026-03-25: Story 5.4 context file created (create-story workflow). Ultimate context engine analysis completed — comprehensive developer guide created.
- 2026-03-25: Story 5.4 implemented — VizRouter, NetworkView, FallbackViz, shell wiring, contracts, docs, tests; status → review.
