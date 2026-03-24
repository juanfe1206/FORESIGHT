# Story 1.3: Application State Machine & Slot Ownership

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the top-level page state machine and three-panel layout skeleton wired up,
so that all frontend devs can mount their components into the correct slots and states.

## Acceptance Criteria

_trace: FR13 (layout continuity); ADR-01 (App Router shell), ADR-04 (viz_type-driven routing in future stories), Additional Requirements (explicit state management), UX-DR14, UX-DR15 (state choreography foundation), UX-DR16, UX-DR18, UX-DR19_

1. **Given** the application is running **when** the state machine initializes **then** `src/app/page.tsx` (or a dedicated store module) exposes `uiStage`: `input | running | dashboard | deepDive`.
2. **And** `runStatus`: `idle | submitting | inProgress | completed | fallback | error`.
3. **And** initial state is `uiStage: "input"` and `runStatus: "idle"`.
4. **Given** `uiStage` is `running` **when** the simulation layout renders **then** a three-panel skeleton appears: Path A (left), center intelligence column, Path B (right), with mirrored side structure per Direction 6.
5. **And** named slot regions or wrapper components exist so Epic 3-5 owners can mount visualization, HUD, KPI, and narrative without repeated edits to each other's primary files.
6. **Given** developers need to preview a state during integration **when** they toggle `uiStage` via a temporary dev-only control or documented prop **then** the correct shell for that stage renders (input vs three-panel vs dashboard vs deep-dive expansion).

## Tasks / Subtasks

- [ ] **Introduce canonical UI state machine primitives (AC 1-3)**
  - [ ] Add `UiStage` and `UiRunStatus` unions in a shared, frontend-safe location (recommend `src/lib/ui-state.ts`).
  - [ ] Create a typed initial state object with `uiStage: "input"` and `runStatus: "idle"`.
  - [ ] Ensure naming exactly matches architecture and epics docs: `uiStage`, `runStatus`.
- [ ] **Refactor current thin-slice stage logic onto new state model (AC 1-4)**
  - [ ] Replace local `Stage = "input" | "running" | "dashboard"` usage in `src/components/shell/ThinSliceDemo.tsx` with the new canonical unions.
  - [ ] Preserve current thin-slice behavior (local-only transition, no API/network dependency).
  - [ ] Keep current path-label derivation behavior as-is until Epic 2 parser integration.
- [ ] **Establish slot ownership wrappers for parallel teams (AC 4-5)**
  - [ ] Define explicit shell regions for `leftPanel`, `centerPanel`, `rightPanel`.
  - [ ] Define stage-specific slots: running (viz + HUD), dashboard (KPI stack + per-path summaries), deep dive (expanded center + compressed side strips).
  - [ ] Add stable wrapper component boundaries (recommended: `SimulationShell`, `PanelSlots`, or similarly named wrappers) under `src/components/shell/`.
- [ ] **Add temporary dev-only stage preview controls (AC 6)**
  - [ ] Add a clearly marked dev-only control to switch `uiStage` values during integration.
  - [ ] Guard the control so it is non-production (e.g., `process.env.NODE_ENV !== "production"`).
  - [ ] Document usage in this story's completion notes for downstream teams.
- [ ] **Lock in quality and regression checks**
  - [ ] Update/create tests for stage rendering and slot presence in `src/components/shell/ThinSliceDemo.test.tsx` (or split tests if component extraction occurs).
  - [ ] Validate keyboard navigation still works for primary actions.
  - [ ] Run `npm run lint`, `npm run test`, and `npm run build`.

### Review Findings To Preempt

- [ ] Guard against state drift: avoid introducing alternate keys like `stage`/`status` once `uiStage`/`runStatus` are introduced.
- [ ] Prevent hidden coupling: keep slot contracts explicit so Epic 3/4/5 features can mount without direct edits to parent orchestration logic.
- [ ] Keep mock-first flow intact: Story 1.3 must not add backend dependency or block current local thin-slice loop.

## Dev Notes

### Current Brownfield Reality

- `src/app/page.tsx` currently renders only `<ThinSliceDemo />`; state machine logic lives in `src/components/shell/ThinSliceDemo.tsx`.
- Existing thin-slice states are `input | running | dashboard` only; `deepDive` and `runStatus` are not implemented yet.
- `ThinSliceDemo` already has the three-column running shell and dashboard shell; this story formalizes state ownership and slots for parallel dev work.
- Stack in repo is Next `16.2.1`, React `19.2.4`, TypeScript, Tailwind v4, Framer Motion `12.x` (do not downgrade to match planning doc wording).

### Required State Contract (Implementation Guardrail)

Use this shape as the source of truth for UI state in this story:

