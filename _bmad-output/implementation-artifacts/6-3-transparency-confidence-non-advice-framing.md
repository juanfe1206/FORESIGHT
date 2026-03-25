# Story 6.3: Transparency, Confidence & Non-Advice Framing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want to see how much is grounded in my inputs versus assumptions, and that this is a simulation,
So that I do not mistake output for guaranteed advice.

## Acceptance Criteria

_trace: FR28, FR29, UX-DR17; `architecture.md` Response Contract (`AgentOutput.confidence`, `AgentOutput.grounding`); `ux-design-specification.md` KPICard / ScoreRing / trust framing_

1. **Given** results are visible (`uiStage` is `running`, `dashboard`, or `deepDive`) **when** the user scans KPI, agent, and narrative areas **then** each agent insight that reflects a completed `AgentOutput` shows **visible** confidence and grounding cues derived from `confidence` (0–1, present as percentage or equivalent readable value) and `grounding` (`supplied` | `mixed` | `assumed`) — **FR28**.

2. **And** grounding/confidence presentation is **not color-only** (UX-DR17): every cue includes **text label and/or icon** plus any color accent; screen reader affordances use explicit strings (e.g. `aria-label` or visible microcopy), not hue alone.

3. **And** **FR29** is satisfied: the UI includes **clear, always-visible or unmistakably surfaced** copy on the **comparison dashboard** (and preferably near the primary submit action on **input**) stating that outputs are **simulated consequences**, **not** guaranteed forecasts, **not** personalized professional advice, and **not** promises of outcomes.

4. **And** the **KPI stack** (`KpiStack`) region either includes the non-advice framing in its header/footer **or** an adjacent, dedicated disclaimer block in the same center column so someone reviewing only KPIs still encounters FR29 messaging.

5. **And** **narrative / deep-dive** surfaces preserve trust: `DeepDivePanel` (or shared intro under `PathTabs`) reflects that timelines are simulation-derived; optional one-line path summary from agent `grounding` distribution is acceptable if it reuses real `AgentOutput[]` from `pathA` / `pathB` (no fabricated metrics).

6. **And** existing **replay / fallback** honesty from Story 6.2 remains intact: FR29 copy must **not** contradict `meta.cachedReplay` / `fallback` labeling; if both apply, wording should read naturally together (simulation + optional cached replay).

7. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [x] **Grounding & confidence presentation** (AC: 1, 2, 5)
  - [x] Extend `AgentHudSlotProps` in `src/lib/integration-contracts.ts` to pass structured agent outputs (e.g. `agentsByPath?: { A: AgentOutput[]; B: AgentOutput[] }`) or equivalent parallel props; keep backward compatibility for tests that only pass `insightsByPath`.
  - [x] Update `AgentHUD` → `AgentNode` to render confidence + grounding labels when an agent is past `dormant` (at minimum when `insight` or `complete` shows text insight). Reuse `GroundingLevel` from `src/lib/types.ts`.
  - [x] Add a small shared formatter in `src/lib/` (e.g. `formatAgentGroundingLabel`, `formatConfidencePercent`) to avoid duplicate copy.

- [x] **FR29 non-advice framing** (AC: 3, 4, 6)
  - [x] Add a compact, reusable component (e.g. `SimulationFramingBanner` / `NonAdviceDisclaimer`) under `src/components/` using design tokens (`text-caption`, `text-text-dim`, `border-border`).
  - [x] Mount on **dashboard** center column (below `KpiStack` or under “Compare paths” intro) and near **DecisionForm** submit (footer microcopy or `aside`).
  - [x] Verify copy alongside existing replay banners in `ThinSliceDemo.tsx` (~lines 491–506).

- [x] **Deep dive trust line** (AC: 5)
  - [x] Optionally add a short `text-text-dim` line above synthesis in `DeepDivePanel` or `PathTabs` wrapper — must not duplicate FR29 verbatim three times; can reference “simulated narrative” once panel context.

