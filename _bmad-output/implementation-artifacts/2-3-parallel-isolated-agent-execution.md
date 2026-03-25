# Story 2.3: Parallel Isolated Agent Execution

Status: done

## Story

As a user (via the system),
I want four independent agents per path to run in parallel without seeing each other's outputs,
so that outcomes feel emergent rather than a single blended answer.

## Acceptance Criteria

_trace: FR7 (isolated role execution), FR8 (structured per-agent outputs), ADR-03 (8 parallel isolated calls), Architecture sections 5/8 (isolation + bounded concurrency + timeout), Epic 2 Story 2.3_

1. **Given** parsed `path_labels` and resolved `roles` from Story 2.2 **when** agent execution runs **then** the server issues 8 LLM calls total (4 for Path A + 4 for Path B) in parallel with bounded concurrency and timeout handling.
2. **And** each agent call receives only: role, path description, and shared user context; no peer-agent outputs are included in prompt input for that path (strict isolation).
3. **And** each agent returns parseable JSON mapped to `AgentOutput` shape in `src/lib/types.ts` (`role`, `insight`, `confidence`, `grounding`).
4. **And** partial failures are captured with path/slot attribution (for example `A-2`, `B-4`) and surfaced as structured server errors suitable for Epic 6 recovery behavior.
5. **And** the route response stays `SimulationResponse`-compatible and keeps downstream UI testability intact while Story 2.4 synthesis/KPI work is still pending.
6. **And** quality gates pass: `npm run lint`, `npm run test`, `npm run build`.

## Tasks / Subtasks

- [x] **Create agent runner module** (AC 1-4)
  - [x] Add `src/lib/agents.ts`.
  - [x] Export `runParallelAgents(input): Promise<RunAgentsResult>` with typed input/output.
  - [x] Export typed errors for classification in route:
    - [x] `AgentTimeoutError`
    - [x] `AgentProviderError`
    - [x] `AgentParseError`
    - [x] `AgentPartialFailureError` (must include failed slots list).

- [x] **Implement bounded parallel execution** (AC 1, 4)
  - [x] Build exactly 8 tasks from `roles` and `path_labels`.
  - [x] Use a concurrency limiter (preferred: `p-limit`) to cap simultaneous LLM calls.
  - [x] Use per-call timeout (`SIMULATION_TIMEOUT_MS`) and preserve run continuity until all tasks settle.
  - [x] Collect per-slot outcomes using `Promise.allSettled` (or equivalent), then classify full success vs partial failure.

- [x] **Implement strict prompt isolation** (AC 2)
  - [x] Create prompt builders that only accept:
    - [x] `pathLabel` (A or B text),
    - [x] `role`,
    - [x] user `context`.
  - [x] Do not pass any outputs from other agents.
  - [x] Keep all prompt logic server-side in `src/lib/agents.ts` (not route, not client).

- [x] **Parse and validate agent JSON output** (AC 3)
  - [x] Parse LLM response JSON for each agent call.
  - [x] Validate required fields and normalize values:
    - [x] `confidence` clamped to `0..1`
    - [x] `grounding` coerced to `"supplied" | "mixed" | "assumed"` (fallback to `"assumed"` on invalid value)
  - [x] Ensure returned `role` string aligns to the expected slot role from `AGENT_ROLES[viz_type]`.

- [x] **Integrate into `/api/simulate` route** (AC 1, 4, 5)
  - [x] Update `src/app/api/simulate/route.ts` to call `runParallelAgents` after `classifyDecision`.
  - [x] Replace current stubbed agents (`buildAgentStubs`) with real per-path agent outputs.
  - [x] Keep synthesis/KPI/comparison sourced from `MOCK_SIMULATION_RESPONSE` until Story 2.4.
  - [x] Extend route error mapping:
    - [x] timeout -> `PROVIDER_TIMEOUT` (504, recoverable)
    - [x] provider failure -> `PROVIDER_ERROR` (502, recoverable)
    - [x] parse failure -> `PARSE_ERROR` (502, recoverable)
    - [x] partial failure -> `PARTIAL_AGENT_FAILURE` (502, recoverable, include failure metadata)

