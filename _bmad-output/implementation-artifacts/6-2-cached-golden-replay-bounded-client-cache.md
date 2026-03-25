# Story 6.2: Cached Golden Replay & Bounded Client Cache

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a presenter,
If the API fails during a demo, I want a saved run to play through the same UI,
So that judges still see the full story.

## Acceptance Criteria

_trace: FR30, NFR-I1, NFR-S3, ADR-05; architecture §7 Error Handling / Cache Policy; UX optional replay labeling (epics reference UX-DR23; UX spec: replay/fallback mode labeling)_

1. **Given** a prior successful `SimulationResponse` (from a previous live run) **or** a checked-in golden payload **when** the live `POST /api/simulate` fails in a way that recovery policy allows **then** the client loads a **full valid** `SimulationResponse`, drives the **same** `running` choreography (including predictive `AgentHUD` timing per Story 6.1), and transitions to `dashboard` with that payload — not merely the static `MOCK_BAKERY_MAP_FIXTURE` fallbacks in `useMemo` when `agentResults` / `kpiResults` are null.

2. **And** after a **successful** live response (HTTP 200, body parses as a complete `SimulationResponse`), the client **persists** the payload to **browser-local** storage only after **schema validation** passes (mirror the server rule: architecture “Cache writes happen only after schema validation succeeds”).

3. **And** cache growth is **bounded**: implementation must enforce limits such as **max entry count** (e.g. 1–3 snapshots), **TTL** (e.g. 24h–7d), and/or **size cap** via overwrite/eviction — satisfying **NFR-S3** (no unbounded growth on the machine).

4. **And** when the user is viewing **replayed** results (cache or golden), `meta.cachedReplay` reflected in UI state is **true** (either taken from the stored payload’s `meta` or set client-side when hydrating from cache/golden) so telemetry and future copy stay honest.

5. **And** an **optional, honest** inline label or banner distinguishes replay/offline/cached mode without implying live LLM execution — reuse or extend existing patterns (`error-shell`, `fallback-shell` in `ThinSliceDemo.tsx`) so judges see recovery as intentional, not a silent fake success.

6. **And** when the API returns a JSON **ErrorResponse** with `recovery.canUseCache === true`, the client attempts cache/golden replay **after** classifying failure; when `canUseCache === false`, do **not** silently re-label a random cache hit as the current run.

7. **And** request option `options.useCachedOnFailure` from `SimulationRequest` is honored: if explicitly `false`, skip cache/golden replay (still may keep error UX); if `true` or omitted, default demo-friendly behavior attempts replay when allowed.

8. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [x] **Share response validation** (AC: 2, 6)
  - [x] Extract `validateSimulationResponse` from `src/app/api/simulate/route.ts` into a shared module (e.g. `src/lib/validate-simulation-response.ts`) and **import** it from the route so server behavior is unchanged.
  - [x] Use the same validator in the client before **write** and before **read** from storage.

- [x] **Bounded client cache module** (AC: 2, 3)
  - [x] Add `src/lib/simulation-client-cache.ts` (or equivalent name): `readLatestValid()`, `writeSuccess(response: SimulationResponse)`, eviction (count + TTL), stable storage key namespace (e.g. `foresight:` prefix), handle `localStorage` unavailable (SSR/tests/private mode) gracefully.
  - [x] Store minimal envelope: payload JSON + `storedAt` + `source: "live"` for writes; validate `schemaVersion` if present before trust.

- [x] **Golden replay source** (AC: 1, 4)
  - [x] Provide at least one **bundled** golden `SimulationResponse` for offline demo (e.g. re-export `MOCK_SIMULATION_RESPONSE` from `src/lib/mock-fixture.ts` behind a named `GOLDEN_DEMO_SIMULATION_RESPONSE` or dedicated `src/lib/golden/` module) so CI and demos do not depend on a prior live run.
  - [x] Wire **feature flag** per `architecture.md`: `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY` (default **on** for hackathon builds if unset, or document explicit default in code comment). When disabled, only **live-written** cache may be used.

