# Story 3.4: Flow View — Resource Allocation Visualization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
when my decision is about budget or resources,
I want to see flowing allocation metaphors on both sides,
so that the tradeoff matches how I think about money and time.

## Acceptance Criteria

_trace: FR15 (flow-oriented depiction), UX-DR24 (particle / motion standards), NFR-A3 (reduced motion); `VizSlotProps` in `src/lib/integration-contracts.ts`; master spec §7 Flow View_

1. **Given** **`viz_type`** is **`flow`** and **path data** is available (fixture/mock or live) **when** each side panel renders **`FlowView`** **then** the visualization is **not** a placeholder: it shows a **resource allocation metaphor** with **resource pool** (top), **SVG channel pipes** with labels, **animated particles** along paths, **outcome pools** (bottom), and **leak / waste cues** consistent with the master spec’s Flow View section (FR15, `_extracted-foresight-master-spec.md` §7.1).
2. **And** particle motion uses **Framer Motion** with **`offset-path` / `offset-distance`** (or equivalent SVG path sampling) as described in §7.2; path timing aligns with UX-DR24 particle guidance (typically **2–4s** linear along a path, staggered spawns where decorative).
3. **And** **`prefers-reduced-motion`**: when the user prefers reduced motion, **non-essential** animation is reduced or removed (e.g. fewer/no staggered particles, static or simplified pipes) while **text labels and structure** remain understandable (NFR-A3, UX-DR24).
4. **And** all new visualization components for this mode live under **`src/components/viz/FlowView/`** per architecture ownership; **`data-testid="viz-router-flow"`** remains on the root region users already rely on (extend with **additional** test ids for major subregions, do not remove the existing id).
5. **And** **no ad-hoc parsing of the user’s decision string** inside FlowView — derive display values from **`pathData`** (and typed constants/helpers). If numeric channel metrics are not yet in the API, use **documented mock scaling** from **`PathData.kpis`** and/or **agent list** so both sides stay data-driven and testable.

## Tasks / Subtasks

- [x] **Structure: `FlowView` + `FlowHalf` pattern (AC 1, 4)**  
  - [x] Replace the placeholder body in `FlowView.tsx` with a composed layout: either keep **`FlowView`** as the single exported entry and add **`FlowHalf.tsx`** as the presentational “one path” implementation, or equivalent clear split — match master spec §7.3 naming where practical.  
  - [x] Implement **`ResourcePool`**, **`FlowPipe`** (or **`ChannelPipe`**), **`Particles`**, **`OutcomePool`**, **`LeakPoint`** as colocated components under `components/viz/FlowView/` (filenames may vary slightly but responsibilities must map to §7.1).

- [x] **SVG + motion (AC 1, 2, 3)**  
  - [x] Define **1–3 channel paths** per side as SVG paths; label channels (e.g. map to **flow** agent roles from `AGENT_ROLES.flow` or **`pathData.agents[].role`**).  
  - [x] Animate particles along paths via **Framer Motion** (`offset-distance` or **`motion`** along sampled path points); optional **color interpolation** green → red along path length per §7.1.  
  - [x] Implement **outcome pools** with relative fill driven by **KPIs** or normalized scores from **`pathData.kpis`** (document the mapping in dev notes).  
  - [x] Implement **leak / waste** cues (e.g. drips or dimmed junction) tied at minimum to **risk** or **competitiveExposure** so the metaphor reads without Epic 2.  
  - [x] **`useReducedMotion`** from `framer-motion`: gate particle density, spawn interval, and decorative loops.

- [x] **Data wiring (AC 5)**  
  - [x] Add a small **`flowVizModel.ts`** (or similar) that maps **`PathData` → channel widths, pool levels, particle speed** — pure functions, unit-tested.  
  - [x] Ensure **`ThinSliceDemo`** / **`SimulationContainer`** continue to pass **`VizSlotProps`** unchanged; only **`FlowView`** internals consume the richer mapping.

- [x] **Tests (AC 1–5)**  
  - [x] Unit tests for **`flowVizModel`** (deterministic outputs for a fixed `PathData`).  
  - [x] **`FlowView.test.tsx`**: renders resource region, at least one labeled channel, outcome region; **`viz-router-flow`** present; no snapshot of full SVG if brittle — prefer role/label queries.  
  - [x] Update or add tests if **`VizRouter`** needs new props (should not). Run **`npm run lint`**, **`npm run test`**, **`npm run build`**.

## Dev Notes

### Intent and scope

- Story **3.3** delivered **`SimulationContainer`**, **`PanelHeader`**, **`VizRouter`**, and a **thin `FlowView` shell**. This story **implements full Flow mode visuals** (FR15) inside the existing slot — **not** Epic 2 **`POST /api/simulate`**, **not** **ModeBadge** (4.1), **not** **MapView** / **NetworkView**.  
- **`VizRouter`** already routes **`flow` → `FlowView`** — extend **`FlowView`** in place.

### Brownfield — current code

