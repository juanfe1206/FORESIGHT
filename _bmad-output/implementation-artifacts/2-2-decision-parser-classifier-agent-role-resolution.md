# Story 2.2: Decision Parser, Classifier & Agent Role Resolution

Status: review

## Story

As a user (via the system),
I want my natural-language decision split into two paths and a visualization mode,
so that the UI can label panels correctly and pick the right metaphor.

## Acceptance Criteria

_trace: FR4 (derive Path A/B descriptions), FR5 (classify viz category), FR6 (assign agent role palette); ADR-04 (viz_type is backend-owned); Architecture §5 (orchestration flow — 1 classify call before 8 agent calls); NFR-S1 (secrets server-side only)_

1. **Given** a valid `decision` string and `context` **when** the parse/classify step runs **then** the response includes `path_labels.A` and `path_labels.B` derived from the user's actual wording — never generic labels like "Scenario A" or "Option B".
2. **And** `viz_type` in the response is one of `"map" | "flow" | "network"` (or `"fallback"` only if the LLM explicitly cannot determine a category after a second attempt).
3. **And** the four agent role labels for the run are resolved from `AGENT_ROLES[viz_type]` (imported from `@/lib/types`) and reflected in the returned agents array for each path.
4. **And** parse/classify failures (provider timeout, non-JSON response, missing fields) return a structured `ErrorResponse` with an appropriate `error.code` — no raw stack traces reach the client.
5. **And** the route still returns a complete `SimulationResponse`-shaped payload (agents stubs + mock KPIs/synthesis from the fixture) so downstream UI remains testable while Stories 2.3 and 2.4 are pending.
6. **And** `npm run lint`, `npm run test`, and `npm run build` all pass after this story.

## Tasks / Subtasks

- [x] **Install `openai` SDK (AC 1–4 — prerequisite)**
  - [x] Run `npm install openai` in the project root — this package is NOT yet in `package.json` and the LLM calls will fail at import without it.
  - [x] Verify the `openai` entry appears in `package.json` dependencies after install.

- [x] **Create `src/lib/classifier.ts` — parse/classify service (AC 1–4)**
  - [x] Export `interface ClassifyResult { path_labels: { A: string; B: string }; viz_type: VizType; roles: [string, string, string, string]; }`.
  - [x] Export `async function classifyDecision(decision: string, context: SimulationRequest["context"], apiKey: string, model: string, timeoutMs: number): Promise<ClassifyResult>`.
  - [x] Initialize `OpenAI` client inside the function (not at module level) using `new OpenAI({ apiKey })`.
  - [x] Make one `chat.completions.create` call with a system prompt (see Dev Notes for exact prompt).
  - [x] Use `AbortSignal.timeout(timeoutMs)` as the `signal` option on the API call for timeout enforcement.
  - [x] Parse the LLM JSON response and validate it has `path_a`, `path_b`, `viz_type` fields.
  - [x] Map `viz_type` to `VizType`: if not one of `map | flow | network`, default to `"network"` (not `"fallback"` — fallback is reserved for render errors per ADR-04).
  - [x] Resolve `roles` using `AGENT_ROLES[viz_type]` from `@/lib/types`.
  - [x] Throw typed errors (not plain strings) so the route can classify them (see Dev Notes for error classes).

- [x] **Create `src/lib/classifier.test.ts` — unit tests (AC 1–4)**
  - [x] Test: valid decision → returns correct `path_labels`, valid `viz_type`, correct `roles` array (mock OpenAI response).
  - [x] Test: LLM returns `viz_type` not in known set → defaults to `"network"`.
  - [x] Test: LLM returns malformed JSON → throws classifiable error.
  - [x] Test: LLM call times out (simulate via mock) → throws classifiable error.
  - [x] Mock the `openai` module with `vi.mock("openai")` — do NOT make live LLM calls in tests.