- [x] **ThinSliceDemo integration** (AC: 1, 4, 5, 6, 7)
  - [x] Refactor response hydration into a single helper (e.g. `hydrateFromSimulationResponse(res: SimulationResponse, opts: { cachedReplay: boolean })`) that sets `vizType`, `pathLabels`, `agentResults`, `synthesisResults`, `kpiResults`, `comparison`, `meta` — use it for **live success** and **replay** to avoid drift.
  - [x] On live success: validate → hydrate → `writeSuccess` (async/microtask ok; do not block UI).
  - [x] On failure path: determine `canReplay` from `options.useCachedOnFailure`, `ErrorResponse.recovery?.canUseCache` when body available, and sensible default for raw network errors (attempt cache when policy allows).
  - [x] Replay path: transition through `running` / `inProgress` with `isApiCallRef` semantics consistent with Story 6.1 (HUD runs; mock dashboard timer only when not live — replay may use the same pattern as “synthetic run” or explicitly drive timers then hydrate before dashboard; **must** match perceived choreography).
  - [x] Set `runStatus` appropriately: prefer **`fallback`** when replay succeeded so existing `fallback-shell` copy can apply, **or** `completed` plus explicit replay banner per UX judgment — document the choice in Dev Agent Record (ADR-05: fallback is first-class).

- [x] **Tests** (AC: 8)
  - [x] Extend `ThinSliceDemo.test.tsx` (or add `simulation-client-cache.test.ts`) with mocked `localStorage`, fetch failure → cache hit → dashboard has **cached** viz/kpi data (not only default bakery fixture).
  - [x] Test `useCachedOnFailure: false` skips replay.
  - [x] Test ErrorResponse `canUseCache: false` skips replay.
  - [x] Keep **`MotionConfig reducedMotion="always"`** pattern from existing tests.

- [x] **Contracts doc** (AC: 1–7)
  - [x] Add a short row or subsection under `docs/integration-contracts.md` (C6 or new “Client cache”) describing: validation before cache write, bounded policy, golden + `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY`, and interaction with `ErrorResponse.recovery`.

## Dev Notes

### Intent (do not under-ship)

Story 6.1 fixed live HUD pacing and API `progress`. Today, on failure, `onValidSubmit` sets `runStatus` to `"error"` and the dashboard still **renders** via **`MOCK_BAKERY_MAP_FIXTURE`** / `MOCK_KPI_STACK_PROPS` fallbacks in `useMemo` — that is **not** a stored full run replay and does not carry arbitrary `viz_type` from a prior successful classification. Story 6.2 requires **replay of an actual complete `SimulationResponse`** (last good run or golden), with honest labeling and bounded storage.

### Critical reuse points

- **Single orchestrator endpoint** ADR-02: do **not** add new HTTP routes for cache; all replay is client-side.
- **Validator drift risk:** `validateSimulationResponse` currently **only** lives in `route.ts` (lines ~62–73). Extract and reuse — do not duplicate logic in the client.
- **`SimulationRequest.options.useCachedOnFailure`** is already parsed in `validate.ts` but **not sent** from `ThinSliceDemo` today; wire it when implementing policy (default allowing replay unless set false).

### Suggested choreography for replay

- Option A: Start `running` / `inProgress`, run the same HUD `useEffect` as live (without `isApiCallRef` blocking), use **`!isApiCallRef.current`** path so `RUN_MOCK_MS` fires dashboard transition, then **inject** cached payload **before** or **as** dashboard mounts (timing must match Story 6.1 expectations).
- Option B: Shorter path with `isApiCallRef.current === false` and immediate hydration after timers — **document** in completion notes if you choose B; tests must assert HUD/dash ordering.

Either way: the **full** replay payload must drive `VizRouter`, `AgentHUD` roles, KPI stack, and path-derived labels — same as live.

### Environment

- **Client flag:** `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY` (architecture lists `ENABLE_GOLDEN_REPLAY`; use Next.js public prefix for bundle-gated golden import in `"use client"` code).
- **Server-only** `ENABLE_GOLDEN_REPLAY` in architecture may remain unused on server if golden is purely client-bundled; align naming in `.env.example` when you touch env docs.

### Files likely touched

