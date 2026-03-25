# Story 6.1: End-to-End Client ↔ API Integration & Progress Updates

Status: review

## Story

As a small business owner,
I want the real backend to drive my run from submit through dashboard,
so that the product is not mock-only.

## Acceptance Criteria

_trace: FR10, FR28 (partial), NFR-P1, NFR-P3; architecture ADR-02 (single orchestrator endpoint); integration-contracts C6_

1. **Given** Epic 2 route is deployed and env keys set **when** the user submits the form **then** client calls `POST /api/simulate` with the same envelope as `SimulationRequest` — this is **already wired** in `ThinSliceDemo.onValidSubmit`; verify end-to-end smoke test passes with a live key.

2. **And** agent completion updates HUD **deterministically via predictive synthetic timing** during the live run — not SSE/polling (architecture choice: fire-and-wait API, no streaming endpoint). The HUD timer animation (agent dormant→thinking→insight→complete) **must run concurrently** with the real API call, not be suppressed by it. The `isApiCallRef.current` guard **must be removed** from the HUD timer `useEffect` (currently in `ThinSliceDemo.tsx` L160–202); only the dashboard-transition `setTimeout` at `RUN_MOCK_MS` should be conditional on `!isApiCallRef.current`.

3. **And** when the API responds successfully, `viz_type` from the response sets `vizType` state (already done via `isVizType(json.viz_type)` check) so `VizRouter`, `AgentHUD` roles, and all side panels reflect the real classification — no manual override needed.

4. **And** `progress.agent_states` in the **server response** is populated from real agent completion data, not leaked from `MOCK_SIMULATION_RESPONSE`. Fix `route.ts` to assemble `progress` from actual agent results (all slots will be `"complete"` since the API is fire-and-wait; this is correct — the field should no longer be `MOCK_SIMULATION_RESPONSE.progress`).

5. **And** hero simulation perceived pacing: HUD animation completes within `RUN_MOCK_MS` (~3.5s client-side) while real API may take up to 12s. After HUD animation completes, agents remain in "complete" state and the UI stays in `running` stage until the API returns or times out — no visual regression (NFR-P1, NFR-P3).

6. **And** when the API call fails (network error, non-OK response, timeout) **after** the running animation has started, `runStatus` must transition to `"error"` and the existing `error-shell` banner is shown; the UI must still land on the `dashboard` stage showing fixture-based results (current behavior via `setUiStage("dashboard")` + `setRunStatus("error")`). Verify this path works.

7. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [x] **Fix HUD animation during real runs** (AC: 2, 5)
  - [x] In `ThinSliceDemo.tsx`, split the running `useEffect` so that agent-state timer callbacks run unconditionally (remove `if (isApiCallRef.current) return`), but the `window.setTimeout(() => { setUiStage("dashboard"); … }, RUN_MOCK_MS)` only executes when `!isApiCallRef.current`.
  - [x] Verify: in dev preview, submitting the real form shows HUD agents animating through their states while the API runs in the background.

- [x] **Fix `progress` field in API response** (AC: 4)
  - [x] In `app/api/simulate/route.ts`, replace `...MOCK_SIMULATION_RESPONSE.progress` (or direct mock spread that leaks `progress`) with a properly assembled `progress` block using real data: `{ agents_per_path: 4, agent_states: { A: agentRun.agentsByPath.A.map(() => "complete"), B: agentRun.agentsByPath.B.map(() => "complete") } }`.