- **`FlowView`**: `src/components/viz/FlowView/FlowView.tsx` — placeholder copy + **`pathData.synthesis.summary`** preview; **`data-testid="viz-router-flow"`**, `aria-label` includes **`pathLabel`**.  
- **`VizRouter`**: `src/components/viz/VizRouter.tsx` — **`case "flow"`** imports **`FlowView`**.  
- **Contracts:** **`VizSlotProps`** (`pathLabel`, `pathData`, `viz_type`) — **do not widen** without updating **`integration-contracts.ts`** and call sites.  
- **Fixtures:** **`MOCK_BAKERY_MAP_FIXTURE`** is **`viz_type: "map"`** — for manual QA of flow mode, use the existing **dev-only `vizType` toggle** in **`ThinSliceDemo`** (set to **`flow`**) or add a **flow-skewed fixture** only if needed for tests (prefer minimal extra mock data).

### Previous story intelligence (3.3)

- **Input→running** choreography and **panel labels** are owned by **`SimulationContainer`** / **`ThinSliceDemo`** — do not regress **`derivePathLabels`** or **`simulation-shell`** test ids.  
- **`MotionConfig reducedMotion="user"`** wraps the app — new motion should still **`useReducedMotion()`** locally for particle/pipe decoration.  
- **`VizRouter`** tests assert **`viz-router-flow`** — keep that root id on the **`FlowView`** outer wrapper.

### Architecture compliance

- **Visualization layer** [Source: `architecture.md` §3]: **`FlowView` (resource pipeline animation)**.  
- **File ownership** [Source: `epics.md` Epic 3]: **`components/viz/FlowView/`**.  
- **Accessibility** [Source: `prd.md` NFR-A3]: decorative motion degrades gracefully; **semantic labels** for regions (`role="region"` already on placeholder — preserve/improve with **`aria-labelledby`** if adding headings).

### File structure requirements

- **New (typical):** `src/components/viz/FlowView/FlowHalf.tsx` (optional if folded into `FlowView.tsx`), `ResourcePool.tsx`, `FlowPipe.tsx`, `Particles.tsx`, `OutcomePool.tsx`, `LeakPoint.tsx`, `flowVizModel.ts`  
- **Update:** `src/components/viz/FlowView/FlowView.tsx` (main implementation)  
- **Tests:** `src/components/viz/FlowView/FlowView.test.tsx`, `flowVizModel.test.ts` (or co-located)

### Testing requirements

- **Vitest** + **Testing Library**; follow patterns from **3.3** (`PanelHeader.test.tsx`, `VizRouter.test.tsx`).  
- Mock **`PathData`** inline or from **`MOCK_VIZ_SLOT_PROPS_A`** with **`viz_type` overridden** in test only if types allow — otherwise construct minimal **`PathData`** objects.

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` — Story 3.4; FR15.  
- Master spec: `_bmad-output/planning-artifacts/_extracted-foresight-master-spec.md` — §7 Flow View (7.1–7.3).  
- PRD: `_bmad-output/planning-artifacts/prd.md` — FR15, NFR-A3.  
- UX: `_bmad-output/planning-artifacts/epics.md` — UX-DR24 (particle standards).  
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Visualization layer, `FlowView`.  
- Contracts: `docs/integration-contracts.md`, `src/lib/integration-contracts.ts` — **`VizSlotProps`**.  
- Prior: `_bmad-output/implementation-artifacts/3-3-simulation-container-panel-headers-input-running-transition.md`.

## Dev Agent Record

### Agent Model Used

Cursor agent (implementation)

### Debug Log References

### Completion Notes List

- Implemented Flow View per master spec §7: `FlowHalf` composes `ResourcePool`, four `FlowPipe` SVG channels, `OutcomePools`, `LeakPoint`, and `Particles` (Framer Motion `animate` + `getPointAtLength`; HSL green→red along progress).
- `flowVizModel.ts` maps `PathData.kpis` / `agents` to pool fills, channel stroke width, particle duration (2–4s), leak intensity (`risk` + `competitiveExposure`), and pipe squeeze (`competitiveExposure`). Documented scaling in `FLOW_VIZ_SCALING`.
- jsdom: `src/test/setup.ts` polyfills `SVGPathElement.getTotalLength` / `getPointAtLength` for particle tests.

### File List

- `src/components/viz/FlowView/FlowView.tsx` (updated)
- `src/components/viz/FlowView/FlowHalf.tsx`
- `src/components/viz/FlowView/ResourcePool.tsx`
- `src/components/viz/FlowView/FlowPipe.tsx`
- `src/components/viz/FlowView/Particles.tsx`
- `src/components/viz/FlowView/OutcomePool.tsx`
- `src/components/viz/FlowView/LeakPoint.tsx`
- `src/components/viz/FlowView/flowVizModel.ts`
- `src/components/viz/FlowView/flowVizModel.test.ts`
- `src/components/viz/FlowView/FlowView.test.tsx`
- `src/test/setup.ts` (SVG path polyfill)
