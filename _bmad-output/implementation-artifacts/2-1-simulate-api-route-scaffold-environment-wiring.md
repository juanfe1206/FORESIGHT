# Story 2.1: Simulate API Route Scaffold & Environment Wiring

Status: done

## Story

As an integrator,
I want a documented POST `/api/simulate` endpoint with validation and error shape,
So that the client and tests can call one stable contract.

## Acceptance Criteria

_trace: FR31 (programmatic API access), NFR-S1 (secrets server-side only), NFR-S2 (HTTPS via platform), NFR-I3 (quota awareness); ADR-02 (single endpoint); Architecture §4 (request/error contracts), §9 (security posture)_

1. **Given** a POST to `/api/simulate` with JSON body matching `SimulationRequest` **when** the route receives the request **then** the body is validated (decision: string, non-empty, ≤ 2000 chars; context fields: correct types, string fields ≤ 500 chars, `monthlyRevenue` numeric if present) and a stub `SimulationResponse` is returned with `status: "completed"` using mock fixture data.
2. **And** `LLM_API_KEY`, `LLM_MODEL_PARSE_CLASSIFY`, `LLM_MODEL_AGENT`, `LLM_MODEL_SYNTHESIS`, and `SIMULATION_TIMEOUT_MS` are read server-side only — never leaked into client bundles.
3. **And** on validation failure the route returns HTTP 400 with `ErrorResponse` shape (`status: "error"`, `error.code`, `error.message`, `error.recoverable: false`, `recovery.canUseCache: false`, `recovery.fallbackViz: false`).
4. **And** if `LLM_API_KEY` is absent at runtime the route returns HTTP 503 with `ErrorResponse` (`error.code: "MISSING_CONFIG"`, `error.recoverable: false`).
5. **And** a basic in-memory sliding-window rate limiter is applied: max 10 requests per IP per 60-second window; excess returns HTTP 429 with `ErrorResponse` (`error.code: "RATE_LIMITED"`).
6. **And** `npm run lint`, `npm run test`, and `npm run build` all pass after this story.

## Tasks / Subtasks

- [x] **Resolve environment variable naming and update `.env.local` / `.env.example` (AC 2)**
  - [x] Rename to architecture-spec names: `LLM_API_KEY`, `LLM_MODEL_PARSE_CLASSIFY`, `LLM_MODEL_AGENT`, `LLM_MODEL_SYNTHESIS`, `SIMULATION_TIMEOUT_MS`, `MAPBOX_ACCESS_TOKEN`, `ENABLE_GOLDEN_REPLAY` in both `.env.local` and `.env.example`.
  - [x] Keep `OPENAI_API_KEY` as an alias comment (or remove if already mapped); `AGENT_MODEL_*` names are replaced.
  - [x] Do NOT add any LLM key to any file that is tracked by git (`.env.local` is gitignored — safe).

- [x] **Create `src/app/api/simulate/route.ts` — POST handler scaffold (AC 1–5)**
  - [x] Export `async function POST(request: NextRequest): Promise<Response>` — no default export, no `"use client"`.
  - [x] Parse and validate request body (see validation spec in Dev Notes).
  - [x] Read env vars from `process.env`; if `LLM_API_KEY` is missing return 503 `ErrorResponse`.
  - [x] Apply in-memory sliding-window rate limiter (see Dev Notes for implementation).
  - [x] For valid requests: return HTTP 200 with `MOCK_SIMULATION_RESPONSE` from `@/lib/mock-fixture` cast to `SimulationResponse` — this is the stub that Stories 2.2–2.4 will replace incrementally.
  - [x] Ensure `Content-Type: application/json` on all responses.

- [x] **Create `src/app/api/simulate/validate.ts` — pure validation helpers**
  - [x] Export `validateSimulationRequest(body: unknown): { valid: true; data: SimulationRequest } | { valid: false; code: string; message: string }`.
  - [x] Check all fields per AC 1 constraints; no external validation library.

- [x] **Create `src/app/api/simulate/rate-limit.ts` — in-memory rate limiter**
  - [x] Sliding-window map keyed by IP string; max 10 req / 60 s window.
  - [x] Export `checkRateLimit(ip: string): { allowed: boolean }`.
  - [x] Use `Map<string, number[]>` with timestamp array; evict old entries on each check.
  - [x] Accept that this resets on cold-start (acceptable for MVP/hackathon).

