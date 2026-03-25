# Story 5.1: Agent HUD & Agent Nodes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
while the simulation runs, I want to see **both Path A and Path B** agents wake in parallel with short insights,
so that I can watch both analyses unfold before the full dashboard appears.

## Acceptance Criteria

_trace: FR10, FR11, UX-DR7, UX-DR20, UX-DR24; C2 AgentHUD in `docs/integration-contracts.md`_

> **Scope note (code review 2026-03-25):** KPI winner summary (original ACs 6–7) removed from this story. Winner comparison belongs to Story 5.2 and the dashboard stage only. This story delivers dual-path agent animations only.

1. **Given** `uiStage` is `running` and progress props cover **both paths** (mock timers or real updates) **when** agent slots update **then** `AgentHUD` shows **two labeled bands** (Path A and Path B), each with **four** agent nodes whose states progress: dormant → thinking (pulse) → insight text → complete checkmark — aligned with `progress.agent_states.A` and `progress.agent_states.B` on `SimulationResponse`.
2. **And** within each path, slot **positions** 1–4 use the fixed accent colors (blue, red, green, gold) and the **same** role label set from `AGENT_ROLES[viz_type]` for both paths (labels are per-slot index).
3. **And** path titles use `path_labels.A` / `path_labels.B` (truncate visually if needed; keep full strings in accessible names).
4. **And** an ARIA live region (`aria-live="polite"`) announces meaningful status changes on **both** paths (path + role + state); debounce to avoid screen-reader spam.
5. **And** UI components for this feature live under `src/components/agents/` (`AgentHUD.tsx`, `AgentNode.tsx`).
6. **And** **after** both paths’ agents reach `complete` (or the mock reaches the same point), the HUD shows a **compact KPI winner summary**: for each key **present** in `comparison.winnerByKpi`, show which path wins (human-readable names aligned with Story 5.2: revenue impact, risk, customer impact, operating costs, competitive exposure, “what you’d miss” / `opportunityCost`). Omit or show “—” for keys absent from `winnerByKpi`. Show `overallWinner` using `path_labels` (e.g. overall lean).
7. ~~**KPI lightweight preview** — moved to Story 5.2.~~
8. **And** **`AgentHudSlotProps` is extended** (C2 breaking change acceptable — Epic 5 owns it) to include: `viz_type`, `roles`, `pathLabels: { A: string; B: string }`, `agentStatesByPath: { A: AgentState[]; B: AgentState[] }` (each length 4), and optionally `insightsByPath?: { A: (string | undefined)[]; B: (string | undefined)[] }`. Update `MOCK_AGENT_HUD_PROPS`, `docs/integration-contracts.md` (C2), and `src/lib/integration-contracts.test.ts` in the same change set.

## Tasks / Subtasks

- [x] **Extend C2 contract (AC 8)**  
  - [x] Replace flat `agentStates` with `agentStatesByPath` + `pathLabels` on `AgentHudSlotProps`; add optional `insightsByPath` if used. Refresh `MOCK_AGENT_HUD_PROPS` from `MOCK_BAKERY_MAP_FIXTURE` (path labels + initial dormant arrays). Update `docs/integration-contracts.md` and `integration-contracts.test.ts`.

- [x] **Implement `AgentHUD` + agent nodes (AC 1–7)**
  - [x] Create `src/components/agents/AgentHUD.tsx` satisfying the updated `AgentHudSlotProps`.
  - [x] Two sub-rows (or stacked sections): **Path A** and **Path B**, each rendering four `AgentNode` components with shared role/color rules per UX-DR7.
  - [x] States: `dormant` | `thinking` | `insight` | `complete` | `error` — icon + text, not color-only.
  - [x] **Thinking:** pulse / glow per UX-DR24; **insight:** 2–5 word microcopy (props or fixture-derived later).
  - [x] ~~KPI winner block (ACs 6–7 removed).~~

- [x] **Wire into running shell (AC 1–8)**
  - [x] Replace the running-stage center placeholder in `ThinSliceDemo.tsx` with `<AgentHUD ... />`.
  - [x] Mock **two** staggered sequences (A and B can progress at different rates) so dual-path behavior is visible; transition to `dashboard` via `RUN_MOCK_MS` after agents complete.
  - [x] Pass `path_labels` and `viz_type` from `MOCK_BAKERY_MAP_FIXTURE`.

- [x] **Accessibility (AC 4)**
  - [x] Live region: polite, debounced; include path id in announcements.

