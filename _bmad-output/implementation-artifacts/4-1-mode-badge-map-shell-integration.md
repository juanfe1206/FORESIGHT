# Story 4.1: Mode Badge & Map Shell Integration

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a small business owner,
I want to see which visualization mode the system chose,
so that I trust the UI is adapting to my decision type.

## Acceptance Criteria

_trace: FR12, UX-DR5 (mode pill with text/icon + accent); Epic 4 Story 4.1 in `epics.md`; `docs/integration-contracts.md` C1 `VizSlotProps`; UX "VizRouter + Mode Shells" anatomy_

1. **Given** a run with resolved `viz_type` (`VizType` from `src/lib/types.ts`)
   **When** the simulation UI renders (at least `running`, and consistently wherever the badge is shown per AC2)
   **Then** `ModeBadge` renders a **textual** pill identifying the mode (map / flow / network / fallback) with an icon or text label — **never color-only** (FR12, UX-DR5).

2. **And** badge placement is **consistent across shell states** that show the three-panel or results layout: same horizontal band and alignment (spec: orientation anchor at **top of the simulation layout**, below the app header / dev preview — match UX “persistent orientation anchors” pattern in `ux-design-specification.md`).

3. **And** when `viz_type === "map"`, the **left and right** visualization panels reserve **dedicated map canvas regions** (fixed minimum size, clear bounding box, non-crashing placeholder acceptable) so **Story 4.2** can drop `MapView`/`MapHalf` into the same slots without reflowing the shell.

4. **And** implementation composes from existing contracts: `VizSlotProps` (`src/lib/integration-contracts.ts`) already includes `viz_type`; do not fork parallel type definitions.

5. **And** tests: at minimum one test proving `ModeBadge` exposes visible mode text (not color alone) for a given `viz_type`, and map mode side panels expose stable regions (e.g. `data-testid` hooks).

## Tasks / Subtasks

- [x] **Single source for `viz_type` in the thin shell**
  - [x] Add `vizType: VizType` to app shell state **or** derive it in `ThinSliceDemo` from the same value as `MOCK_BAKERY_MAP_FIXTURE.viz_type` when entering `running` / `dashboard` / `deepDive` (preferred: extend `UiShellState` + `UiShellContext` in `src/lib/ui-state.ts` / `src/lib/ui-shell-context.tsx` so Epic 5/6 consumers read one context — keep defaults aligned with `mock-fixture.ts`).
  - [x] Dev preview: optional `vizType` selector (non-production) mirroring existing `uiStage` / `runStatus` selectors for manual QA of map vs flow vs network layouts.

- [x] **`ModeBadge` component**
  - [x] New file under `src/components/` (suggested: `src/components/running/ModeBadge.tsx` — aligns with architecture “Running” feature list; alternative `src/components/shell/ModeBadge.tsx` if you keep all shell chrome together).
  - [x] Props: `vizType: VizType` (and optional `className`).
  - [x] Visual: pill + icon or short label text; mode-specific copy (e.g. “Map”, “Flow”, “Network”, “Fallback”) — UX-DR5 example format in `epics.md` is illustrative; keep concise for the pill.
  - [x] Accessibility: visible text; if color accent differs by mode, pair with text/icon (WCAG non-color-only).

- [x] **Map shell regions (Story 4.1 scope, not full map)**
  - [x] **Do not** add `react-map-gl` or Mapbox in this story — that is **Story 4.2**.
  - [x] When `viz_type === "map"`, left/right panel content uses a **reserved region** (e.g. `min-h-[…]`, `aspect-*` or fixed height band, `rounded-xl`, subtle border/bg) inside `SimulationShell` slots, with `data-testid` for tests.
  - [x] When `viz_type` is not `map`, keep or adjust layout per product sense; AC3 only mandates map canvas reservation for map mode.

- [x] **Wire `ThinSliceDemo` / `SimulationShell`**
  - [x] Mount `ModeBadge` in the **same relative position** for `running`, `dashboard`, and `deepDive` when those stages show the comparative layout (not necessarily on `input`).
  - [x] Pass `vizType` into side panel bodies where `VizSlotProps`-shaped data will eventually feed `VizRouter` (Epic 3/5); for now, placeholder content inside reserved regions is fine.

- [x] **Verification**
  - [x] `npm run lint`, `npm run test`, `npm run build`.
  - [x] No regression: existing `ThinSliceDemo` tests (`ThinSliceDemo.test.tsx`) updated if layout/selectors change.

### Review Findings