- [x] **Create `src/app/api/simulate/route.test.ts` — integration smoke tests**
  - [x] Test: valid body → 200 with `SimulationResponse` shape (check `runId`, `status`, `viz_type`, `paths.A`, `paths.B`).
  - [x] Test: missing `decision` field → 400 with `ErrorResponse` (`error.code` present, `recoverable: false`).
  - [x] Test: `decision` over 2000 chars → 400.
  - [x] Test: missing `LLM_API_KEY` env var → 503 with `error.code: "MISSING_CONFIG"`.
  - [x] Use `fetch` or direct handler call pattern supported by Vitest (no DOM needed).
  - [x] Do NOT mock `process.env` globally — use `beforeEach`/`afterEach` env manipulation.

- [x] **Quality gate**
  - [x] `npm run lint` — zero errors.
  - [x] `npm run test` — all existing + new tests pass.
  - [x] `npm run build` — no TypeScript errors or build failures.

### Review Findings

- [x] [Review][Patch] Malformed JSON body returns 500 INTERNAL_ERROR instead of 400 VALIDATION_ERROR [`route.ts:52`]
- [x] [Review][Patch] Catch block swallows exceptions silently — no internal logging despite spec requirement [`route.ts:74`]
- [x] [Review][Defer] Rate limiter `store` accumulates stale IP map entries indefinitely [`rate-limit.ts:3`] — deferred, pre-existing design choice acknowledged as MVP-acceptable
- [x] [Review][Defer] `x-forwarded-for` can be forged to bypass per-IP rate limiting [`route.ts:31-37`] — deferred, pre-existing limitation of header-based IP detection
- [x] [Review][Defer] `decision` stored untrimmed in validated data; will reach LLM with whitespace padding [`validate.ts:46,124`] — deferred, affects 2.2+ LLM quality, not observable in current scaffold

---

## Dev Notes

### Critical Constraint: This Story Is a Scaffold Only

Stories 2.2–2.4 fill in the actual LLM logic. This story's route handler **must**:
- Return `MOCK_SIMULATION_RESPONSE` for valid requests (stub).
- Establish the full validation + error shape + env-reading pattern so downstream stories can extend it without changing the public contract.
- NOT call any LLM provider — that belongs to Story 2.2+.

### Environment Variable Naming Reconciliation

Story 1.4 explicitly deferred this to Story 2.1. The discrepancy is:
- `.env.local` and `.env.example` currently use `OPENAI_API_KEY`, `AGENT_MODEL_DECISION_PARSER`, `AGENT_MODEL_SYNTHESIS`.
- Architecture doc specifies: `LLM_API_KEY`, `LLM_MODEL_PARSE_CLASSIFY`, `LLM_MODEL_AGENT`, `LLM_MODEL_SYNTHESIS`, `SIMULATION_TIMEOUT_MS`, `MAPBOX_ACCESS_TOKEN`, `ENABLE_GOLDEN_REPLAY`.

**Resolution:** Rename to architecture names. In `.env.local`, set `LLM_API_KEY` to the value that was in `OPENAI_API_KEY`. Remove `AGENT_MODEL_*` keys; add `LLM_MODEL_PARSE_CLASSIFY`, `LLM_MODEL_AGENT`, `LLM_MODEL_SYNTHESIS`. This is the only story that touches env file naming.

### App Router Route File Location

```
src/app/api/simulate/
  route.ts        ← POST handler (main entry point)
  validate.ts     ← request validation helpers (pure functions)
  rate-limit.ts   ← in-memory rate limiter
  route.test.ts   ← Vitest smoke tests
```

The `src/app/` App Router convention means the route is served at `/api/simulate` automatically. No `pages/api/` directory — that is the old Pages Router pattern and must NOT be used.

### Route Handler Pattern (Next.js 16 App Router)

```ts
// src/app/api/simulate/route.ts
import type { NextRequest } from "next/server";
import type { SimulationResponse, ErrorResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<Response> {
  // 1. IP from headers (Vercel sets x-forwarded-for)
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  
  // 2. Rate limit check
  // 3. Parse body
  // 4. Validate
  // 5. Env check
  // 6. Return stub or error
}
// No default export. No GET export (POST only for this endpoint).
// No "use client" — route files are always server-side.
```