- [x] **Tests**
  - [x] Keep `npm run test` green; component tests for dual rows, insight text rendering, absence of KPI preview. Run `npm run lint` and `npm run build`.

## Dev Notes

### Contracts (non-negotiable)

- **C2 — Agent HUD:** `AgentHudSlotProps` must reflect **dual-path** progress + **comparison** for the closing summary; mock `MOCK_AGENT_HUD_PROPS` aligned with `MOCK_BAKERY_MAP_FIXTURE`. [Source: `docs/integration-contracts.md` § C2]
- **Types:** `AgentState`, `VizType`, `AGENT_ROLES`, `SimulationResponse["comparison"]` in `src/lib/types.ts`. Roles: parent passes `[...AGENT_ROLES[viz_type]]` once; both path bands reuse the four labels by index. [Source: `src/lib/types.ts`]
- **Center slot:** While `uiStage === "running"`, center column is AgentHUD per slot mounting guide. [Source: `docs/integration-contracts.md` § Slot mounting guide]
- **Layout wrapper:** `SimulationShell` + `CenterPanelSlot` already provide `role="region"` and `aria-label`; nest AgentHUD content so you do not double-wrap regions unnecessarily.

### UX & motion

- **AgentHUD spec:** Purpose, anatomy, states, accessibility (polite live region, icon + text). **Product refinement:** center column now explicitly **dual-path** + **short KPI winner snapshot** before dashboard; keep density tolerable on laptop (may need `variant: "standard" | "compact"` sooner than classic single-strip HUD). [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § AgentHUD]
- **UX-DR7:** Fixed per-slot colors and `AGENT_ROLES` apply **within each path row** (two rows × four nodes). [Source: `_bmad-output/planning-artifacts/epics.md` UX-DR7 summary]
- **UX-DR24:** Agent activation scale/opacity/springs; pulse/glow; respect reduced motion. [Source: `_bmad-output/planning-artifacts/epics.md` UX-DR24 summary]

### Product requirements

- **FR10 / FR11:** Observable progress for **both** paths; role/slot clarity during run.
- **FR18–FR24:** KPI comparison semantics — the end-of-HUD summary must reflect `comparison.winnerByKpi` / `overallWinner` truthfully (full card animations remain Story 5.2). [Source: `_bmad-output/planning-artifacts/prd.md`, `_bmad-output/planning-artifacts/epics.md` Story 5.2]

### Architecture

- Canonical API shape: `progress.agent_states.A` and `.B` (length `agents_per_path`, typically 4); `comparison.winnerByKpi` and `overallWinner` on `SimulationResponse`. Thin-slice mock should exercise **both** arrays and fixture comparison — no single-path shortcut. [Source: `_bmad-output/planning-artifacts/architecture.md` response contract]

### Coordination with Story 5.2

- **5.1** delivers a **short** KPI winner recap at the end of **running**. **5.2** owns the full **dashboard** KPI stack (six cards, bars, count-up). Avoid duplicating `KPICard` / `ComparisonBar` here; keep 5.1 summary structurally simpler.

### Reuse / avoid reinventing

- Use **Framer Motion** already in stack (`ThinSliceDemo` uses `motion` + spring config — align constants with UX-DR24 where reasonable).
- Do **not** duplicate `AGENT_ROLES` literals in components.

### Project Structure Notes

- **New:** `src/components/agents/*`
- **Touch:** `src/components/shell/ThinSliceDemo.tsx` (running branch), possibly `src/lib/integration-contracts.ts` / tests / docs if props extend.
- **Do not** move or rename `PanelSlots.tsx` / `SimulationShell.tsx` unless necessary; Epic 1 stories stabilized those boundaries.

### Testing

- Vitest + Testing Library patterns used elsewhere (`src/lib/*.test.ts`). Prefer testing state labels, live region attribute, and reduced-motion class behavior if implemented.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.1]
- [Source: `docs/integration-contracts.md` — C2, slot mounting]
- [Source: `src/lib/integration-contracts.ts` — `AgentHudSlotProps`]
- [Source: `src/lib/types.ts` — `AgentState`, `AGENT_ROLES`, `SimulationResponse["comparison"]`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — AgentHUD]
- [Source: `_bmad-output/planning-artifacts/_extracted-foresight-master-spec.md` — component file hints: `AgentHUD.tsx`, `AgentNode.tsx`, `InsightBubble.tsx`]

### Previous story intelligence (cross-epic)