- [x] **Update `src/app/api/simulate/route.ts` — integrate classifier (AC 1–5)**
  - [x] Import `classifyDecision` from `@/lib/classifier`.
  - [x] After validation, call `classifyDecision(data.decision, data.context, LLM_API_KEY, LLM_MODEL_PARSE_CLASSIFY, SIMULATION_TIMEOUT_MS)`.
  - [x] Read `LLM_MODEL_PARSE_CLASSIFY` and `SIMULATION_TIMEOUT_MS` from `process.env` (already guarded by the `LLM_API_KEY` check from Story 2.1).
  - [x] Parse `SIMULATION_TIMEOUT_MS` to number with a safe fallback: `Number(process.env.SIMULATION_TIMEOUT_MS ?? "30000")`.
  - [x] On classify success: build a `SimulationResponse` using the real `path_labels` and `viz_type`, stub agents with resolved role names (see Dev Notes for stub shape), and keep KPIs/synthesis/comparison from `MOCK_SIMULATION_RESPONSE`.
  - [x] On `ProviderTimeoutError` → return 504 `ErrorResponse` with `code: "PROVIDER_TIMEOUT"`, `recoverable: true`, `recovery.canUseCache: true`, `recovery.fallbackViz: true`.
  - [x] On `ProviderError` → return 502 `ErrorResponse` with `code: "PROVIDER_ERROR"`, `recoverable: true`, `recovery.canUseCache: true`, `recovery.fallbackViz: true`.
  - [x] On `ParseError` → return 502 `ErrorResponse` with `code: "PARSE_ERROR"`, `recoverable: true`, `recovery.fallbackViz: true`.
  - [x] Do NOT remove the rate limiter, validation, or MISSING_CONFIG guard from Story 2.1 — extend only.

- [x] **Update `src/app/api/simulate/route.test.ts` — extend tests (AC 5–6)**
  - [x] Add test: valid request with mocked classifier success → 200 with real `path_labels` and `viz_type` reflected in the response.
  - [x] Add test: classifier throws `ProviderTimeoutError` → 504 with `error.code: "PROVIDER_TIMEOUT"`.
  - [x] Add test: classifier throws `ProviderError` → 502 with `error.code: "PROVIDER_ERROR"`.
  - [x] Mock `classifyDecision` using `vi.mock("@/lib/classifier")` — do NOT make live LLM calls in route tests.
  - [x] Existing Story 2.1 tests (200 success, 400 validation, 503 missing-config, 429 rate-limit) must still pass unchanged.

- [x] **Quality gate**
  - [x] `npm run lint` — zero errors.
  - [x] `npm run test` — all existing + new tests pass.
  - [x] `npm run build` — no TypeScript errors or build failures.

---

## Dev Notes

### CRITICAL: `openai` Package Not Installed

The `openai` npm package is **not in `package.json`** (verified). The LLM call will fail at runtime and TypeScript will fail to compile without it.

```bash
npm install openai
```

After install, import as:
```ts
import OpenAI from "openai";
```

The current runtime is **Next.js 16.2.1 + React 19.2.4**. The `openai` package v4.x works in the Next.js App Router server context without any special configuration.

### Classifier Module: `src/lib/classifier.ts`

This is the only new `lib/` file this story creates. Stories 2.3 and 2.4 will add `lib/agents.ts` and synthesis logic respectively.

**Typed error classes (define at top of `classifier.ts`):**
```ts
export class ProviderTimeoutError extends Error {
  readonly kind = "ProviderTimeoutError" as const;
  constructor(message = "LLM provider timed out.") { super(message); this.name = "ProviderTimeoutError"; }
}
export class ProviderError extends Error {
  readonly kind = "ProviderError" as const;
  constructor(message = "LLM provider returned an error.") { super(message); this.name = "ProviderError"; }
}
export class ParseError extends Error {
  readonly kind = "ParseError" as const;
  constructor(message = "LLM response could not be parsed.") { super(message); this.name = "ParseError"; }
}
```

**OpenAI client initialization (inside function, not module level):**
```ts
import OpenAI from "openai";

export async function classifyDecision(
  decision: string,
  context: SimulationRequest["context"],
  apiKey: string,
  model: string,
  timeoutMs: number,
): Promise<ClassifyResult> {
  const client = new OpenAI({ apiKey });
  // ...
}
```

Instantiating inside the function avoids module-level side effects and makes testing easier (the mock replaces the module).

