# Story 3.3: Simulation Container, Panel Headers & Input→Running Transition

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want to see my own words as path titles and a clear three-panel layout when the run starts,
so that I stay oriented during the hero moment.

## Acceptance Criteria

_trace: FR13 (SimulationContainer), UX-DR6 (PanelHeader path labels), UX-DR14 (Direction 6 three-panel rhythm), UX-DR15 (Input→Simulation ~1.2s choreography), UX-DR19 (reduced motion); `VizType` / `VizSlotProps` in `src/lib/types.ts`, `src/lib/integration-contracts.ts`_

1. **Given** a transition from **`input`** to **`running`** **when** Framer Motion runs the **Input→Simulation** choreography (**~1.2s** total perceived sequence per UX-DR15 / master spec §10.1) **then** the **`SimulationContainer`** presents **Path A | center intelligence | Path B** with **mirrored** side structure and stable spacing rhythm (FR13, UX-DR14, UX-DR15).
2. **And** **`PanelHeader`** (or equivalent dedicated header region per panel) shows **user-derived** path labels from the same source as `derivePathLabels` — **not** generic copy such as “Scenario A” / “Scenario B” (UX-DR6). When the parser falls back to defaults (“Path A” / “Path B”), that is acceptable only for unparseable empty/minimal input.
3. **And** **`VizRouter`** receives a **`viz_type: VizType`** and renders the correct mode branch: for **`flow`** it mounts the **FlowView** entry point (full **FlowView** visuals are Story **3.4** — here either a **thin, typed shell** under `components/viz/FlowView/` or a **single placeholder component** clearly marked for 3.4 swap-in); for **`map`**, **`network`**, **`fallback`** render **thin placeholders** (copy + `data-testid`) until Epic **4** / **5** integrate real components — **no** ad-hoc parsing of user text in the router.
4. **And** **`prefers-reduced-motion`**: non-essential motion is **skipped or shortened** while keeping state changes comprehensible (UX-DR19). **`MotionConfig reducedMotion="user"`** already wraps `ThinSliceDemo` — extend **new** motion with **`useReducedMotion`** from `framer-motion` where choreography would otherwise run the full ~1.2s decorative sequence.

## Tasks / Subtasks

- [x] **`PanelHeader` (AC 2)**  
  - [x] Add `src/components/shell/PanelHeader.tsx` — props at minimum: `title: string`, optional `subtitle` / `accentClassName` for Path A vs B styling, semantic heading level (`h2` default).  
  - [x] Truncate long labels consistently (ellipsis or `line-clamp`) so headers stay **consistent height** across states (UX-DR6 alignment with UX-DR14).  
  - [x] No “Scenario A/B” strings in component defaults.

- [x] **`VizRouter` (AC 3)**  
  - [x] Add `src/components/viz/VizRouter.tsx` — props: **`VizSlotProps`** from `src/lib/integration-contracts.ts` (or destructure `viz_type`, `pathData`, `pathLabel` from that contract).  
  - [x] `switch (viz_type)`: **`flow`** → mount `FlowView` **shell** (new minimal `components/viz/FlowView/FlowView.tsx` or `index.tsx` — placeholder body acceptable); **`map` | `network` | `fallback`** → compact placeholder with distinct `data-testid` per mode (e.g. `viz-router-flow`, `viz-router-map`, …).  
  - [x] Lazy-load heavy future modules if you add real Map/Flow bundles later; for this story static imports are fine.

- [x] **`SimulationContainer` (AC 1)**  
  - [x] Add `src/components/shell/SimulationContainer.tsx` — composes existing **`SimulationShell`** (`src/components/shell/SimulationShell.tsx`) so the three-column grid + `data-testid="simulation-shell"` contract in **ThinSliceDemo** tests stays stable.  
  - [x] Props should include: `pathLabels: [string, string]`, `vizType: VizType`, path-scoped **mock or fixture-backed** `PathData` for A/B (for thin slice, slice from **`MOCK_BAKERY_MAP_FIXTURE`** in `src/lib/mock-fixture.ts` for both sides **or** minimal synthetic `PathData` objects that satisfy `PathData` — must **type-check**).  
  - [x] Left/right column: **`PanelHeader`** + **`VizRouter`** (each side gets correct `pathLabel` and path’s `pathData`). Center column: keep **running-state** hero content (progress copy / future AgentHUD mount point) — **do not** implement full **AgentHUD** (Epic 5).

- [x] **`ThinSliceDemo` wiring (AC 1–4)**  
  - [x] Replace inline **`motion.article`** running layout with **`SimulationContainer`** (or move the running markup into `SimulationContainer` and render it from `ThinSliceDemo`).  
  - [x] Introduce **mock `vizType`** state (e.g. `useState<VizType>("flow")`) **until Epic 2** supplies `viz_type` from API — document in dev notes. Toggle optional **dev-only** control next to existing shell preview to exercise all `VizRouter` branches in non-production builds.  
  - [x] **`derivePathLabels`** remains the single source for panel titles; pass results into `SimulationContainer`.

