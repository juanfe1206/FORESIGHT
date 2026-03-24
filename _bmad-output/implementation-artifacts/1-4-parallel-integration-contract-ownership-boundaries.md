# Story 1.4: Parallel Integration Contract & Ownership Boundaries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want explicit contracts for cross-epic integration points,
So that Epics 2–5 can execute in parallel without forward dependency blocking.

## Acceptance Criteria

_trace: FR4 (path_labels derivation), FR7 (isolated agent execution), FR13 (three-panel layout), FR18 (dashboard), FR26 (deep dive), ADR-02 (single endpoint), ADR-03 (parallel agents), ADR-04 (viz_type routing); Epic cross-dependency contract from epics.md_

1. **Given** all parallel epic owners are ready to start **when** they open the integration contract document **then** the document defines typed state/event interfaces between the simulation shell, HUD/KPI stack, and deep-dive handoff — referencing canonical source file paths for each contract.
2. **And** each contract entry includes: owner epic, source-of-truth file path, expected TypeScript prop/payload shape, and mock fallback behavior for independent local verification.
3. **And** no story completion criteria in Epics 2–5 reference "waiting for Epic 6" — all contracts are independently verifiable using mock data from the existing fixture.
4. **And** a short compatibility test file verifies that contract types compile against the shared types in `src/lib/types.ts` without requiring cross-epic component merges.

## Tasks / Subtasks

- [x] **Create `src/lib/integration-contracts.ts` — typed slot interfaces (AC 1–2)**
  - [x] Export `VizSlotProps` — common props received by all viz components (`viz_type`, `pathData`, `pathLabel`); owned by Epic 3 (FlowView) / Epic 4 (MapView) / Epic 5 (NetworkView, FallbackViz).
  - [x] Export `AgentHudSlotProps` — center panel running-state props (`agentStates: AgentState[]`, `roles: string[]`, `viz_type: VizType`); owned by Epic 5.
  - [x] Export `KpiStackSlotProps` — center panel dashboard-state props (`kpisA: KPIs`, `kpisB: KPIs`, `comparison: SimulationResponse["comparison"]`, `pathLabels`); owned by Epic 5.
  - [x] Export `ScoreRingSlotProps` — side panel score region (`score: number`, `pathLabel: string`); owned by Epic 5.
  - [x] Export `DeepDivePanelSlotProps` — deep-dive stage center props (`pathA: PathData`, `pathB: PathData`, `pathLabels`); owned by Epic 4.
  - [x] Export mock stub constants (`MOCK_VIZ_SLOT_PROPS_A`, `MOCK_AGENT_HUD_PROPS`, `MOCK_KPI_STACK_PROPS`, `MOCK_SCORE_RING_PROPS_A`, `MOCK_DEEP_DIVE_PROPS`) built from the existing mock fixture so each epic can develop offline without cross-team merge.
  - [x] Do NOT re-declare types already in `src/lib/types.ts` — import and compose.

- [x] **Create `docs/integration-contracts.md` — living contract reference (AC 1–3)**
  - [x] Add a contract table for each integration point: Contract ID, Owner Epic, Source file, TypeScript interface name, Mock constant, Verification command.
  - [x] Cover these six integration points: (1) Viz slot (FlowView/MapView/NetworkView/FallbackViz), (2) AgentHUD center slot, (3) KPI stack center slot, (4) ScoreRing side slot, (5) DeepDivePanel center slot, (6) SimulationResponse API contract (Epic 2 → all UI).
  - [x] For the API contract (Epic 2), document that `src/lib/types.ts` is the source of truth; the `MOCK_BAKERY_MAP_FIXTURE` in `src/lib/mock-fixture.ts` is the mock fallback for local development.
  - [x] Include a "No-Epic-6 guarantee" section confirming each contract is self-contained and verifiable with mock data alone.
  - [x] Include a "Slot mounting guide" section: for each stage (`running`, `dashboard`, `deepDive`), list which slot (left/center/right from `PanelSlots.tsx`) each epic mounts into.