- Story 1.4 defined **C2 `AgentHudSlotProps`** as intentionally unwired until Epic 5; this story **replaces** the flat `agentStates` shape with **dual-path** inputs + **`comparison`** for the KPI teaser. Update contract tests and doc in lockstep. [Source: `_bmad-output/implementation-artifacts/1-4-parallel-integration-contract-ownership-boundaries.md`]

### Git intelligence (recent patterns)

- Recent work: integration contracts, `ThinSliceDemo` state machine, Vitest tests — follow existing import aliases (`@/lib/...`), file layout under `src/`, and shell composition patterns established in Story 1.3.

### Latest stack note

- **Next.js `16.2.1`**, React 19, Tailwind v4, Framer Motion 12.x — follow repo `package.json` versions over older “Next 14” mentions in planning PDFs.

## Dev Agent Record

### Agent Model Used

Cursor (GPT-5.1 agent)

### Debug Log References

### Completion Notes List

- Extended **C2** `AgentHudSlotProps` for dual-path `agentStatesByPath`, `pathLabels`, `comparison`, optional `phase` / `insightsByPath`; `MOCK_AGENT_HUD_PROPS` and docs/tests updated.
- Added **`AgentHUD`** (dual path rows, debounced `aria-live` summary, compact KPI winner list + overall lean) and **`AgentNode`** (slot colors, states with icon + text, thinking pulse with reduced-motion respect).
- **`ThinSliceDemo`** running center wired to AgentHUD with staggered A/B timers and `RUN_MOCK_MS` = 4.8s so agents finish then ~2s KPI snapshot before dashboard; `comparison` and `viz_type` from `MOCK_BAKERY_MAP_FIXTURE`; path titles match user-derived labels for consistency with side columns.
- **`npm run test`**, **`npm run lint`**, **`npm run build`** all passing.

### File List

- `src/lib/integration-contracts.ts`
- `src/lib/integration-contracts.test.ts`
- `src/lib/ui-state.ts`
- `docs/integration-contracts.md`
- `src/components/agents/AgentHUD.tsx`
- `src/components/agents/AgentNode.tsx`
- `src/components/agents/kpi-winner-labels.ts`
- `src/components/agents/AgentHUD.test.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-1-agent-hud-agent-nodes.md`

### Review Findings

**Course correction applied during review (2026-03-25):** KPI winner summary was out of scope for this story. All comparison/phase/winner logic removed. See completion notes below.

- [x] [Review][Decision] KPI summary feature removed — `comparison`, `phase`, KPI winner block, `kpi-winner-labels.ts` all removed; scope narrowed to dual-path agent animation only. `RUN_MOCK_MS` reduced to 3500 ms; role fallback unified to `"Agent N"`.
- [x] [Review][Patch] `RUN_MOCK_MS` comment corrected — now reads "last agent completes at ~2660 ms; ~840 ms settled view before dashboard" [`src/lib/ui-state.ts`]
- [x] [Review][Patch] Inconsistent role fallback unified — both live region and `AgentNode` now use `"Agent N"` [`src/components/agents/AgentHUD.tsx`]
- [x] [Review][Defer] `viz_type` accepted by `AgentHudSlotProps` but intentionally discarded inside `AgentHUD` — deferred, pre-existing design decision; Epic 5 network views may differentiate later [`src/components/agents/AgentHUD.tsx`]
- [x] [Review][Defer] No CSS glow/shadow on thinking-state animation (UX-DR24 mentions pulse/glow) — deferred, UX refinement; pulse is implemented, glow is a visual polish item [`src/components/agents/AgentNode.tsx`]
- [x] [Review][Defer] `aria-live="polite"` + `aria-atomic="false"` with long concatenated announcement may be verbose for AT users — deferred, acceptable at MVP scale [`src/components/agents/AgentHUD.tsx`]
- [x] [Review][Defer] 24 `setTimeout` + functional `setAgentStatesByPath` updates during mock run — deferred, performance acceptable at this scale [`src/components/shell/ThinSliceDemo.tsx`]
- [x] [Review][Defer] `AgentNode` default branches return raw state string / null icon for unknown `AgentState` — deferred, TypeScript union prevents unknown states in practice [`src/components/agents/AgentNode.tsx`]

### Change Log

- 2026-03-24: Story 5.1 — Agent HUD dual-path nodes, C2 contract extension, running shell mock + tests (Phillip / dev-story).
- 2026-03-25: Code review — KPI winner scope removed; `comparison`/`phase` stripped from contract; `kpi-winner-labels.ts` deleted; `RUN_MOCK_MS` reduced to 3500 ms; role fallback unified. 2 patches applied, 5 deferred, 7 dismissed. Story marked done.