- `uiStage`: `"input" | "running" | "dashboard" | "deepDive"`
- `runStatus`: `"idle" | "submitting" | "inProgress" | "completed" | "fallback" | "error"`
- `initial`: `{ uiStage: "input", runStatus: "idle" }`

Transition intent for Story 1.3:

1. Submit valid form -> `runStatus: "submitting"` then `inProgress`, `uiStage: "running"`.
2. Mock run completion -> `runStatus: "completed"`, `uiStage: "dashboard"`.
3. Dev-only toggle can force any stage for integration previews.
4. `deepDive`, `fallback`, and `error` shells can be skeletal but must render deterministic stage wrappers.

### Slot Ownership Contract (Parallel Work Enablement)

Define stable slot boundaries now; later epics mount into them:

- `leftPanel` slot
  - Running: Viz (Flow/Map/Network/Fallback placeholder)
  - Dashboard: Path A summary + score region
  - Deep dive: compressed strip context
- `centerPanel` slot
  - Running: Agent HUD / progress context
  - Dashboard: KPI stack and winner cues
  - Deep dive: narrative/tab container
- `rightPanel` slot
  - Running: Viz mirror
  - Dashboard: Path B summary + score region
  - Deep dive: compressed strip context

Suggested ownership alignment (from epics):

- Epic 3: `app/page.tsx`, `components/input/`, `components/simulation/`, `components/viz/FlowView/`, `components/shared/GlowButton.tsx`
- Epic 4: `components/viz/MapView/`, `components/narrative/`, `components/shared/ModeBadge.tsx`
- Epic 5: `components/agents/`, `components/dashboard/`, `components/viz/NetworkView/`, `components/viz/FallbackViz.tsx`

### File Structure Guidance

Recommended minimal file plan:

- `src/lib/ui-state.ts` (new): union types + initial state + optional reducer/event types
- `src/components/shell/ThinSliceDemo.tsx` (update): consume canonical state and render stage shells via named slots
- `src/components/shell/ThinSliceDemo.test.tsx` (update): stage/slot tests
- `src/app/page.tsx` (optional light touch only if composition extraction is needed)

Avoid introducing large new component trees in this story; establish contracts, not full feature implementations.

### Testing Requirements

- Rendering tests per stage: input, running, dashboard, deepDive.
- Assert slot wrappers exist with stable test ids or semantic region labels.
- Assert initial state is `input` / `idle`.
- Assert submit path drives `submitting -> inProgress -> completed` progression (can use deterministic timers in tests).
- Assert dev-only stage preview control is absent in production mode path.

### Previous Story Intelligence (Story 1.2)

- Canonical API/domain types now live in `src/lib/types.ts`; do not re-declare `VizType`/API contracts in UI files.
- Mock fixture exists in `src/lib/mock-fixture.ts`; Story 1.3 may continue using current thin-slice mock path if migration risk is high, but should avoid duplicating shape definitions.
- Existing tests and build pipeline are green with Vitest; keep this story aligned to the same toolchain (`npm run test`, not Jest).

### Git Intelligence Summary (Recent Patterns)

- Recent commit trend favors incremental shell/state updates in `src/app/*` and `src/components/shell/*` while keeping implementation artifacts synchronized.
- Story artifact docs are updated alongside code (`_bmad-output/implementation-artifacts/*.md` + `sprint-status.yaml`) and should remain in sync.
- Keep changes focused by story scope to avoid ownership overlap across upcoming parallel epics.

### Latest Technical Information

- Local project currently runs on Next `16.2.1` and React `19.2.4`; implement with current runtime contracts and avoid assumptions tied to older Next 14 examples.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — section 3 (State/Flow Layer), section 6 (State Management), section 12 roadmap]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Direction 6 layout grammar, responsiveness, accessibility]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — current stage implementation baseline]
- [Source: `src/lib/types.ts` and `src/lib/mock-fixture.ts` — cross-story type/fixture contracts]

## Dev Agent Record

### Agent Model Used

Codex create-story workflow

### Debug Log References

None.

### Completion Notes List

- Story context generated for `1.3` with explicit state-machine contract and slot ownership boundaries.
- Acceptance criteria decomposed into implementation tasks with testable checkpoints.
- Guardrails added to prevent ownership collisions during Epic 3-5 parallel development.

### File List

- `_bmad-output/implementation-artifacts/1-3-application-state-machine-slot-ownership.md` (created)

## Change Log

- **2026-03-24:** Story 1.3 created and marked ready-for-dev.

---

**Story completion status**

- Status: **ready-for-dev**
- Note: Ultimate context engine analysis completed - comprehensive developer guide created.