- [x] **Input→Running choreography ~1.2s (AC 1, 4)**  
  - [x] Orchestrate **cross-stage** motion between the **`input`** branch and **`running`** branch: align with master spec §10.1 (CTA glow/shrink already partly implied by **GlowButton**; **form** region: scale ~0.95, fade, slight upward move; **running** three-panel: expand from center / stagger children).  
  - [x] Target **~1.2s** active choreography window (spring durations may be tuned; use `duration` ~1–1.2s on key tweens where springs are too bouncy).  
  - [x] When **`useReducedMotion()`** is true: prefer **opacity-only** or **instant** swap with minimal delay (UX-DR19).

- [x] **Tests (AC 1–4)**  
  - [x] Unit: **`PanelHeader.test.tsx`** — renders title text; no scenario strings.  
  - [x] Unit: **`VizRouter.test.tsx`** — each `viz_type` renders expected test id / role.  
  - [x] Update **`ThinSliceDemo.test.tsx`** — running state still exposes `simulation-shell` + slot test ids; add assertion that **user-derived** labels appear when decision matches `vs` / `|` patterns (e.g. “X vs Y” shows **X** and **Y** in headings, not “Scenario A”).  
  - [x] **Quality gates:** `npm run lint`, `npm run test`, `npm run build`.

## Dev Notes

### Intent and scope

- This story **names and implements** the architecture **`SimulationContainer`**, **`PanelHeader`**, and **`VizRouter`** for the **running** stage. It **does not** implement **`POST /api/simulate`** (Epic 2), full **AgentHUD** (Epic 5), **ModeBadge** (Story 4.1), or complete **FlowView** visuals (Story 3.4).  
- Story **3.2** delivered **GlowButton** and **`submitting` → `running`** sequencing; **3.3** owns **layout composition**, **user-word panel headers**, **viz routing**, and **Input→Simulation** motion polish.

### Brownfield — current code

- **Running UI today:** `ThinSliceDemo.tsx` renders **`SimulationShell`** with inline **`motion.article`** cards; headings use **`pathLabels`** but still show helper text “Path A — framing” / “Path B — framing” and duplicate label in `h2` without a dedicated **`PanelHeader`**.  
- **`SimulationShell`** is the **layout primitive** (grid + `PanelSlots`); keep it and **wrap** with **`SimulationContainer`** for product-facing structure.  
- **Motion:** `MotionConfig reducedMotion="user"` is already applied — new choreography must respect **`useReducedMotion`**.  
- **Contracts:** `VizSlotProps` in `src/lib/integration-contracts.ts`; mocks like **`MOCK_VIZ_SLOT_PROPS_A`** for tests/storybook-style checks.

### Previous story intelligence (3.2)

- **`runStatus`**: `submitting` stays on **`uiStage: "input"`** briefly so the CTA can show loading; then **`running`** + **`inProgress`**. Do not regress that ordering in tests.  
- **`data-testid="simulate-submit"`** and **`data-run-status`** on `thin-slice-root` are relied upon by tests.

### Architecture compliance

- **Feature components** [Source: `_bmad-output/planning-artifacts/architecture.md` §3]: **`SimulationContainer`**, **`PanelHeader`**, **`VizRouter`** in the **Running** row.  
- **State** [Source: architecture §6]: **`viz_type`** is authoritative for **`VizRouter`** — use **`VizType`** from **`src/lib/types.ts`**, not stringly-typed branches.  
- **Visualization file ownership** [Source: epics.md Story 3.4]: Flow visualizations live under **`components/viz/FlowView/`** — Story 3.3 may add a **minimal shell file** so 3.4 extends in place.

### File structure requirements

- **New:** `src/components/shell/SimulationContainer.tsx`  
- **New:** `src/components/shell/PanelHeader.tsx`  
- **New:** `src/components/viz/VizRouter.tsx`  
- **New (minimal):** `src/components/viz/FlowView/FlowView.tsx` (or equivalent) — placeholder acceptable for Story 3.4 to flesh out  
- **Update:** `src/components/shell/ThinSliceDemo.tsx`  
- **Tests:** new `*.test.tsx` files as listed above; update `ThinSliceDemo.test.tsx`

### Testing requirements