**Import pattern for `NextRequest`:**
```ts
import type { NextRequest } from "next/server";
```
Use `Response.json(data, { status: 200 })` — the Web standard `Response` is available globally in Next.js App Router route handlers. `NextResponse` from `next/server` is an alternative but `Response.json()` is simpler and idiomatic.

### Request Validation Spec

`validateSimulationRequest` must enforce:

| Field | Rule |
|-------|------|
| `decision` | Required, string, non-empty after trim, ≤ 2000 chars |
| `context` | Optional object; if present, must be object (not array, not null) |
| `context.industry` | Optional string, ≤ 500 chars |
| `context.monthlyRevenue` | Optional number (or omitted); reject if present as non-number |
| `context.location` | Optional string, ≤ 500 chars |
| `context.customerBase` | Optional string, ≤ 500 chars |
| `context.details` | Optional string, ≤ 500 chars |
| `options` | Optional object; unknown keys ignored |

Error codes to use:
- `"VALIDATION_ERROR"` — malformed fields, recoverable: false
- `"MISSING_CONFIG"` — env var absent, recoverable: false
- `"RATE_LIMITED"` — rate limit exceeded, recoverable: true (retry after)

### Rate Limiter Implementation Pattern

```ts
// src/app/api/simulate/rate-limit.ts
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const store = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const timestamps = (store.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return { allowed: false };
  timestamps.push(now);
  store.set(ip, timestamps);
  return { allowed: true };
}
```

**Important:** The `store` is module-level (process-scoped), so it resets on Vercel cold starts. This is acceptable for MVP. Do NOT use Redis or any external store in this story.

### Stub Response for Valid Requests

```ts
import { MOCK_SIMULATION_RESPONSE } from "@/lib/mock-fixture";

// Inside POST handler for valid request:
return Response.json(
  { ...MOCK_SIMULATION_RESPONSE, runId: `run_${Date.now()}` } satisfies SimulationResponse,
  { status: 200 }
);
```

This preserves the full `SimulationResponse` contract. Stories 2.2–2.4 will replace this with real orchestration.

### Error Response Shape

All errors must satisfy `ErrorResponse` from `@/lib/types`:

```ts
const errorResponse: ErrorResponse = {
  runId: `run_${Date.now()}`,
  status: "error",
  error: {
    code: "VALIDATION_ERROR",
    message: "decision must be a non-empty string.",
    recoverable: false,
  },
  recovery: {
    canUseCache: false,
    fallbackViz: false,
  },
};
return Response.json(errorResponse, { status: 400 });
```

HTTP status codes:
- 400: validation error
- 429: rate limited
- 503: missing server config
- 500: unexpected error (catch-all; log internally, return generic message to client — do not leak stack traces)

### Existing Files — Do NOT Modify

- `src/lib/types.ts` — types are complete; import only.
- `src/lib/mock-fixture.ts` — use `MOCK_SIMULATION_RESPONSE` as stub.
- `src/lib/integration-contracts.ts` — no changes.
- All `src/components/shell/*` files.
- `src/app/layout.tsx`, `src/app/page.tsx`.
- Any test files from Stories 1.1–1.4.

### Alias Paths

TypeScript path alias `@/` maps to `src/`. Use `@/lib/types`, `@/lib/mock-fixture` etc. — confirmed working from previous stories.

### Runtime: Next.js 16.2.1 + React 19.2.4

The architecture doc says "Next.js 14" — the actual runtime is **16.2.1**. Route handler API is stable and consistent with what's documented in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`. The `Request`/`Response` globals are Web-standard; `NextRequest` extends `Request` and adds `nextUrl` and `ip` convenience. Prefer `request.headers.get("x-forwarded-for")` for IP (Vercel sets this) over `request.ip` (may be undefined outside Vercel).

### Testing Route Handlers with Vitest

Route handlers are plain async functions. Call them directly in tests by constructing a `Request` (or `NextRequest`):

```ts
import { POST } from "./route";

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/simulate", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify(body),
  });

it("returns 200 for valid request", async () => {
  const res = await POST(makeRequest({ decision: "A or B?" }) as any);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.runId).toBeDefined();
  expect(data.status).toBe("completed");
});
```