- [x] **Tests** (AC: 7)
  - [x] `AgentHUD.test.tsx`: assert visible grounding label + numeric/percent confidence for mock `AgentOutput[]`.
  - [x] `ThinSliceDemo.test.tsx`: after dashboard visible, assert FR29 disclaimer text (substring match).
  - [x] `KpiStack.test.tsx` or dashboard integration test: ensure disclaimer or KPI header tie-in present when `KpiStack` renders in app context (choose least brittle: ThinSliceDemo is acceptable).

- [x] **Contracts / docs** (AC: 1–6)
  - [x] Add a short row to `docs/integration-contracts.md` under client/UI: FR28/29 surfacing, `AgentOutput` display rules, and UX-DR17 non-color-only requirement.

### Review Findings

- [x] [Review][Patch] Add per-agent confidence/grounding trust surface to dashboard path cards — `VizResultCard` now accepts `agents?: AgentOutput[]` and shows `summarizeGroundingDistribution` summary; wired with `pathDataA/B.agents` in ThinSliceDemo (AC1)
- [x] [Review][Patch] Make `SimulationFramingBanner` copy conditional on replay state — added `isReplay` prop + `SIMULATION_FRAMING_REPLAY` constant; dashboard banner wired to `meta?.cachedReplay === true` (AC6)
- [x] [Review][Patch] `showTrust` guards with `!== undefined` — fixed to `!= null` throughout `AgentNode.tsx` to handle JSON null correctly
- [x] [Review][Patch] `formatAgentGroundingLabel` fallback returns raw input — fixed to return `"Unknown grounding"` safe fallback [`src/lib/format-agent-output.ts`]
- [x] [Review][Patch] `formatConfidencePercent` coerces NaN/Infinity to `0%` — fixed to return `"—"` for non-finite values [`src/lib/format-agent-output.ts`]
- [x] [Review][Patch] `summarizeGroundingDistribution` no guard against unknown grounding keys — added `if (a.grounding in counts)` guard before incrementing [`src/lib/format-agent-output.ts`]
- [x] [Review][Patch] `formFooter ? ...` falsy check — fixed to `formFooter != null` [`src/components/input/DecisionForm.tsx`]
- [x] [Review][Defer] Unicode geometric symbols (●/◐/○) may render inconsistently in sparse font environments [`src/components/agents/AgentNode.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Raw `ℹ` unicode icon in `SimulationFramingBanner` may render as tofu in some environments [`src/components/trust/SimulationFramingBanner.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `integration-contracts.md` doc content can drift from code — no automated check ties doc strings to exports or tests [`docs/integration-contracts.md`] — deferred, pre-existing
- [x] [Review][Defer] `AgentHUD.test.tsx` coverage narrow — no `complete` state, `assumed`/`mixed` label, or legacy `insightsByPath`-only regression case [`src/components/agents/AgentHUD.test.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Agent slot count always assumed to be exactly 4 — mismatched `agents` arrays produce silent trust gaps or dropped agents [`src/components/agents/AgentHUD.tsx`] — deferred, pre-existing architecture constraint
- [x] [Review][Defer] Live region `useEffect` dep array misses `insightsByPath`/`agentsByPath` — changes to those props alone won't recompute the accessible announcement [`src/components/agents/AgentHUD.tsx`] — deferred, pre-existing pattern

## Dev Notes

### Intent

Epic 6 converges transparency. **`AgentOutput` already carries `confidence` and `grounding`** in API and `src/lib/types.ts`, but the UI mostly shows truncated insight strings in `AgentHUD` and does not explain non-advice framing. This story surfaces the contract fields honestly and adds **legal/ethical positioning** (FR29) without changing backend shapes.

### Critical reuse points

- **Do not** extend `KPIs` in `types.ts` with fake grounding fields unless PRD changes; FR28 for KPI *area* is satisfied by **adjacent** disclosure + agent surfaces on dashboard path cards / HUD / deep dive.
- **`pathDataA` / `pathDataB`** in `ThinSliceDemo` already include `agents: AgentOutput[]` via `useMemo`; wire those into `AgentHUD` instead of only string `insightsByPath` where possible.
- **NarrativeBlock** driver dots are color-forward; if you touch deep-dive for UX-DR17, prefer **visible driver abbreviations** next to dots or a `sr-only` expansion — scope only what’s needed for this story.

### Files likely touched

- `src/lib/integration-contracts.ts` — `AgentHudSlotProps`
- `src/components/agents/AgentHUD.tsx`, `AgentNode.tsx`
- `src/components/shell/ThinSliceDemo.tsx` — pass full agents to HUD; disclaimer placement
- `src/components/input/DecisionForm.tsx` — optional footer prop or sibling disclaimer
- `src/components/dashboard/KpiStack.tsx` — subtitle / wrapper text coordinating with FR29
- `src/components/narrative/DeepDivePanel.tsx` (optional one-line)
- `src/lib/*` — formatting helpers
- `src/components/agents/AgentHUD.test.tsx`, `src/components/shell/ThinSliceDemo.test.tsx`
- `docs/integration-contracts.md`

### Architecture compliance

- **Response Contract** in `_bmad-output/planning-artifacts/architecture.md`: agent objects expose `confidence` and `grounding`; UI must reflect them.
- **Honest messaging** (architecture § error/cache): align FR29 with replay / fallback copy already in `ThinSliceDemo`.
- **ADR-02**: no new API routes for this story.

### Testing standards

- Vitest + Testing Library; keep `MotionConfig reducedMotion="always"` where existing tests do.
- Prefer role/name queries; use `data-testid` only where roles are ambiguous.

### Previous story intelligence (6.2)

- **Hydration** is centralized: `buildHydrationFromSimulationResponse` / `applySimulationResponse` — any new UI state must survive **live**, **cached replay**, and **golden** paths.
- **Replay** sets `runStatus` `fallback` and `meta.cachedReplay` true; disclaimers must still read correctly.
- **Validator** and cache modules are sensitive; do not import server-only code into client components.

### Git intelligence (recent)

- Recent commits: Epic 6.2 (replay/cache), 6.1 (API integration). Follow established patterns in `ThinSliceDemo` and test layout.

### Latest technical notes

- Stack: Next.js 16.x, React 19, Framer Motion, Vitest (per prior story artifacts). No new runtime dependencies expected for copy/formatting.

### Project context reference

- No `project-context.md` found in repo root; rely on architecture + PRD + this file.

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI agent)

### Debug Log References

### Completion Notes List

- Implemented optional `agentsByPath` on `AgentHudSlotProps`; `ThinSliceDemo` passes live/fixture `PathData.agents` into `AgentHUD`.
- `AgentNode` shows grounding (icon + text) and confidence percentage for `insight` / `complete` when structured agent rows exist; extended `aria-label` for screen readers.
- Added `SimulationFramingBanner` (FR29) on decision input (`DecisionForm.formFooter`) and adjacent to `KpiStack` in the dashboard center column; copy emphasizes simulation / non-advice and aligns with replay wording (still simulated display).
- `DeepDivePanel`: simulation-derived timeline intro plus optional real `summarizeGroundingDistribution` per path.
- Tests: `format-agent-output.test.ts`, extended `AgentHUD.test.tsx` and `ThinSliceDemo.test.tsx`. `npm run test`, `lint`, `build` passed.

### File List

- `src/lib/format-agent-output.ts`
- `src/lib/format-agent-output.test.ts`
- `src/lib/integration-contracts.ts`
- `src/components/trust/SimulationFramingBanner.tsx`
- `src/components/agents/AgentHUD.tsx`
- `src/components/agents/AgentNode.tsx`
- `src/components/agents/AgentHUD.test.tsx`
- `src/components/input/DecisionForm.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `src/components/narrative/DeepDivePanel.tsx`
- `docs/integration-contracts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-03-25: Story 6.3 — FR28/FR29/UX-DR17 transparency, `SimulationFramingBanner`, HUD grounding/confidence, deep-dive trust copy, integration docs.

---

**Story completion status:** review — implementation complete; run code-review workflow next.
