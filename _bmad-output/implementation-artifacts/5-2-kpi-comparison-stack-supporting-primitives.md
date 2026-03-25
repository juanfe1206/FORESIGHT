# Story 5.2: KPI Comparison Stack & Supporting Primitives

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
after the run, I want six comparison cards with winner cues,
so that I can scan tradeoffs in seconds.

## Acceptance Criteria

_trace: FR18–FR24, UX-DR2, UX-DR8, UX-DR10, UX-DR11, UX-DR22; C3 KPI stack in `docs/integration-contracts.md`_

1. **Given** `uiStage` is `dashboard` and completed synthesis for both paths is available (use `MOCK_BAKERY_MAP_FIXTURE` / `KpiStackSlotProps` in the thin slice) **when** the dashboard stage renders **then** the **center** column shows a vertical **KPI comparison stack** of **six** rows, one per comparative dimension: **revenue impact**, **risk**, **customer impact**, **operating costs**, **competitive exposure**, and **“What you’d miss”** (`opportunityCost` string) — matching FR18–FR24 and the `KPIs` fields **`revenueImpact`**, **`risk`**, **`customerImpact`**, **`operatingCosts`**, **`competitiveExposure`**, **`opportunityCost`** (exclude **`overallScore`** from this stack; Story 5.3 / `ScoreRing` owns overall score — FR25).

2. **And** each row is implemented as a **`KPICard`** (or equivalent composed row) showing **Path A vs Path B** values, a **`ComparisonBar`** (proportional dual-bar or single bar split — animated fill), and a **`WinnerBadge`** when `comparison.winnerByKpi[kpiKey]` is present; when a key is **absent** from `winnerByKpi` (partial record is valid per `Partial<Record<keyof KPIs, "A" | "B">>`), show **no false winner** — use neutral copy, omit badge, or explicit “No clear lean” per UX judgment (document choice in component).

3. **And** **numeric** KPIs use **`CountUpNumber`** (~**1s**, ease-out) on first paint after enter; **`opportunityCost`** uses the **narrative** variant (two text blocks or truncated paragraphs side by side, no fake numeric count-up).

4. **And** the stack uses **staggered entrance** (e.g. y + opacity, ~**0.15s** delay between cards) and respects **`prefers-reduced-motion`** (skip or shorten count-up / bar animation per UX-DR24 / NFR-A3 pattern used in `AgentNode`).

5. **And** **`CountUpNumber`** (and other KPI numerics) use **JetBrains Mono** — `font-mono` / `--font-mono` token already wired in `src/app/globals.css` (UX-DR2).

6. **And** the center stack is driven by **`KpiStackSlotProps`** (`kpisA`, `kpisB`, `comparison`, `pathLabels`) from `src/lib/integration-contracts.ts`; **`MOCK_KPI_STACK_PROPS`** remains the canonical mock; **`ThinSliceDemo`** dashboard **center** replaces the placeholder “Comparison” block with the new stack wired from **`MOCK_BAKERY_MAP_FIXTURE`**-derived props (same shapes as `MOCK_KPI_STACK_PROPS`, optionally reusing that constant).

7. **And** new UI lives under **`src/components/dashboard/`** for **`KPICard`**, **`ComparisonBar`**, **`WinnerBadge`**, and a container **`KpiStack`** (or **`KPIPanel`** per master spec naming); **`CountUpNumber`** lives under **`src/components/shared/`** (per `_extracted-foresight-master-spec.md`).

8. **And** **accessibility:** KPI values and winner outcome are readable without color alone (badge text includes path name); structure uses sensible headings/`dl`/`row` roles where appropriate.

9. **And** **`npm run test`**, **`npm run lint`**, and **`npm run build`** pass; add focused tests for **`KpiStack`** / **`CountUpNumber`** behavior (reduced motion can be a light assertion if already patterned elsewhere).

## Tasks / Subtasks

- [x] **Primitives** (AC: 2, 3, 5, 7, 8)
  - [x] Add `src/components/shared/CountUpNumber.tsx` — animates from 0 (or previous) to target over ~1s; `font-mono`; reduced-motion fallback.
  - [x] Add `src/components/dashboard/ComparisonBar.tsx` — two values normalized to bar width; winner side emphasized (accent vs muted) per UX-DR11; animate width with motion.
  - [x] Add `src/components/dashboard/WinnerBadge.tsx` — pill, path-specific label using `pathLabels` (UX-DR10 slide-in after value settle).
  - [x] Add `src/components/dashboard/KPICard.tsx` — composes title, A/B values, bars, badge; supports `variant: "numeric" | "narrative"`.