- [x] **Create `src/lib/integration-contracts.test.ts` — compatibility test checklist (AC 4)**
  - [x] Type-assignment tests (assign each mock constant to its typed interface without `as any` — compilation is the test).
  - [x] Assert mock constants for `VizSlotProps` reference valid `VizType` values.
  - [x] Assert `MOCK_KPI_STACK_PROPS.comparison.overallWinner` is `"A"` or `"B"` (regression guard for `SimulationResponse` shape).
  - [x] Assert `MOCK_AGENT_HUD_PROPS.agentStates.length === 4` (guards agent count contract).
  - [x] Tests must pass with `npm run test` (Vitest) — no Jest, no additional deps.

- [x] **Lock in quality and regression checks**
  - [x] Run `npm run lint`, `npm run test`, `npm run build`.
  - [x] Confirm no changes to `src/lib/types.ts`, `src/lib/ui-state.ts`, `src/lib/ui-shell-context.tsx`, or any shell component — this story only adds, does not modify existing contracts.

### Review Findings

- [x] [Review][Defer] Slot mounting guide: PanelSlots vs SimulationShell for `running` stage — Guide is intentionally conceptual; Epic 5 devs will cross-reference `ThinSliceDemo.tsx` directly. — deferred, pre-existing
- [x] [Review][Patch] Guard `MOCK_KPI_STACK_PROPS.comparison` is defined before accessing `overallWinner` [src/lib/integration-contracts.test.ts:33-35]
- [x] [Review][Patch] Guard `viz.pathLabel` is a string before accessing `.length` [src/lib/integration-contracts.test.ts:17]
- [x] [Review][Patch] Doc inaccuracy: "UI slot contracts use typed props plus mocks derived from MOCK_BAKERY_MAP_FIXTURE" — AgentHUD mock uses hard-coded dormant states, not fixture data [docs/integration-contracts.md:25]
- [x] [Review][Patch] C1–C5 contract table rows lack "mock fallback behavior" prose (AC2 requires: owner, source, shape, mock fallback) [docs/integration-contracts.md:7-14]
- [x] [Review][Patch] Missing VizType guard test for `MOCK_AGENT_HUD_PROPS.viz_type` [src/lib/integration-contracts.test.ts]
- [x] [Review][Defer] `overallWinner` test only exercises "B"; no alternate mock for path "A" [src/lib/integration-contracts.test.ts:38-40] — deferred, pre-existing
- [x] [Review][Defer] Contract interfaces not yet wired to any shell component (orphan types by design) [src/lib/integration-contracts.ts] — deferred, by design
- [x] [Review][Defer] Contracts omit loading/error/partial-path lifecycle concerns [src/lib/integration-contracts.ts] — deferred, Epic 2–5 scope
- [x] [Review][Defer] Living doc defines no versioning or change-notice process [docs/integration-contracts.md] — deferred, process gap
- [x] [Review][Defer] AC3 compliance (no "waiting for Epic 6" in epics.md) not verified in diff [_bmad-output/planning-artifacts/epics.md] — deferred, outside diff scope
- [x] [Review][Defer] Module-level fixture null-safety not guarded at runtime; TypeScript `satisfies` provides compile-time cover [src/lib/integration-contracts.ts:5] — deferred, compile-time coverage sufficient
- [x] [Review][Defer] Dual public names `MOCK_BAKERY_MAP_FIXTURE` / `MOCK_SIMULATION_RESPONSE` could cause import drift [src/lib/mock-fixture.ts] — deferred, intentional per spec

### Review Findings To Preempt

- [x] Do NOT re-declare `UiStage`, `UiRunStatus`, `VizType`, `AgentState`, `KPIs`, `PathData`, `SimulationResponse` — they already exist in `src/lib/ui-state.ts` and `src/lib/types.ts`. Import and extend only.
- [x] Do NOT create components in this story — `integration-contracts.ts` exports interfaces and mock data only, no JSX.
- [x] Do NOT modify `ThinSliceDemo.tsx`, `PanelSlots.tsx`, or `SimulationShell.tsx` — they are done; this story adds a contract layer above them.
- [x] `docs/` folder may need to be created if it does not exist — verify with `ls` before creating `integration-contracts.md`.