- [x] **Add tests for agent runner and route integration** (AC 1-6)
  - [x] Add `src/lib/agents.test.ts` with mocked `openai` client:
    - [x] success path returns 8 validated agent outputs split 4/4
    - [x] bounded concurrency behavior (no unbounded parallel flood)
    - [x] timeout classification
    - [x] malformed JSON parse classification
    - [x] partial failure captures path/slot metadata
  - [x] Update `src/app/api/simulate/route.test.ts`:
    - [x] success response includes real generated agents, not blank stubs
    - [x] partial failure returns expected code and recovery fields
    - [x] existing tests from 2.1/2.2 remain passing

- [x] **Run quality gates** (AC 6)
  - [x] `npm run lint`
  - [x] `npm run test`
  - [x] `npm run build`

### Review Findings

- [x] [Review][Patch] Dead route handlers — `AgentTimeoutError`, `AgentProviderError`, `AgentParseError` are imported and handled in route but `runParallelAgents` only ever throws `AgentPartialFailureError`; the three individual handlers (lines 158–184 in `route.ts`) are unreachable dead code [src/app/api/simulate/route.ts:158]
- [x] [Review][Patch] `AGENT_CONCURRENCY_LIMIT` with a non-numeric value → `Number("abc")` = `NaN` → `pLimit(NaN)` throws uncaught TypeError → 500 INTERNAL_ERROR; add `|| 4` guard after `Number(...)` [src/app/api/simulate/route.ts:97]
- [x] [Review][Defer] Shared `SIMULATION_TIMEOUT_MS` for both classify and agent phases — worst-case wall-clock latency is `timeoutMs + (timeoutMs × ceil(8/concurrency))` (90s at defaults), risking infra gateway timeouts [src/app/api/simulate/route.ts:96] — deferred, design scope beyond 2.3; address with separate `AGENT_TIMEOUT_MS` env var in a future story
- [x] [Review][Defer] `max_tokens: 220` is tight for JSON + meaningful insight text; complex responses may truncate mid-JSON producing `AgentParseError` [src/lib/agents.ts:147] — deferred, tuning concern for Epic 6
- [x] [Review][Defer] `new OpenAI({ apiKey })` instantiated per-request inside `runParallelAgents`; no connection reuse or singleton [src/lib/agents.ts:170] — deferred, performance optimization for future story

---

## Dev Notes

### Architectural constraints (must follow)

- Keep single orchestration endpoint: `POST /api/simulate` (ADR-02).
- Preserve ADR-03 isolation: no cross-agent sharing before synthesis.
- Keep `viz_type` backend-owned from classifier (ADR-04); 2.3 must not re-classify.
- Keep secrets server-only (`LLM_API_KEY`, model vars) in route/server modules.

### Existing code context (read first)

- `src/app/api/simulate/route.ts` currently:
  - already performs rate-limit and request validation,
  - calls `classifyDecision`,
  - returns mock synthesis/KPIs,
  - still uses stub agent outputs (this story replaces only that part).
- `src/lib/classifier.ts` already provides:
  - path labels,
  - `viz_type`,
  - role resolution through `AGENT_ROLES`.
- `src/lib/types.ts` is source-of-truth for `AgentOutput` and `SimulationResponse`.
- `src/lib/mock-fixture.ts` remains the temporary source for synthesis/KPIs until Story 2.4.

### Suggested module shape: `src/lib/agents.ts`

Use a narrow contract so route stays clean:

- `RunParallelAgentsInput`:
  - `pathLabels: { A: string; B: string }`
  - `roles: [string, string, string, string]`
  - `context: SimulationRequest["context"]`
  - `apiKey: string`
  - `model: string` (from `LLM_MODEL_AGENT`)
  - `timeoutMs: number`
  - `concurrency: number` (derive from env or default)
- `RunParallelAgentsResult`:
  - `agentsByPath: { A: AgentOutput[]; B: AgentOutput[] }`
  - `failures?: Array<{ path: "A" | "B"; slot: 1 | 2 | 3 | 4; role: string; reason: string }>`

### Environment variables used in this story