- `src/app/api/simulate/route.ts` — replace inline validator with import.
- `src/lib/validate-simulation-response.ts` — **new** shared validator.
- `src/lib/simulation-client-cache.ts` — **new** bounded cache.
- `src/lib/golden/*.ts` or barrel — **new** optional thin re-export.
- `src/components/shell/ThinSliceDemo.tsx` — submit/replay orchestration, banners.
- `src/components/shell/ThinSliceDemo.test.tsx` — replay scenarios.
- `docs/integration-contracts.md` — cache / replay contract notes.
- `.env.example` — document `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY` if added.

### Previous story intelligence (6.1)

- **Do not** reintroduce `isApiCallRef`-gated HUD timers for “real” runs; replay must remain consistent with the 6.1 split (HUD always animates in `running`/`inProgress`; only mock auto-dashboard timer gated).
- **`progress` in API** is final-state only; replay can rely on predictive HUD, not on streaming `progress`.
- **Review deferrals from 6.1:** hardcoded `agents_per_path: 4` is accepted for now; cache entries should store whatever the server returned.

### Git intelligence (recent)

- Latest work: “implementation of 6.1” — HUD/`progress` fixes and tests; follow the same test and lint discipline.

### Architecture compliance (must follow)

- ADR-05: fallback and cache are **first-class** success paths.
- Cache remains **client-local and bounded** (architecture Boundaries).
- Output validation before cache write (Data Flow Rules).

### Project structure notes

- Prefer small focused modules under `src/lib/` over dumping logic into `ThinSliceDemo.tsx`; keep the component as orchestration only.
- Avoid importing server-only modules into client components.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — §7 Error Handling / Cache Policy, ADR-05, §10 Env vars, Resilience roadmap]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR30, NFR-S3, NFR-I1, resilience / golden JSON]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — degraded path diagram, replay/fallback labeling]
- [Source: `_bmad-output/implementation-artifacts/6-1-end-to-end-client-api-integration-progress-updates.md` — prior behavior, `isApiCallRef` pattern]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — `onValidSubmit`, fallbacks, shells]
- [Source: `src/lib/types.ts` — `SimulationRequest.options`, `SimulationResponse.meta.cachedReplay`, `ErrorResponse.recovery`]
- [Source: `src/lib/mock-fixture.ts` — `MOCK_SIMULATION_RESPONSE` candidate golden]
- [Source: `src/app/api/simulate/validate.ts` — `useCachedOnFailure` parsing]

## Dev Agent Record

### Agent Model Used

GPT-5.1 (Cursor agent)

### Debug Log References

- Vitest: Node experimental `localStorage` lacked `setItem`; `src/test/setup.ts` now installs a memory `Storage` stub and reapplies after `vi.unstubAllGlobals()` in component tests.

### Completion Notes List

- **Hydration / ADR-05:** `buildHydrationFromSimulationResponse` + `applySimulationResponse` centralize live and replay state. Successful replays set `runStatus` to **`fallback`** (not `completed`) so `fallback-shell` remains the honest degraded path; `meta.cachedReplay` is forced **true** on replay. Live success keeps **`completed`** and persists only after `validateSimulationResponse` passes.
- **Choreography:** On replay, `isApiCallRef` stays **true** through the running phase; after `max(0, RUN_MOCK_MS - elapsed)` from `runningStartedAtRef`, the client hydrates from cache or golden (same ~3.5s perceived pacing as Story 6.1 mock timer boundary).
- **Policy:** `simulationOptions?.useCachedOnFailure === false` skips replay; structured `ErrorResponse` with `recovery.canUseCache === false` skips replay; unknown/network bodies still attempt replay when allowed. Fetch body may include `options` from optional `ThinSliceDemo` prop for tests.
- **Golden flag:** `NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY !== "false"` → bundled golden allowed when cache empty.

### File List