## Dev Notes

### Current Brownfield Reality

- Stack: **Next `16.2.1`**, React `19.2.4`, TypeScript, Tailwind v4, Framer Motion `12.x`, Vitest.
- **Architecture doc refers to "Next.js 14"** — the running version is `16.2.1`; follow current runtime contracts in the codebase, not planning doc wording.
- All Epic 1 contracts are in place from Stories 1.1–1.3:
  - `src/lib/types.ts` — full API contract types (`SimulationRequest`, `SimulationResponse`, `KPIs`, `PathData`, `AgentOutput`, `AGENT_ROLES`).
  - `src/lib/mock-fixture.ts` — `MOCK_BAKERY_MAP_FIXTURE` (full `SimulationResponse`, both paths, all KPIs).
  - `src/lib/ui-state.ts` — `UiStage`, `UiRunStatus`, `UiShellState`, `initialUiShellState`, `RUN_MOCK_MS`, type guards.
  - `src/lib/ui-shell-context.tsx` — `UiShellContext`, `useUiShell`, `UiShellContextValue`.
  - `src/components/shell/PanelSlots.tsx` — `LeftPanelSlot`, `CenterPanelSlot`, `RightPanelSlot` (stable slot wrappers, each epic mounts inside these).
  - `src/components/shell/SimulationShell.tsx` — `SimulationShell` (`left`, `center`, `right` props + accessible labels).
  - `src/components/shell/ThinSliceDemo.tsx` — orchestrates all shells with `UiShellContext.Provider`.

### Slot Mounting Map (Authoritative)

| `uiStage`     | `leftPanel`                                      | `centerPanel`                                  | `rightPanel`                                      |
|---------------|--------------------------------------------------|------------------------------------------------|---------------------------------------------------|
| `running`     | VizView for Path A (Epic 3/4/5)                  | AgentHUD (Epic 5)                              | VizView mirror for Path B (Epic 3/4/5)            |
| `dashboard`   | Path A summary + ScoreRing (Epic 5)              | KPI stack + WinnerBadge + "Read Full Story" (Epic 5) | Path B summary + ScoreRing (Epic 5)          |
| `deepDive`    | Compressed Path A strip + mini viz (Epic 4)      | DeepDivePanel tabs + narrative (Epic 4)        | Compressed Path B strip + mini viz (Epic 4)       |
| `input`       | Not mounted (Epic 3 owns full-width form)         | Not mounted                                    | Not mounted                                       |

### Integration Contract Definitions

Each epic consumes the slot wrappers from `PanelSlots.tsx` and reads shell state from `useUiShell()`. The props they receive come from the simulation result assembled by the API contract (`SimulationResponse`).

**Contract C1 — Viz Slot (Epic 3: FlowView, Epic 4: MapView, Epic 5: NetworkView / FallbackViz)**
- Interface: `VizSlotProps` → `{ viz_type: VizType; pathData: PathData; pathLabel: string; }`
- Source of truth: `src/lib/integration-contracts.ts`
- Mock: `MOCK_VIZ_SLOT_PROPS_A` (derives from `MOCK_BAKERY_MAP_FIXTURE.paths.A`, `viz_type: "map"`, `pathLabel: "Invest in Instagram ads"`)
- Note: Each epic's viz component receives the same interface shape; `viz_type` lets it decide whether to render or hand off to FallbackViz.

**Contract C2 — AgentHUD Center Slot (Epic 5)**
- Interface: `AgentHudSlotProps` → `{ agentStates: AgentState[]; roles: string[]; viz_type: VizType; }`
- Source of truth: `src/lib/integration-contracts.ts` (types sourced from `src/lib/types.ts`)
- Mock: `MOCK_AGENT_HUD_PROPS` (all 4 states `"dormant"`, roles from `AGENT_ROLES["map"]`)
- Roles are always 4 entries from `AGENT_ROLES[viz_type]` in `types.ts`.