**AbortSignal timeout pattern:**
```ts
let completion;
try {
  completion = await client.chat.completions.create(
    {
      model,
      messages: [{ role: "system", content: CLASSIFY_SYSTEM_PROMPT }, { role: "user", content: buildUserPrompt(decision, context) }],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.2,
    },
    { signal: AbortSignal.timeout(timeoutMs) },
  );
} catch (err) {
  if (err instanceof Error && err.name === "TimeoutError") throw new ProviderTimeoutError();
  throw new ProviderError(err instanceof Error ? err.message : String(err));
}
```

**System prompt (`CLASSIFY_SYSTEM_PROMPT`):**
```
You are a business decision classifier. Given a business decision and context, you must:
1. Extract the two distinct options being considered as path_a and path_b, using the user's exact wording where possible.
2. Classify the decision type as exactly one of: "map", "flow", or "network".

Classification rules:
- "map": decision involves location, geographic reach, local market, physical presence, territory, or place-based customers
- "flow": decision involves budget, resource allocation, investment, capacity, cost, staffing, or time allocation
- "network": decision involves partnerships, stakeholders, relationships, collaborations, or ecosystem dynamics

Respond with a JSON object only. No explanation, no markdown, no surrounding text. Example:
{"path_a": "Invest in Instagram ads", "path_b": "Partner with Cafe Central", "viz_type": "map"}
```

**User prompt builder:**
```ts
function buildUserPrompt(decision: string, context: SimulationRequest["context"]): string {
  const contextParts: string[] = [];
  if (context.industry) contextParts.push(`Industry: ${context.industry}`);
  if (context.location) contextParts.push(`Location: ${context.location}`);
  if (context.customerBase) contextParts.push(`Customer base: ${context.customerBase}`);
  if (context.monthlyRevenue) contextParts.push(`Monthly revenue: €${context.monthlyRevenue}`);
  if (context.details) contextParts.push(`Additional details: ${context.details}`);
  const contextBlock = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : "";
  return `Decision: ${decision}${contextBlock}`;
}
```

**Parsing and validation:**
```ts
const raw = completion.choices[0]?.message?.content ?? "";
let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch {
  throw new ParseError(`Non-JSON response: ${raw.slice(0, 100)}`);
}
if (
  typeof parsed !== "object" || parsed === null ||
  typeof (parsed as Record<string, unknown>).path_a !== "string" ||
  typeof (parsed as Record<string, unknown>).path_b !== "string" ||
  typeof (parsed as Record<string, unknown>).viz_type !== "string"
) {
  throw new ParseError("Missing required fields in LLM response.");
}
const p = parsed as { path_a: string; path_b: string; viz_type: string };
const VALID_VIZ = new Set<string>(["map", "flow", "network"]);
const viz_type: VizType = VALID_VIZ.has(p.viz_type) ? (p.viz_type as VizType) : "network";
const roles = AGENT_ROLES[viz_type];
return { path_labels: { A: p.path_a, B: p.path_b }, viz_type, roles };
```

### Route Update: Stub Response After Real Classify

After `classifyDecision()` succeeds, build a `SimulationResponse` that is **self-consistent**: real `path_labels` + real `viz_type` + role-matched agent stubs + mock KPIs. This is temporary — Stories 2.3 and 2.4 replace the agent stubs and mock KPIs respectively.

**Stub agent shape for each path (8 total — 4 per path):**
```ts
function buildAgentStubs(roles: [string, string, string, string]): AgentOutput[] {
  return roles.map((role) => ({
    role,
    insight: "",          // Story 2.3 populates this with real LLM output
    confidence: 0,
    grounding: "assumed" as const,
  }));
}
```

**Route success block (replaces the current `MOCK_SIMULATION_RESPONSE` spread):**
```ts
const { path_labels, viz_type, roles } = await classifyDecision(
  data.decision,
  data.context,
  process.env.LLM_API_KEY!,
  process.env.LLM_MODEL_PARSE_CLASSIFY ?? "gpt-4o-mini",
  Number(process.env.SIMULATION_TIMEOUT_MS ?? "30000"),
);
const agentStubs = buildAgentStubs(roles);
const responseBody: SimulationResponse = {
  ...MOCK_SIMULATION_RESPONSE,
  runId: `run_${Date.now()}`,
  status: "completed",
  viz_type,
  path_labels,
  paths: {
    A: { ...MOCK_SIMULATION_RESPONSE.paths.A, agents: agentStubs },
    B: { ...MOCK_SIMULATION_RESPONSE.paths.B, agents: agentStubs },
  },
};
return Response.json(responseBody, { status: 200 });
```