- `LLM_MODEL_AGENT` (newly active in this story)
- `SIMULATION_TIMEOUT_MS` (already used in 2.2; reuse)
- `LLM_API_KEY` (already required)
- Optional (if introduced): `AGENT_CONCURRENCY_LIMIT` with safe default (recommended `4`)

### Error handling contract for route

Keep recovery posture consistent with 2.2 classify failures:

- `recovery: { canUseCache: true, fallbackViz: true }` for provider/timeout/parse/partial-agent failures.
- Do not leak raw provider stack traces to client responses.

### Scope boundaries (do not implement here)

- Per-path synthesis and KPI calculation (Story 2.4).
- Streaming/SSE progress protocol and HUD live updates (Epic 5 / Epic 6 integration).
- Client-side fetch wiring beyond current route contract (Epic 6).

### Testing expectations

- All new behavior is test-first with mocked provider calls.
- Preserve and keep passing existing `route.test.ts` assertions from Stories 2.1 and 2.2.
- Add focused unit coverage for slot-level attribution on partial failure, since Epic 6 depends on this data.

### Previous story intelligence (2.2 carry-over)

- Reuse route error helper and classification pattern from `route.ts`; extend, do not rewrite.
- Keep function-level provider client initialization for testability.
- Follow current vitest hoisted mocking style in `route.test.ts`.
- Continue importing through `@/` alias; do not introduce alternative path conventions.

### Git intelligence summary (recent commits)

- Commit history pattern is story-scoped (`implementation of 2.x`) and modifies:
  - route + route tests,
  - dedicated `src/lib/*.ts` module + tests,
  - story artifact + sprint status.
- Follow the same structure for 2.3 to stay consistent with repository workflow.

### Latest technical notes

- OpenAI Node SDK in repo is `openai@^6.32.0`; current usage via `chat.completions.create` and `response_format: { type: "json_object" }` is valid.
- For bounded parallel runs, combine concurrency limiter + `Promise.allSettled` to avoid fail-fast behavior and preserve partial-failure diagnostics.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2 / Story 2.3 AC)
- `_bmad-output/planning-artifacts/architecture.md` (orchestration, isolation, performance, errors)
- `_bmad-output/planning-artifacts/prd.md` (FR7, FR8, NFR-P2, NFR-S1)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (progress trust + fallback continuity)
- `_bmad-output/implementation-artifacts/2-2-decision-parser-classifier-agent-role-resolution.md` (current implementation baseline)
- `docs/integration-contracts.md` (C6 SimulationResponse expectations)

---

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm install p-limit`
- `npm run test`
- `npm run lint`
- `npm run build`

### Completion Notes List

- Implemented `src/lib/agents.ts` with strict prompt isolation, bounded concurrency (`p-limit`), `Promise.allSettled` collection, per-slot attribution, and typed errors for timeout/provider/parse/partial failure paths.
- Integrated real parallel agent execution into `POST /api/simulate`, replaced stubbed agent arrays, and preserved mock synthesis/KPI/comparison payloads pending Story 2.4.
- Extended route error payloads to return `PARTIAL_AGENT_FAILURE` with structured slot failure metadata under `error.details.failures` while keeping existing recovery posture.
- Added unit coverage in `src/lib/agents.test.ts` and route integration coverage in `src/app/api/simulate/route.test.ts` for success, concurrency bounds, timeout/parse behavior, and partial failure propagation.
- Verified all quality gates pass: lint, full test suite, and production build.

### Change Log

- 2026-03-25: Implemented Story 2.3 parallel isolated agent execution, route integration, and full validation coverage.

### File List

- `_bmad-output/implementation-artifacts/2-3-parallel-isolated-agent-execution.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `package.json` (updated)
- `package-lock.json` (updated)
- `src/lib/agents.ts` (new)
- `src/lib/agents.test.ts` (new)
- `src/lib/types.ts` (updated)
- `src/app/api/simulate/route.ts` (updated)
- `src/app/api/simulate/route.test.ts` (updated)

---

**Story completion status**

- Status: **done**
- Note: Code review complete. 2 patches applied (dead route handlers removed, concurrency NaN guard added). 3 items deferred.