- [x] **Stack + wiring** (AC: 1, 6, 7, 9)
  - [x] Add `src/components/dashboard/KpiStack.tsx` accepting **`KpiStackSlotProps`**; define stable **row order** and human-readable **titles** (map each `KPIs` key to copy: e.g. “Revenue impact”, “Risk”, …, “What you’d miss”).
  - [x] Replace `ThinSliceDemo` dashboard **center** placeholder with `<KpiStack {...} />` using props aligned with `MOCK_KPI_STACK_PROPS` (derive from state + `MOCK_BAKERY_MAP_FIXTURE` or import mock constant).
  - [x] **Refactor legacy dashboard UI:** remove or replace the inline `KpiCard` helper and **`buildThinSliceMockComparison`** usage for **dashboard** — side columns should not contradict canonical types. Prefer short **synthesis summary** + path label from `PathData` / fixture for left/right **until** Story 5.3 adds **`ScoreRing`** (keeps contract intent: path summary + future score region).

- [x] **Contracts & docs** (AC: 6)
  - [x] If props stay as-is, only refresh **`docs/integration-contracts.md`** C3 row if file paths / component names changed; keep **`src/lib/integration-contracts.test.ts`** green.

- [x] **Tests** (AC: 9)
  - [x] `KpiStack.test.tsx` (or similar): six rows, badge when `winnerByKpi` present, narrative row for `opportunityCost`.
  - [x] Update `ThinSliceDemo.test.tsx` if dashboard assertions referenced old “Comparison” placeholder text.

## Dev Notes

### Non-negotiable contracts

- **C3 — KPI stack:** `KpiStackSlotProps` in `src/lib/integration-contracts.ts`; mock `MOCK_KPI_STACK_PROPS`. [Source: `docs/integration-contracts.md` § Contract table, C3]
- **Types:** `KPIs`, `SimulationResponse["comparison"]` in `src/lib/types.ts`. `winnerByKpi` is **partial** — UI must tolerate missing keys (fixture omits `opportunityCost` today). [Source: `src/lib/types.ts`]
- **Slot guide:** Dashboard **center** = KPI stack + winner + CTA (CTA / “Read full story” polish may overlap Epic 4 — keep **Start over** or existing actions working). [Source: `docs/integration-contracts.md` § Slot mounting guide]

### Coordination with Story 5.1 (done)

- **5.1** ended with **dual-path AgentHUD only**; **KPI winner preview was removed** from the HUD in code review. **All** FR18–FR24 comparison **chrome** (six cards, bars, badges, count-up) belongs **here** in the **dashboard** stage — do not reintroduce a second KPI summary in `AgentHUD`. [Source: `_bmad-output/implementation-artifacts/5-1-agent-hud-agent-nodes.md` — Review Findings / Completion Notes]

### Coordination with Story 5.3 (not in this story)

- **`ScoreRing`** and **overallScore** presentation in **side panels** are Story **5.3**. Do not block 5.2 on ring graphics; leave side panels as **light summaries** or fixture-driven copy until 5.3.

### UX & motion

- **KPICard:** purpose, anatomy, variants (numeric / categorical / narrative), stagger + count-up, explicit winner text. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § KPICard]
- **UX-DR8 / UX-DR10 / UX-DR11 / UX-DR22 / UX-DR2:** stagger, badge timing, comparison bars, skeleton/skeleton-like loading optional if fast fixture (master spec lists skeleton — acceptable to defer if loading state not modeled yet; prefer thin skeleton placeholders if trivial).
- Reuse **Framer Motion** patterns from `ThinSliceDemo` / `AgentHUD` (`springTransition`, `MotionConfig`).

### Presentation hints for numeric `KPIs`

- Domain numbers in fixture are **small integers** (e.g. `revenueImpact: 12`) — treat as **index or %-style scores** for bar normalization (e.g. `value / (value + other)`) unless product copy specifies units; **do not** invent currency conversion in UI — display consistent formatted labels (e.g. `${value}%` or “Index: n”) and keep **accessible** text in sync.

### Reuse / avoid reinventing

- Use existing **`font-mono`** / **`text-kpi`** tokens from `globals.css`.
- Do **not** add a numeric animation library; **Framer Motion** `animate` or a small `requestAnimationFrame` loop is enough for count-up.

### Project structure notes

- **New:** `src/components/dashboard/*`, `src/components/shared/CountUpNumber.tsx`
- **Touch:** `src/components/shell/ThinSliceDemo.tsx`, possibly `src/lib/thin-slice-mock.ts` (deprecate dashboard use or leave for non-dashboard dev only), tests under `src/components/...`

### Testing

- Vitest + Testing Library; follow `AgentHUD.test.tsx` patterns.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.2]
- [Source: `_bmad-output/planning-artifacts/epics.md` — UX-DR2, UX-DR8, UX-DR10, UX-DR11, UX-DR22]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — dashboard, KPI comparison payload]
- [Source: `_bmad-output/planning-artifacts/_extracted-foresight-master-spec.md` — `components/dashboard/*`, `shared/CountUpNumber.tsx`]
- [Source: `src/lib/mock-fixture.ts` — `MOCK_BAKERY_MAP_FIXTURE` KPI + `comparison` shapes]
- [Source: `src/lib/integration-contracts.ts` — `KpiStackSlotProps`, `MOCK_KPI_STACK_PROPS`]