**Keeping KPIs/synthesis from mock is intentional**: the UI tests for Epics 3–5 rely on stable mock data. Story 2.4 replaces KPI and synthesis with real values.

### Error Handling in route.ts

Catch classifier errors separately from the general catch block:

```ts
import {
  classifyDecision,
  ProviderTimeoutError,
  ProviderError,
  ParseError,
} from "@/lib/classifier";

// inside POST(), after validation and env check:
try {
  const classifyResult = await classifyDecision(/* ... */);
  // ... build and return responseBody
} catch (err) {
  if (err instanceof ProviderTimeoutError) {
    return createErrorResponse("PROVIDER_TIMEOUT", "Simulation timed out. Try again.", true, 504);
    // Note: update createErrorResponse to accept recovery options, or inline the response here
  }
  if (err instanceof ProviderError) {
    return createErrorResponse("PROVIDER_ERROR", "Simulation provider unavailable.", true, 502);
  }
  if (err instanceof ParseError) {
    return createErrorResponse("PARSE_ERROR", "Could not interpret simulation result.", true, 502);
  }
  throw err; // re-throw for the outer catch to handle as INTERNAL_ERROR
}
```

**Update `createErrorResponse` to support `recovery` override for these new error codes:**
The current helper always sets `recovery: { canUseCache: false, fallbackViz: false }`. For classify failures the recovery should be `{ canUseCache: true, fallbackViz: true }`. Either update the helper signature or inline the recovery field in these specific catch blocks.

### Testing Pattern

**Mocking `openai` in `classifier.test.ts`:**
```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("openai", () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate, // expose for test control
  };
});

// Then in tests:
import OpenAI from "openai";
const mockCreate = (OpenAI as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
```

Alternative simpler approach — mock at the function level using `vi.spyOn` on the module after import.

**Mocking `classifyDecision` in `route.test.ts`:**
```ts
vi.mock("@/lib/classifier", () => ({
  classifyDecision: vi.fn(),
  ProviderTimeoutError: class extends Error { constructor() { super(); this.name = "ProviderTimeoutError"; } },
  ProviderError: class extends Error { constructor() { super(); this.name = "ProviderError"; } },
  ParseError: class extends Error { constructor() { super(); this.name = "ParseError"; } },
}));
import { classifyDecision } from "@/lib/classifier";
const mockClassify = classifyDecision as ReturnType<typeof vi.fn>;
```

Then control outcomes per test:
```ts
mockClassify.mockResolvedValueOnce({
  path_labels: { A: "Option A", B: "Option B" },
  viz_type: "flow",
  roles: AGENT_ROLES.flow,
});
```

### File Structure Boundaries

**New files (create):**
- `src/lib/classifier.ts` — parse/classify service, typed error classes, `ClassifyResult` interface
- `src/lib/classifier.test.ts` — unit tests, mock OpenAI module

**Modified files:**
- `src/app/api/simulate/route.ts` — integrate classify call, handle new error types
- `src/app/api/simulate/route.test.ts` — extend with classify-scenario tests

**Do NOT touch:**
- `src/lib/types.ts` — all types needed (`VizType`, `AGENT_ROLES`, `SimulationRequest`, `AgentOutput`, `SimulationResponse`) already exist; import only
- `src/lib/mock-fixture.ts` — use `MOCK_SIMULATION_RESPONSE` as spread base; do not modify
- `src/app/api/simulate/validate.ts` — no changes needed; validation is Story 2.1's domain
- `src/app/api/simulate/rate-limit.ts` — no changes needed
- Any Epic 1 files (components, page, layout, integration-contracts)

### Environment Variables Used in This Story

All already configured in `.env.local` and `.env.example` by Story 2.1:

| Variable | Usage |
|---|---|
| `LLM_API_KEY` | OpenAI API key; already guarded by 503 check in route.ts |
| `LLM_MODEL_PARSE_CLASSIFY` | Model for classify call (default: `gpt-4o-mini`) |
| `SIMULATION_TIMEOUT_MS` | Timeout for LLM call (default: `30000`; parse to `Number`) |