- [x] [Review][Patch] `ModeGlyph` switch has no `default` case — add `default: return null` to satisfy `noImplicitReturns` and guard against future `VizType` additions [`src/components/running/ModeBadge.tsx`]
- [x] [Review][Patch] `accentClass.flow` uses raw Tailwind palette class `border-blue-500/45` instead of a design token — violates task token-alignment constraint (all other modes use token-style classes) [`src/components/running/ModeBadge.tsx`]
- [x] [Review][Patch] Vertical rhythm inconsistent across stages: `running` has no gap between `VizOrientationBand` and `SimulationShell`, `dashboard` has `gap-6`, `deepDive` has `gap-4` — violates AC2 consistent horizontal band placement [`src/components/shell/ThinSliceDemo.tsx`]
- [x] [Review][Defer] `VIZ_TYPES` runtime array duplicates the `VizType` union literals — drift risk if union extends; single authoritative source preferred [`src/lib/ui-state.ts`] — deferred, pre-existing
- [x] [Review][Defer] `onSubmit` hardcodes `MOCK_BAKERY_MAP_FIXTURE.viz_type` without `isVizType` guard — typed TypeScript covers it now; guard warranted when real API response replaces the fixture [`src/components/shell/ThinSliceDemo.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Default context no-op setters — `setVizType` outside a Provider silently succeeds; consider dev-mode invariant [`src/lib/ui-shell-context.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Tests don't assert orientation band presence in `dashboard` / `deepDive` stages — AC5 minimally satisfied; coverage gap is not a regression [`src/components/shell/ThinSliceDemo.test.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `page.tsx` re-exports `isVizType` / `VizType` from route module — widens public surface of a page entry point [`src/app/page.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `aria-live="polite"` on `ModeBadge` with `role="status"` — may generate noisy SR announcements if multiple badge instances appear in one render cycle [`src/components/running/ModeBadge.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `VizMapSideCanvas` returns bare fragment for non-map modes — no reserved region; side panel height jumps on viz switch [`src/components/shell/VizMapSideCanvas.tsx`] — deferred, intentional per AC3 scope
- [x] [Review][Defer] Dev `vizType` `<select>` options hard-coded separately from `VIZ_TYPES` constant — could drift from the union [`src/components/shell/ThinSliceDemo.tsx`] — deferred, pre-existing

## Dev Notes

### Architecture compliance

- **Stack:** Next `16.2.1`, React `19`, Tailwind v4, Framer Motion `12.x` — see `package.json`. Architecture markdown may say “Next.js 14”; follow the **repo**.
- **Contracts:** C1 `VizSlotProps` — `src/lib/integration-contracts.ts`; types — `src/lib/types.ts` (`VizType`).
- **Slots:** `PanelSlots.tsx`, `SimulationShell.tsx`, orchestration — `ThinSliceDemo.tsx` ([Source: `docs/integration-contracts.md`](../docs/integration-contracts.md)).
- **Epic boundaries:** This story integrates **badge + map shell regions**. **Story 4.2** adds geographic `MapView` (react-map-gl). **Story 4.3** adds `DeepDivePanel` narrative.

### Project structure notes

- Prefer **one** `viz_type` / `vizType` source wired into context so `ModeBadge`, future `VizRouter`, and `AgentHUD` (`AGENT_ROLES[viz_type]`) stay aligned.
- Keep new components **token-aligned** (`border-border`, `bg-surface`, `text-caption`, etc.) — see existing shell classes in `ThinSliceDemo.tsx`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md`](../planning-artifacts/epics.md) — Epic 4, Story 4.1 acceptance criteria
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`](../planning-artifacts/ux-design-specification.md) — “VizRouter + Mode Shells” (anatomy: mode badge + visualization canvas)
- [Source: `docs/integration-contracts.md`](../../docs/integration-contracts.md) — C1, slot mounting guide
- [Source: `src/lib/integration-contracts.ts`](../../src/lib/integration-contracts.ts) — `VizSlotProps`, mocks
- [Source: `src/components/shell/ThinSliceDemo.tsx`](../../src/components/shell/ThinSliceDemo.tsx) — current shell orchestration (no `viz_type` yet)

### Previous story intelligence

- No Epic 3/4 story files exist under `implementation-artifacts/` yet; **Epic 1 Story 1.4** (`1-4-parallel-integration-contract-ownership-boundaries.md`) defined `VizSlotProps` and explicitly noted contracts were **not yet wired** to shell components — **this story performs part of that wiring** for mode + map shell layout only.
- Do **not** re-declare types from `types.ts`; import `VizType` and reuse `VizSlotProps` shapes.

### Git intelligence (recent commits)

- Recent work focused on UI state machine (`ui-state.ts`), `ThinSliceDemo`, and integration contract docs/tests — follow established patterns: Vitest, `@/` imports, `data-testid` for shell regions.

### Latest technical notes (guardrails)

- **Do not** add `react-map-gl` / Mapbox deps until Story 4.2 — keeps dependency surface and CI stable.
- If you extend `UiShellContext`, update `UiShellContext.Provider` value in `ThinSliceDemo.tsx` and any tests that mock context.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

None.

### Completion Notes List

- Extended `UiShellState` / `UiShellContext` with `vizType` and `setVizType`, default `"map"` aligned with `MOCK_BAKERY_MAP_FIXTURE.viz_type`; submit sets fixture `viz_type`; `data-viz-type` on thin-slice root for debugging.
- Added `ModeBadge` (text + glyph per mode, never color-only) and `VizOrientationBand` at top of `running` / `dashboard` / `deepDive` main content; dev-only `vizType` select.
- Added `VizMapSideCanvas` for map-mode left/right reserved regions (`map-canvas-region-left` / `map-canvas-region-right`); no map libraries added.
- Tests: `ModeBadge.test.tsx`, `VizMapSideCanvas.test.tsx`, `ThinSliceDemo` coverage for badge + regions; full suite + lint + build passing.

### File List

- `src/lib/ui-state.ts`
- `src/lib/ui-shell-context.tsx`
- `src/components/running/ModeBadge.tsx`
- `src/components/running/ModeBadge.test.tsx`
- `src/components/shell/VizMapSideCanvas.tsx`
- `src/components/shell/VizMapSideCanvas.test.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `src/app/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-03-24: Story 4.1 — mode badge, shell `vizType` context, map canvas slot placeholders, tests, sprint status.

---

**Completion status:** Implementation complete; status set to **review**.