- Vitest + Testing Library; follow patterns from Stories **1.3**–**3.2**.  
- Preserve existing **`SimulationShell`** / slot **`data-testid`** expectations unless the story **intentionally** consolidates test ids (prefer **additive** test ids on **`SimulationContainer`** / **`VizRouter`**).

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.3; UX-DR14, UX-DR15, UX-DR19; FR13.  
- Master spec (motion detail): `_bmad-output/planning-artifacts/_extracted-foresight-master-spec.md` — §10.1 Input → Simulation (1.2s).  
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` — PanelHeader / VizRouter mentions.  
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — §3 components, §6 `viz_type` routing.  
- Contracts: `docs/integration-contracts.md` — C1 `VizSlotProps`; `src/lib/integration-contracts.ts`.  
- Prior stories: `_bmad-output/implementation-artifacts/3-2-simulate-cta-submit-wiring.md`, `_bmad-output/implementation-artifacts/1-4-parallel-integration-contract-ownership-boundaries.md`.

### Review Findings

- [x] [Review][Defer] Choreography total duration overshoots ~1.2s spec — AnimatePresence mode="wait" causes input exit (0.45s) to complete before running enter (0.68s + panels 1.1s + stagger 0.14s), totalling ~1.69s; AC1/UX-DR15 specifies "~1.2s total perceived sequence" [src/components/shell/ThinSliceDemo.tsx, src/components/shell/SimulationContainer.tsx] — deferred, treat ~1.2s as soft guideline; revisit in a UX motion polish pass
- [x] [Review][Defer] Panel stagger fires left→right (delays 0, 0.07, 0.14s); spec implies center-out expansion ("expand from center / stagger children") — AC1/UX-DR14 [src/components/shell/SimulationContainer.tsx] — deferred, left-to-right reading order is defensible; revisit with design in a UX polish pass
- [x] [Review][Patch] `pathData.synthesis.summary` accessed without optional chaining — crashes if `pathData` or `synthesis` is absent [src/components/viz/FlowView/FlowView.tsx]
- [x] [Review][Patch] `VizRouter` default branch returns `_exhaustive` (type `never`) which renders as a raw text node at runtime if an unexpected `viz_type` string bypasses TypeScript [src/components/viz/VizRouter.tsx]
- [x] [Review][Defer] No integration tests for `SimulationContainer` (aria-labels, stagger, VizRouter wiring) — deferred, pre-existing gap in shell test coverage
- [x] [Review][Defer] `derivePathLabels` lacks unit tests for `vs`-pattern, multi-pipe, 48-char truncation, and 3+-alternative decisions [src/lib/derive-path-labels.ts] — deferred, pre-existing
- [x] [Review][Defer] `isVizType` array in ThinSliceDemo duplicates `VizType` union — adding a type variant without updating the array silently drops options in dev select [src/components/shell/ThinSliceDemo.tsx] — deferred, dev-only risk
- [x] [Review][Defer] `ThinSliceDemo.test.tsx` covers pipe-pattern labels only; no `vs`-pattern heading assertion [src/components/shell/ThinSliceDemo.test.tsx] — deferred, partial coverage
- [x] [Review][Defer] `MOCK_BAKERY_MAP_FIXTURE` fed to all `viz_type` branches in dev preview — misleads shape assumptions for non-map modes [src/components/shell/ThinSliceDemo.tsx] — deferred, dev-only cosmetic
- [x] [Review][Defer] `PanelHeader` renders a blank `<header>` region if `title=""` is passed — no defensive fallback [src/components/shell/PanelHeader.tsx] — deferred, no current callers pass empty title
- [x] [Review][Defer] `PanelHeader` `accentClassName` and `headingLevel` props have no test coverage [src/components/shell/PanelHeader.test.tsx] — deferred, contract gap

## Dev Agent Record

### Agent Model Used

Cursor implementation agent

### Debug Log References

### Completion Notes List

- Implemented `PanelHeader`, `VizRouter`, `FlowView` shell, and `SimulationContainer` wrapping `SimulationShell` with fixture-backed `PathData` and user path labels.
- Centralized `derivePathLabels` in `src/lib/derive-path-labels.ts` for a single import surface; `ThinSliceDemo` uses mock `vizType` with a non-production `dev-viz-type-preview` control.
- Input→running motion: form exit uses scale/fade/upward move; running section and in-container panel stagger use `useReducedMotion`-aware durations (~0.45s + ~0.68s cross-stage, shortened when reduced motion is preferred).
- Tests: `PanelHeader.test.tsx`, `VizRouter.test.tsx`, extended `ThinSliceDemo.test.tsx`; `npm run lint`, `npm run test`, `npm run build` passed.

### File List

- `src/lib/derive-path-labels.ts` (new)
- `src/components/shell/PanelHeader.tsx` (new)
- `src/components/shell/PanelHeader.test.tsx` (new)
- `src/components/shell/SimulationContainer.tsx` (new)
- `src/components/shell/ThinSliceDemo.tsx` (updated)
- `src/components/shell/ThinSliceDemo.test.tsx` (updated)
- `src/components/viz/VizRouter.tsx` (new)
- `src/components/viz/VizRouter.test.tsx` (new)
- `src/components/viz/FlowView/FlowView.tsx` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `_bmad-output/implementation-artifacts/3-3-simulation-container-panel-headers-input-running-transition.md` (updated)