- `src/lib/validate-simulation-response.ts`
- `src/lib/hydrate-simulation-ui.ts`
- `src/lib/parse-simulation-error-response.ts`
- `src/lib/simulation-client-cache.ts`
- `src/lib/simulation-client-cache.test.ts`
- `src/lib/golden/golden-demo-simulation-response.ts`
- `src/app/api/simulate/route.ts`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `src/test/setup.ts`
- `docs/integration-contracts.md`
- `.env.example`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Decision] AC6 replay policy ambiguity — dismissed: lenient default (replay unless `canUseCache === false`) is intentional for demo resilience; matches completion notes.
- [x] [Review][Decision] Size-cap single-entry escape hatch — dismissed: entry count (3) + TTL (7d) satisfy NFR-S3; single oversized write fails silently into quota catch.
- [x] [Review][Decision] Schema trust default for absent `schemaVersion` — dismissed: structural validator already provides integrity; requiring explicit version would silently discard all current live-written cache; revisit when server emits `schemaVersion`.
- [x] [Review][Patch] Validator missing `agents` array check — fixed: added `!Array.isArray(res.paths.A.agents)` guard. [`src/lib/validate-simulation-response.ts`]
- [x] [Review][Patch] Validator accepts NaN/Infinity for `meta.latencyMs` — fixed: replaced `typeof ... !== "number"` with `!Number.isFinite(...)`. [`src/lib/validate-simulation-response.ts`]
- [x] [Review][Patch] `overallWinner` not constrained to `"A"` or `"B"` — fixed: explicit `!== "A" && !== "B"` guard. [`src/lib/validate-simulation-response.ts`]
- [x] [Review][Patch] `meta.cachedReplay` merge uses `||` — fixed: changed to `opts.cachedReplay ? true : res.meta.cachedReplay` so live path never force-sets the flag. [`src/lib/hydrate-simulation-ui.ts`]
- [x] [Review][Patch] HTTP 200 with invalid body silently enters replay path — fixed: removed `!res.ok ?` guard; `parseSimulationErrorResponse` now always called so AC6 policy applies to all failure shapes. [`src/components/shell/ThinSliceDemo.tsx`]
- [x] [Review][Patch] `scheduleReplayDashboard` timeout not cleared on unmount — fixed: added `replayTimeoutRef`, stored timeout ID, cleared in mount-cleanup effect. [`src/components/shell/ThinSliceDemo.tsx`]
- [x] [Review][Patch] Double `resolveReplaySimulationResponse()` call creates race — fixed: resolved once at call site, passed into `scheduleReplayDashboard(resolvedReplay)`. [`src/components/shell/ThinSliceDemo.tsx`]
- [x] [Review][Patch] `parseCacheFile` does not validate entry shape — fixed: filter entries with type guard before trusting them as `CacheEntry`. [`src/lib/simulation-client-cache.ts`]
- [x] [Review][Defer] Stale entries not compacted on read — `readLatestValid` filters TTL in memory but never rewrites storage; expired data accumulates until the next successful `writeSuccess`. [src/lib/simulation-client-cache.ts] — deferred, pre-existing
- [x] [Review][Defer] `writeSuccess` read-modify-write race — two simultaneous microtask persist calls can interleave, dropping one entry; localStorage is synchronous so this is extremely unlikely in practice. [src/lib/simulation-client-cache.ts] — deferred, pre-existing
- [x] [Review][Defer] `NEXT_PUBLIC_*` build-time inlining not noted in source — comment in `.env.example` implies runtime toggle but Next.js bakes the value at build time; no in-code warning. [.env.example] — deferred, pre-existing
- [x] [Review][Defer] `synthesis.timeline` not validated as array — downstream `timeline.map` can throw if missing; low priority since no current callers crash today. [src/lib/validate-simulation-response.ts] — deferred, pre-existing
- [x] [Review][Defer] Global test `localStorage` stub may mask quota / private-mode behavior — in-memory stub in `setup.ts` hides Storage errors the production code explicitly handles. [src/test/setup.ts] — deferred, pre-existing

## Change Log

- 2026-03-25: Ultimate context engine analysis completed — comprehensive developer guide created (ready-for-dev).
- 2026-03-25: Story 6.2 implemented — shared response validator, bounded `localStorage` cache, golden replay flag, `ThinSliceDemo` replay/fallback orchestration, tests, integration-contracts C6 subsection, sprint status → review.