Use `process.env.LLM_API_KEY = "test-key"` in `beforeEach` and `delete process.env.LLM_API_KEY` in `afterEach` to simulate missing config.

### Previous Story Intelligence (Story 1.4)

- **No `app/api/` directory exists yet** — this story creates it from scratch; verify with a quick check before writing files.
- The git log shows commits are tightly scoped per story; follow the same discipline.
- `src/lib/types.ts` exports `SimulationRequest`, `SimulationResponse`, `ErrorResponse` — all needed types already exist; import, do not redeclare.
- `MOCK_SIMULATION_RESPONSE` and `MOCK_BAKERY_MAP_FIXTURE` are both valid exports from `src/lib/mock-fixture.ts` (they reference the same object per Story 1.4 completion notes).
- TypeScript strict mode is active; avoid `any` casts except where needed to satisfy `NextRequest` type in test helpers.
- Vitest is the test runner; `describe`, `it`, `expect` from `"vitest"`.

### File List for This Story

New files to create:
- `src/app/api/simulate/route.ts`
- `src/app/api/simulate/validate.ts`
- `src/app/api/simulate/rate-limit.ts`
- `src/app/api/simulate/route.test.ts`

Files to update:
- `.env.local` — rename env var keys to architecture names
- `.env.example` — same rename, no secret values
- `_bmad-output/implementation-artifacts/2-1-simulate-api-route-scaffold-environment-wiring.md` (this file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Scope Boundaries — Do NOT Implement in This Story

- LLM calls (Story 2.2 owns parse/classify)
- Agent execution (Story 2.3)
- Synthesis / KPI assembly (Story 2.4)
- SSE/streaming (architecture mentions it as optional; not in this story's scope)
- Client-side fetch wiring (Epic 6 convergence)
- `MAPBOX_ACCESS_TOKEN` usage (Epic 4 scope)

---

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test -- src/app/api/simulate/route.test.ts` (red): failed before route implementation (`./route` missing).
- `npm run test -- src/app/api/simulate/route.test.ts` (green): 5/5 passing (including rate-limit 429 case).
- `npm run lint; npm run test; npm run build`: all gates passing after lint fix in route test typing.

### Completion Notes List

- Story 2.1 context generated. API route scaffold scoped to `src/app/api/simulate/`; env naming reconciliation resolved; stub returns `MOCK_SIMULATION_RESPONSE`; Stories 2.2–2.4 extend the handler incrementally.
- Ultimate context engine analysis completed — comprehensive developer guide created.
- Implemented scaffolded `/api/simulate` POST route with server-side env guard (`LLM_API_KEY`), request validation, rate limiting, stubbed `SimulationResponse`, and typed `ErrorResponse` handling for 400/429/503/500.
- Added pure validator and module-level in-memory sliding-window limiter (`Map<string, number[]>`, 10 req / 60s) aligned to story constraints.
- Added integration smoke tests for success, validation failures, and missing-config behavior using direct handler invocation and scoped `process.env` setup/teardown.
- Added integration smoke coverage for the 429 rate-limit path (`RATE_LIMITED`) from a single IP.
- Reconciled env variable names in `.env.local` and `.env.example` to architecture-aligned keys (`LLM_*`, `SIMULATION_TIMEOUT_MS`, `MAPBOX_ACCESS_TOKEN`, `ENABLE_GOLDEN_REPLAY`) and replaced `AGENT_MODEL_*`.
- Quality gates passed: lint, full test suite, and production build.

### File List

- `.env.local`
- `.env.example`
- `_bmad-output/implementation-artifacts/2-1-simulate-api-route-scaffold-environment-wiring.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/api/simulate/rate-limit.ts`
- `src/app/api/simulate/route.test.ts`
- `src/app/api/simulate/route.ts`
- `src/app/api/simulate/validate.ts`

## Change Log

- **2026-03-25:** Story 2.1 created and marked ready-for-dev.
- **2026-03-24:** Story 2.1 implemented; scaffolded `/api/simulate` route, env wiring reconciliation, validation/rate-limit helpers, integration smoke tests, and quality gates completed. Status moved to review.

---

**Story completion status**

- Status: **done**