**Contract C3 — KPI Stack Center Slot (Epic 5)**
- Interface: `KpiStackSlotProps` → `{ kpisA: KPIs; kpisB: KPIs; comparison: SimulationResponse["comparison"]; pathLabels: { A: string; B: string }; }`
- Source of truth: `src/lib/integration-contracts.ts`
- Mock: `MOCK_KPI_STACK_PROPS` (from `MOCK_BAKERY_MAP_FIXTURE.paths.A.kpis`, `.paths.B.kpis`, `.comparison`, `.path_labels`)

**Contract C4 — ScoreRing Side Slot (Epic 5)**
- Interface: `ScoreRingSlotProps` → `{ score: number; pathLabel: string; }`
- Source of truth: `src/lib/integration-contracts.ts`
- Mock: `MOCK_SCORE_RING_PROPS_A` (`{ score: 67, pathLabel: "Invest in Instagram ads" }`)

**Contract C5 — DeepDivePanel Center Slot (Epic 4)**
- Interface: `DeepDivePanelSlotProps` → `{ pathA: PathData; pathB: PathData; pathLabels: { A: string; B: string }; }`
- Source of truth: `src/lib/integration-contracts.ts`
- Mock: `MOCK_DEEP_DIVE_PROPS` (from `MOCK_BAKERY_MAP_FIXTURE`)

**Contract C6 — SimulationResponse API Contract (Epic 2 → all UI epics)**
- Interface: `SimulationResponse` (already complete)
- Source of truth: `src/lib/types.ts`
- Mock fallback: `MOCK_BAKERY_MAP_FIXTURE` in `src/lib/mock-fixture.ts`
- Epic 2 must return a response that satisfies `SimulationResponse`; Epic 2 owns the implementation; Epics 3–5 consume it read-only.

### Shell Context Access Pattern

All epics access shell state via the existing context — no new state mechanism:
```ts
import { useUiShell } from "@/lib/ui-shell-context";
const { uiStage, runStatus } = useUiShell();
```
This is already provided by `ThinSliceDemo`'s `UiShellContext.Provider`. Epics must NOT create duplicate state keys for `uiStage` or `runStatus`.

### File Structure Guidance

New files for this story only:
- `src/lib/integration-contracts.ts` (new) — typed interfaces + mock constants
- `src/lib/integration-contracts.test.ts` (new) — type-safety + structural assertions
- `docs/integration-contracts.md` (new) — living contract reference for parallel teams

Unchanged files (do not modify):
- `src/lib/types.ts`, `src/lib/ui-state.ts`, `src/lib/ui-shell-context.tsx`
- `src/components/shell/PanelSlots.tsx`, `SimulationShell.tsx`, `ThinSliceDemo.tsx`
- Any test file from Stories 1.1–1.3

Check if `docs/` directory exists before creating the markdown file — use `ls` or equivalent.

### Environment Variable Note

The `.env.example` file uses `OPENAI_API_KEY` / `AGENT_MODEL_*` naming while the architecture doc uses `LLM_API_KEY` / `LLM_MODEL_*`. This discrepancy is pre-existing; do not change `.env.example` in this story. Epic 2 (Story 2.1) will resolve env naming as part of that story's scope.

### Testing Requirements

- All tests in `integration-contracts.test.ts` are compile-time and value-level checks — no rendering, no DOM.
- Tests must run with `npm run test` (Vitest) alongside existing test suite.
- Keep tests focused: contract shape, mock constants structural correctness, count guards.
- No snapshot tests; no rendering tests; no mocking of module imports.

### Previous Story Intelligence (Story 1.3)

- `UiShellContext` + `useUiShell` hook introduced in `src/lib/ui-shell-context.tsx` — all epics should use this, not re-implement.
- `PanelSlots.tsx` exports `LeftPanelSlot`, `CenterPanelSlot`, `RightPanelSlot` with `data-slot` and `data-testid` attributes — Epic 3/4/5 must mount inside these, not create new wrappers that duplicate the grid layout.
- Deferred from 1.3 review: duplicate `data-testid` across stages (tests use `getAllByTestId` already) — continue this pattern in any new test additions.
- `ui-state.ts` intentionally omits a reducer; if a story in Epics 3–5 needs a reducer, they own it locally and dispatch through `setUiStage`/`setRunStatus` from context.
- `page.tsx` re-exports `useUiShell` from `@/lib/ui-state` — consumers should import from `@/lib/ui-shell-context` directly to avoid the route re-export coupling (deferred concern from 1.3 review).