`LLM_MODEL_AGENT` and `LLM_MODEL_SYNTHESIS` are NOT used in this story — they belong to Stories 2.3 and 2.4.

### Scope Boundaries — Do NOT Implement

- Agent LLM calls (Story 2.3 — `lib/agents.ts`)
- Path synthesis and KPI assembly (Story 2.4)
- SSE/streaming progress updates (out of scope for Epic 2)
- Client-side fetch wiring (Epic 6)
- MapView / Mapbox integration (Epic 4)

### Previous Story Intelligence (Story 2.1)

- **Route pattern:** `export async function POST(request: NextRequest): Promise<Response>` — no default export, no `"use client"`. Keep exactly.
- **Error helper:** `createErrorResponse(code, message, recoverable, httpStatus)` defined at top of `route.ts` — reuse it, potentially extend its recovery options signature.
- **IP extraction:** `getClientIp(request)` already handles `x-forwarded-for` — no changes needed.
- **Test pattern:** Direct route handler invocation with `new Request(...)` — see `route.test.ts` existing tests for the exact pattern.
- **TypeScript alias:** `@/` maps to `src/` — confirmed working.
- **Deferred from 2.1:** `decision` field stored untrimmed in validated data. Decision arrives with potential whitespace to the classifier. The `buildUserPrompt` function should trim the decision string before inserting into the prompt.
- **Vitest mocking:** Use `vi.mock()` at the top of the test file (hoisted), before imports. Vitest hoists `vi.mock` calls automatically.

### Architecture Compliance

- `viz_type` is **backend-owned** (ADR-04) — the classifier is the only place this gets set. No UI logic infers viz_type from the decision text.
- Prompt logic stays **server-side** in `lib/classifier.ts` — no prompt strings in route handler or client components.
- The single LLM call budget for this story: **1 call** (parse + classify combined). Total budget for full run remains ~11 calls (1 classify + 8 agents + 2 synthesis per architecture §8).
- Secrets stay server-side: `apiKey` is read from `process.env` in `route.ts` and passed to `classifyDecision` — the function itself never reads `process.env` directly, making it portable and testable.

---

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm install openai`
- `npm run test -- src/lib/classifier.test.ts` (red phase; expected failure before implementation)
- `npm run test -- src/lib/classifier.test.ts src/app/api/simulate/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`

### Completion Notes List

- Implemented `src/lib/classifier.ts` with typed provider/parse errors, OpenAI chat-completions parse/classify call, timeout handling via `AbortSignal.timeout()`, strict JSON field validation, and role resolution from `AGENT_ROLES`.
- Added `src/lib/classifier.test.ts` with mocked `openai` module tests for success, unknown viz fallback to `network`, malformed JSON parse failure, and timeout error classification.
- Integrated classifier execution into `POST /api/simulate` with env-driven model/timeout settings and response composition using real `path_labels`/`viz_type` plus per-path role stubs while preserving fixture KPIs/synthesis/comparison.
- Extended route error handling for `PROVIDER_TIMEOUT`, `PROVIDER_ERROR`, and `PARSE_ERROR` using structured `ErrorResponse` payloads and recovery hints (`canUseCache: true`, `fallbackViz: true`) for classify failures.
- Updated route tests to mock classifier outcomes and verify success payload reflection plus timeout/provider-failure HTTP/error-code behavior, while keeping prior Story 2.1 behavior checks intact.
- Verified all quality gates pass: `npm run lint`, `npm run test`, `npm run build`.

### File List

- `package.json` (modified)
- `package-lock.json` (modified)
- `src/lib/classifier.ts` (new)
- `src/lib/classifier.test.ts` (new)
- `src/app/api/simulate/route.ts` (modified)
- `src/app/api/simulate/route.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/2-2-decision-parser-classifier-agent-role-resolution.md` (modified)

### Change Log

- 2026-03-25: Implemented Story 2.2 classifier service, route integration, tests, and quality gate validation.

### Review Findings

- [x] [Review][Patch] Missing route test for `ParseError → 502 PARSE_ERROR` [`src/app/api/simulate/route.test.ts`]
- [x] [Review][Patch] Empty-string path labels not validated before return [`src/lib/classifier.ts:104–112`]

---

**Story completion status**

- Status: **done**