- [x] **Document architecture choice** (AC: 2)
  - [x] Add a comment in `ThinSliceDemo.tsx` near the HUD useEffect and a note in `docs/integration-contracts.md` (or inline in this story's Dev Agent Record) stating: "Progress updates use predictive client-side timing. The API is fire-and-wait; `SimulationResponse.progress` reflects final completion state only."

- [x] **Smoke-test the live path** (AC: 1, 3, 6, 7)
  - [x] With `LLM_API_KEY` set, submit the form and verify: (a) HUD animates, (b) API returns, (c) real `viz_type` routes visualization, (d) real KPIs populate dashboard, (e) `comparison` and `meta` blocks are non-null and display correctly.
  - [x] Verify error path: temporarily remove key → confirm `error-shell` appears and dashboard shows fixture results.
  - [x] `npm run test && npm run lint && npm run build`

## Dev Notes

### The Critical Bug (Must Fix First)

**`isApiCallRef.current` blocks HUD animation during real API calls.**

In `src/components/shell/ThinSliceDemo.tsx`, the running `useEffect` (lines ~160–202):

```typescript
useEffect(() => {
  if (uiStage !== "running" || runStatus !== "inProgress") return;
  if (isApiCallRef.current) return;  // ← THIS MUST CHANGE
  ...
```

This guard was added to prevent the mock dashboard transition from firing during real runs. But it also blocks all agent-state timer updates, leaving agents stuck at "dormant" for the entire API call duration.

**Fix:** Remove the early-return guard. Instead, make only the dashboard-transition timer conditional:

```typescript
useEffect(() => {
  if (uiStage !== "running" || runStatus !== "inProgress") return;
  // DO NOT guard on isApiCallRef here — HUD animation always runs

  setAgentStatesByPath({ A: [...dormantRow], B: [...dormantRow] });
  const ids: number[] = [];
  const setSlot = (path: "A" | "B", index: number, state: AgentState) => {
    setAgentStatesByPath((prev) => {
      const nextA = [...prev.A];
      const nextB = [...prev.B];
      if (path === "A") nextA[index] = state;
      else nextB[index] = state;
      return { A: nextA, B: nextB };
    });
  };

  // ... all existing agent timer setups unchanged ...

  // Only transition to mock dashboard if NOT doing a real API call
  if (!isApiCallRef.current) {
    ids.push(
      window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setPathLabels(derivePathLabels(form.decision));
        setUiStage("dashboard");
        setRunStatus("completed");
      }, RUN_MOCK_MS),
    );
  }

  return () => ids.forEach((id) => window.clearTimeout(id));
}, [uiStage, runStatus, form.decision, dormantRow]);
```

Note: `isApiCallRef.current` is used inside the setTimeout callback capture scope, so it correctly reflects the value at timer-fire time. But since we want to check it at setup time (to decide whether to register the mock dashboard timer), the check `if (!isApiCallRef.current)` at registration time is correct.

### API Response `progress` Field Fix

In `src/app/api/simulate/route.ts`, the current `responseBody` spread includes `...MOCK_SIMULATION_RESPONSE` at the top level, which leaks `progress` from the mock. Replace with:

```typescript
const responseBody: SimulationResponse = {
  // Remove: ...MOCK_SIMULATION_RESPONSE spread OR ensure progress is overridden
  runId: `run_${Date.now()}`,
  status: "completed",
  viz_type,
  path_labels,
  progress: {
    agents_per_path: 4,
    agent_states: {
      A: agentRun.agentsByPath.A.map((): AgentState => "complete"),
      B: agentRun.agentsByPath.B.map((): AgentState => "complete"),
    },
  },
  paths: {
    A: { agents: agentRun.agentsByPath.A, synthesis: pathA.synthesis, kpis: pathA.kpis },
    B: { agents: agentRun.agentsByPath.B, synthesis: pathB.synthesis, kpis: pathB.kpis },
  },
  comparison,
  meta: {
    latencyMs,
    llmCalls,
    estimatedCostEur,
    fallbackUsed: false,
    cachedReplay: false,
    generatedAt,
    schemaVersion: "1.0",
  },
};
```

Import `AgentState` from `@/lib/types` if not already imported at top of route.ts.

### What Is Already Working (Do NOT Reinvent)

- Real API call is already wired in `onValidSubmit` (lines ~204–268 of `ThinSliceDemo.tsx`)
- `viz_type` from API response already updates `vizType` state via `isVizType(json.viz_type)` check
- `agentResults`, `synthesisResults`, `kpiResults`, `comparison`, `meta` all set from real API response
- Error → `dashboard` with fixture data already handled via `finalStatus = "error"`
- `runStatus === "error"` already shows `error-shell` banner above main content
- `VizRouter` already routes `viz_type` to correct viz component
- `AgentHUD` already reads `AGENT_ROLES[vizType]` for labels
- `KpiStack` already uses real `kpiResults` when available (falls back to `MOCK_KPI_STACK_PROPS`)
- `MapHalf` already renders when `vizType === "map"`

### State Flow During Real Run

```
submit → runStatus: submitting
       → uiStage: running, runStatus: inProgress, isApiCallRef: true
       → HUD timers fire (agents animate: dormant→thinking→insight→complete over ~3.5s)
       → isApiCallRef.current keeps mock dashboard timer suppressed
       → API returns (5–12s)
       → setVizType, setAgentResults, setSynthesisResults, etc.
       → setUiStage("dashboard"), setRunStatus("completed" | "error")
       → isApiCallRef.current = false
```

### UX Behavior During Real Run

After HUD animation completes (~3.5s into a real run), agents show "complete" with checkmarks, and the `running` panel waits silently for the API. This is correct — the user sees the simulation completed and waits for the intelligence assembly. The `VizOrientationBand` and viz panels remain visible. No additional loading indicator is required by the AC, but if the API takes >12s, the experience degrades — acceptable for MVP.

### Architecture Choice: Predictive Timing

Document in `docs/integration-contracts.md` (C6 row or a new note):
> **Progress update strategy (Story 6.1):** Client uses predictive synthetic timing for AgentHUD animation during live runs. The `POST /api/simulate` endpoint is fire-and-wait (no SSE or polling endpoint). `SimulationResponse.progress.agent_states` reflects final completion state after the run. Client-side HUD timing approximates the parallel 8-agent execution timeline defined in `lib/ui-state.ts:RUN_MOCK_MS`.

### Files to Touch

- `src/components/shell/ThinSliceDemo.tsx` — remove `isApiCallRef` guard from HUD timer effect, make mock dashboard timer conditional
- `src/app/api/simulate/route.ts` — fix `progress` field assembly
- `docs/integration-contracts.md` — document progress update architecture choice

### Files NOT to Touch (Unless Bug Found)

- `src/lib/types.ts` — `SimulationResponse.progress` type is already correct
- `src/lib/ui-state.ts` — `RUN_MOCK_MS` and all state types are correct as-is
- `src/lib/integration-contracts.ts` — no new contract types needed for this story
- Any viz components — they already consume `viz_type` and `pathData` correctly
- `src/app/api/simulate/route.ts` error handling — error class hierarchy is correct

### Testing Notes

- Follow existing patterns in `ThinSliceDemo.test.tsx` — use `MotionConfig reducedMotion="always"` wrapper, `userEvent.setup()` for button clicks, `fireEvent.change` for textarea
- The `useEffect` timing change is primarily a behavioral fix; regression test: dev preview "run" via the dev stage select still works (uiStage=running still triggers HUD animation, mock timer fires dashboard transition when `isApiCallRef.current` is false)
- Route tests in `app/api/simulate/route.test.ts`: add an assertion that `progress.agent_states.A` and `.B` are arrays of `"complete"` strings (not from mock fixture) after a successful run

### Tech Stack Note

Next.js **16.x**, React **19**, Tailwind **v4**, Framer Motion **12.x** — confirm against `package.json`. `AGENTS.md` has breaking-change guidance; check `node_modules/next/dist/docs/` before touching route handlers.

### Project Structure Notes

- `src/components/shell/ThinSliceDemo.tsx` is the top-level shell; **do not** extract the HUD timer logic into a separate hook unless it's a clear win — keep changes minimal
- `src/app/api/simulate/route.ts` is the single orchestrator endpoint per ADR-02 — do not introduce new endpoints
- `docs/integration-contracts.md` is the canonical contract reference — update the C6 row

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — §5 Orchestration and Data Flow, §6 State Management, §7 Error Handling]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — `onValidSubmit`, `isApiCallRef`, HUD timer useEffect]
- [Source: `src/app/api/simulate/route.ts` — `responseBody` assembly, `MOCK_SIMULATION_RESPONSE` spread]
- [Source: `src/lib/ui-state.ts` — `RUN_MOCK_MS`, `isApiCallRef` semantics]
- [Source: `src/lib/types.ts` — `SimulationResponse.progress.agent_states` type]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` — 2-4 deferred: `progress` field from mock]
- [Source: `docs/integration-contracts.md` — C6 API / SimulationResponse contract]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex-low

### Debug Log References

- Added regression test in `src/components/shell/ThinSliceDemo.test.tsx` to assert live-run pacing behavior: UI remains in `running` after `RUN_MOCK_MS` while HUD nodes reach `complete`.
- Added API route assertion in `src/app/api/simulate/route.test.ts` proving `progress.agent_states` is derived from live `agentRun` counts, not inherited from mock fixture spread.
- Updated `src/components/shell/ThinSliceDemo.tsx` running effect to keep HUD predictive timing active during live API calls and gate only the mock dashboard timeout.
- Updated `src/app/api/simulate/route.ts` to construct `progress` from `agentRun.agentsByPath` with final `"complete"` states.
- Updated `docs/integration-contracts.md` C6 notes to document fire-and-wait plus predictive client timing architecture.
- Full validation executed successfully: `npm run test`, `npm run lint`, `npm run build`.

### Completion Notes List

- Fixed the core UX bug where `isApiCallRef.current` blocked all HUD animation during real runs; agent-state timers now always run in `running/inProgress`.
- Preserved prior mock behavior by keeping `RUN_MOCK_MS` dashboard auto-transition only for non-live (`!isApiCallRef.current`) flows.
- Corrected API contract behavior by populating `SimulationResponse.progress.agent_states` from actual parallel agent results.
- Added/updated tests to validate both pacing behavior and `progress` assembly semantics.
- Documented the architecture decision: predictive client timing for progress display + fire-and-wait API response for final state.

### File List

- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `src/app/api/simulate/route.ts`
- `src/app/api/simulate/route.test.ts`
- `docs/integration-contracts.md`
- `_bmad-output/implementation-artifacts/6-1-end-to-end-client-api-integration-progress-updates.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-03-26: Implemented Story 6.1 fixes for HUD live-run pacing and API `progress` contract, added regression tests, updated integration contract documentation, and passed full validation suite (`test`, `lint`, `build`).