### Previous story intelligence

- **5.1** established **Framer Motion** springs, **reduced-motion** handling in agents, **`@/` imports**, and **strict removal of comparison props from `AgentHudSlotProps`**. KPI data **only** on dashboard via **`KpiStackSlotProps`**. [Source: `_bmad-output/implementation-artifacts/5-1-agent-hud-agent-nodes.md`]

### Git intelligence (recent patterns)

- Recent commits: **`ThinSliceDemo`** + **integration contracts** + dual-path HUD — extend the same **shell** composition; avoid new global state libraries.

### Latest stack note

- **Next.js `16.2.1`**, React **19**, Tailwind **v4**, Framer Motion **^12.38** — follow `package.json`. [Source: `package.json`]

### Web / version note

- No new runtime dependencies required for this story; prefer **Framer Motion 12** APIs consistent with existing `motion` usage in repo.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented six-row `KpiStack` from `KpiStackSlotProps` with stable order (`KPI_STACK_ROW_DEFS`); excluded `overallScore` for Story 5.3.
- **Partial `winnerByKpi`:** when a key is missing, **no `WinnerBadge`** is rendered; numeric rows still show a neutral dual bar (`ComparisonBar` without winner emphasis). Narrative `opportunityCost` follows the same rule (fixture omits winner for that key).
- `CountUpNumber`: ~1s ease-out cubic via `requestAnimationFrame`; when `useReducedMotion() === true`, final value is shown immediately (no effect-driven count-up state).
- `ComparisonBar` / stack card stagger use `useReducedMotion()` to skip width animation and stagger delays.
- `WinnerBadge` uses spring slide-in with **~1s delay** when motion is allowed (after count-up settle); badge copy includes **Path A/B** plus full path label for non–color-only comprehension.
- Dashboard center: `{...MOCK_KPI_STACK_PROPS, pathLabels: hudPathLabels}`; side columns: `PathSummaryCard` with fixture `synthesis.summary` + user-derived labels (removed inline `KpiCard` / `buildThinSliceMockComparison` from dashboard).
- C3 doc row updated with `KpiStack` path; `integration-contracts.test.ts` unchanged (still green).

### File List

- `src/components/shared/CountUpNumber.tsx`
- `src/components/dashboard/ComparisonBar.tsx`
- `src/components/dashboard/WinnerBadge.tsx`
- `src/components/dashboard/KPICard.tsx`
- `src/components/dashboard/KpiStack.tsx`
- `src/components/dashboard/KpiStack.test.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `docs/integration-contracts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-kpi-comparison-stack-supporting-primitives.md`

### Review Findings

- [x] [Review][Decision] Reduced motion — stagger delay zeroed but opacity/y entrance still animates — deferred to a11y polish pass; "shorten" accepted per spec. [src/components/dashboard/KpiStack.tsx:46–54]
- [x] [Review][Dismiss] `WinnerBadge` color — badge always uses `text-accent` per base design file; intentional.
- [x] [Review][Patch] `KpiStack` subtitle dev placeholder replaced with "Six dimensions compared side by side." [src/components/dashboard/KpiStack.tsx:39]
- [x] [Review][Patch] `KPICard` aria-label "percent index" phrase removed; now `${title}: ${value}%` [src/components/dashboard/KPICard.tsx:79–88]
- [x] [Review][Patch] `ComparisonBar` guards negative values with `Math.max(0, ...)` before percentage computation [src/components/dashboard/ComparisonBar.tsx:17–20]
- [x] [Review][Patch] `WinnerBadge` now has `data-testid="winner-badge"`; test updated to query by test ID [src/components/dashboard/KpiStack.test.tsx:59, src/components/dashboard/WinnerBadge.tsx:20]
- [x] [Review][Patch] `KPICard` no-winner code paths now carry explanatory comments per AC2 [src/components/dashboard/KPICard.tsx:56, 102]
- [x] [Review][Defer] `CountUpNumber` initial "0%" flash on first frame — inherent to count-from-zero design; not a defect [src/components/shared/CountUpNumber.tsx:36] — deferred, pre-existing
- [x] [Review][Defer] `CountUpNumber` no internal NaN guard — guarded at all callsites via `Number.isFinite`; internal guard would be defensive but not urgent [src/components/shared/CountUpNumber.tsx] — deferred, pre-existing
- [x] [Review][Defer] `line-clamp-5` silently truncates long narrative KPIs — acceptable with current fixture data; production truncation may need revisit when real API data arrives [src/components/dashboard/KPICard.tsx:49] — deferred, pre-existing

### Change Log

- 2026-03-25: Story 5.2 context file created (create-story workflow).
- 2026-03-25: Implemented KPI stack primitives, `KpiStack`, `ThinSliceDemo` wiring, tests, C3 doc note; story marked **review**.