### Git Intelligence Summary

- Recent commits stay tightly scoped to story scope — follow the same discipline here.
- Implementation artifacts (`_bmad-output/implementation-artifacts/*.md` + `sprint-status.yaml`) updated alongside code in the same commit — do the same for this story.
- No backend code introduced yet; `app/api/` directory does not exist — this story must not create it (that belongs to Story 2.1).

### Latest Technical Information

- Next `16.2.1` + React `19.2.4` — all imports use `"use client"` directive where hooks are involved; `integration-contracts.ts` is a pure TypeScript module (no `"use client"` needed — no hooks, no JSX).
- Vitest is the test runner; import from `"vitest"` explicitly (`describe`, `it`, `expect`).
- TypeScript strict mode is in use; avoid `as any` casts in the contract module or tests.
- Check `node_modules/next/dist/docs/` for any Next.js-specific module resolution notes before writing imports.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1 Story 1.4; Cross-Epic Dependency Contract table; Epic 2–5 file ownership lists]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 3 (Component Architecture), Section 5 (Data Flow Rules), Section 6 (State Shape)]
- [Source: `src/lib/types.ts` — canonical API types]
- [Source: `src/lib/ui-state.ts` — UI state machine types]
- [Source: `src/lib/ui-shell-context.tsx` — context hook]
- [Source: `src/lib/mock-fixture.ts` — mock response fixture for all contract mocks]
- [Source: `src/components/shell/PanelSlots.tsx` — stable slot wrappers]
- [Source: `src/components/shell/SimulationShell.tsx` — three-panel layout]
- [Source: `_bmad-output/implementation-artifacts/1-3-application-state-machine-slot-ownership.md` — slot ownership map, deferred items]

## Dev Agent Record

### Agent Model Used

Codex create-story workflow; dev-story implementation (Cursor agent).

### Debug Log References

None.

### Completion Notes List

- Story 1.4 context generated. Integration contract interfaces and mock stubs scoped to `src/lib/integration-contracts.ts`; living doc to `docs/integration-contracts.md`; compatibility tests to `src/lib/integration-contracts.test.ts`.
- No changes to `types.ts`, `ui-state.ts`, `ui-shell-context.tsx`, or shell components; `mock-fixture.ts` only gains the `MOCK_BAKERY_MAP_FIXTURE` alias (same object as `MOCK_SIMULATION_RESPONSE`).
- Ultimate context engine analysis completed — comprehensive developer guide created.
- Implemented typed slot interfaces (`VizSlotProps`, `AgentHudSlotProps`, `KpiStackSlotProps`, `ScoreRingSlotProps`, `DeepDivePanelSlotProps`) and mock stubs from `MOCK_BAKERY_MAP_FIXTURE`; AgentHUD mock uses four `dormant` states and `AGENT_ROLES.map` per contract notes.
- Added `MOCK_BAKERY_MAP_FIXTURE` as an alias in `mock-fixture.ts` (same object as `MOCK_SIMULATION_RESPONSE`) so docs and imports match cross-epic naming.
- Vitest compatibility tests: type assignments, `VizType` guard, `overallWinner` A/B, agent count 4. `npm run lint`, `npm run test`, `npm run build` all pass.

### File List

- `src/lib/integration-contracts.ts`
- `src/lib/integration-contracts.test.ts`
- `src/lib/mock-fixture.ts` (adds `MOCK_BAKERY_MAP_FIXTURE` alias only)
- `docs/integration-contracts.md`
- `_bmad-output/implementation-artifacts/1-4-parallel-integration-contract-ownership-boundaries.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-03-24:** Story 1.4 created and marked ready-for-dev.
- **2026-03-25:** Story 1.4 implemented — integration contracts module, docs, tests, fixture alias; status → review.

---

**Story completion status**

- Status: **done**
