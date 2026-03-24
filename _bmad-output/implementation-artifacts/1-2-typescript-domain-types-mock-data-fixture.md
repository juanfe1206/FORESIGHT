# Story 1.2: TypeScript Domain Types & Mock Data Fixture

Status: review

## Story

As a developer,
I want shared TypeScript interfaces for the full API contract and a realistic mock response fixture,
So that frontend and backend teams can develop independently against the same data shapes.

## Acceptance Criteria

_trace: FR4, FR5, FR6, FR7, FR8, FR9, FR18 (types); NFR-S1 (server types); ADR-02, ADR-04; Architecture §4_

**Given** a developer imports from `lib/types.ts`
**When** they use the type definitions
**Then** types exist for:
- `SimulationRequest` — decision, context (industry, monthlyRevenue, location, customerBase, details), options (stream, useCachedOnFailure, demoScenarioId)
- `SimulationResponse` — runId, status, viz_type, path_labels, progress (agent_states per path), paths (A + B each with agents/synthesis/kpis), comparison (winnerByKpi, overallWinner), meta
- `AgentOutput` — role, insight, confidence (0–1), grounding
- `PathSynthesis` — summary, timeline (month, narrative, drivers)
- `KPIs` — revenueImpact, risk, customerImpact, operatingCosts, competitiveExposure, opportunityCost, overallScore
- `PathData` — agents, synthesis, kpis
- `ErrorResponse` — runId?, status "error", error (code, message, recoverable), recovery?
- `AGENT_ROLES` — constant mapping each VizType to a tuple of four role label strings
- `VizType` — union: `"map" | "flow" | "network" | "fallback"`
- Supporting scalar unions: `AgentState`, `GroundingLevel`, `RunStatus`

**Given** a developer imports the mock fixture module
**When** they load the default fixture
**Then** at least one complete `SimulationResponse` exists (Map bakery scenario: "Should I invest in Instagram ads or partner with Cafe Central?") with both paths fully populated (4 agents, synthesis with timeline, kpis, comparison)
**And** the fixture is structurally valid at compile time (`satisfies SimulationResponse` or equivalent)
**And** all required fields are present and non-empty

## Tasks / Subtasks

- [x] **Create `src/lib/types.ts`**
  - [x] Define `VizType`, `AgentState`, `GroundingLevel`, `RunStatus` scalar unions
  - [x] Define `SimulationRequest`, `AgentOutput`, `TimelineEntry`, `PathSynthesis`, `KPIs`, `PathData`
  - [x] Define `SimulationResponse`, `ErrorResponse`
  - [x] Define `AGENT_ROLES` const (see exact values in Dev Notes)
- [x] **Create `src/lib/mock-fixture.ts`**
  - [x] Implement bakery scenario `MOCK_SIMULATION_RESPONSE satisfies SimulationResponse`
  - [x] Both paths: 4 agents each (roles from `AGENT_ROLES.map`), synthesis with timeline ≥ 2 entries, kpis fully populated
  - [x] Populate `comparison` (winnerByKpi + overallWinner) and `meta`
- [x] **Create `src/lib/types.test.ts`** — compile-level + runtime checks for AGENT_ROLES shape
- [x] **Create `src/lib/mock-fixture.test.ts`** — verify fixture required fields, agent count, KPI completeness
- [x] **Run `npm run build` + `npm run lint`** clean; confirm no TypeScript errors

---

## Dev Notes

### Stack Reality (Read First)

- **Project root:** `src/app/` (not `app/`). All new files go under `src/lib/`.
- **Actual stack:** Next.js `16.2.1`, React `19.2.x`, TypeScript, Tailwind v4 — planning docs say "Next 14"; treat ADR-01 as "App Router on Vercel", do NOT downgrade.
- **Module alias:** `@/` maps to `src/` (see `tsconfig.json`). Import as `import { ... } from "@/lib/types"`.
- **Vitest** is the test runner (see `vitest.config.ts`). No Jest.

### Existing File to Preserve (Do Not Break)

`src/lib/thin-slice-mock.ts` exports `ThinSliceMockKpis` type and `buildThinSliceMockComparison()`.
`src/components/shell/ThinSliceDemo.tsx` imports that function. **Do not modify or delete either file** — Epic 3 (Story 3.x) owns the component and will update it to use canonical types. Story 1.2 only adds new files.

### Canonical Types for `src/lib/types.ts`

The canonical JSON contract from Architecture §4 drives every type below. Treat this as the source of truth — not the PRD narrative.

```typescript
// Scalar unions
export type VizType = "map" | "flow" | "network" | "fallback";
export type AgentState = "dormant" | "thinking" | "insight" | "complete" | "error";
export type GroundingLevel = "supplied" | "mixed" | "assumed";
export type RunStatus = "completed" | "fallback" | "error";

// Request
export interface SimulationRequest {
  decision: string;
  context: {
    industry?: string;
    monthlyRevenue?: number;
    location?: string;
    customerBase?: string;
    details?: string;
  };
  options?: {
    stream?: boolean;
    useCachedOnFailure?: boolean;
    demoScenarioId?: string;
  };
}

// Per-agent output
export interface AgentOutput {
  role: string;
  insight: string;
  confidence: number;    // 0–1 float
  grounding: GroundingLevel;
}

// Synthesis
export interface TimelineEntry {
  month: number;
  narrative: string;
  drivers: string[];     // role names that drove this month
}

export interface PathSynthesis {
  summary: string;
  timeline: TimelineEntry[];
}

// KPIs — numeric values as stored; display components own formatting/labels
export interface KPIs {
  revenueImpact: number;       // +/- €k/month; e.g. 12 = +€12k/mo
  risk: number;                // 1–100 scale (architecture contract uses 100-pt scale; FR20 "1–10 bar" is a display concern)
  customerImpact: number;      // +/- customer count delta
  operatingCosts: number;      // € total monthly
  competitiveExposure: number; // 0–100 → displayed as Low (<34) / Med (34–66) / High (>66) by KPICard
  opportunityCost: string;     // One-sentence "What You'd Miss" text
  overallScore: number;        // 1–100
}

// Path data
export interface PathData {
  agents: AgentOutput[];
  synthesis: PathSynthesis;
  kpis: KPIs;
}

// Full response
export interface SimulationResponse {
  runId: string;
  status: RunStatus;
  viz_type: VizType;
  path_labels: { A: string; B: string };
  progress: {
    agents_per_path: number;
    agent_states: { A: AgentState[]; B: AgentState[] };
  };
  paths: { A: PathData; B: PathData };
  comparison: {
    winnerByKpi: Partial<Record<keyof KPIs, "A" | "B">>;
    overallWinner: "A" | "B";
  };
  meta: {
    latencyMs: number;
    llmCalls: number;
    estimatedCostEur: number;
    fallbackUsed: boolean;
    cachedReplay: boolean;
    generatedAt: string;    // ISO 8601
    schemaVersion?: string; // for cache validation (Epic 6)
  };
}

// Error response
export interface ErrorResponse {
  runId?: string;
  status: "error";
  error: {
    code: string;       // e.g. "PROVIDER_TIMEOUT", "VALIDATION_ERROR", "PARTIAL_FAILURE"
    message: string;
    recoverable: boolean;
  };
  recovery?: {
    canUseCache: boolean;
    fallbackViz: boolean;
  };
}

// Agent role labels per viz_type — 4-tuple, index matches AgentHUD slot (0=blue, 1=red, 2=green, 3=gold)
export const AGENT_ROLES: Record<VizType, [string, string, string, string]> = {
  map:      ["Customer",        "Competitor",       "Market",         "Cash Flow"],
  flow:     ["Resource Impact", "Opportunity Cost", "Market Timing",  "Cash Flow"],
  network:  ["Stakeholder",     "Partnership",      "Ecosystem",      "Risk-Reward"],
  fallback: ["Analyst",         "Strategist",       "Risk Advisor",   "Financial"],
};
```

#### Key type decisions

| Decision | Rationale |
|----------|-----------|
| `risk` is 0–100 not 1–10 | Architecture JSON shows `58`; FR20 "1–10 bar" is a display formatting concern for KPICard in Story 5.2 |
| `AGENT_ROLES` is a const, not enum | Allows map by VizType string at runtime; consistent with architecture doc "AGENT_ROLES lookup" |
| `schemaVersion` is optional in meta | Cache validation lands in Story 6.2; making it optional prevents breaking types now |
| `fallback` in AGENT_ROLES | FallbackViz (Story 5.4) still renders AgentHUD nodes; needs generic-but-sensible labels |
| Slot index = role index | AGENT_ROLES[vizType][0] → slot 1 (blue), [1] → slot 2 (red), [2] → slot 3 (green), [3] → slot 4 (gold) — UX-DR7 |

### Canonical Mock Fixture for `src/lib/mock-fixture.ts`

Scenario: Madrid bakery, "Should I invest in Instagram ads or partner with Cafe Central?"

```typescript
import type { SimulationResponse } from "./types";
import { AGENT_ROLES } from "./types";

export const MOCK_SIMULATION_RESPONSE: SimulationResponse = {
  runId: "run_mock_bakery_map_v1",
  status: "completed",
  viz_type: "map",
  path_labels: {
    A: "Invest in Instagram ads",
    B: "Partner with Cafe Central",
  },
  progress: {
    agents_per_path: 4,
    agent_states: {
      A: ["complete", "complete", "complete", "complete"],
      B: ["complete", "complete", "complete", "complete"],
    },
  },
  paths: {
    A: {
      agents: [
        { role: AGENT_ROLES.map[0], insight: "Digital reach targets 18–35 demographic, boosting new customer acquisition by ~15%.", confidence: 0.72, grounding: "mixed" },
        { role: AGENT_ROLES.map[1], insight: "Competitors in Malasana already running Instagram; differentiation requires strong visual identity.", confidence: 0.65, grounding: "assumed" },
        { role: AGENT_ROLES.map[2], insight: "Madrid food SMB ad market grows 12% YoY; Instagram CPM remains competitive at €2–4.", confidence: 0.70, grounding: "mixed" },
        { role: AGENT_ROLES.map[3], insight: "Monthly ad spend €300–500 expected; positive ROI only after month 3 as brand awareness builds.", confidence: 0.68, grounding: "mixed" },
      ],
      synthesis: {
        summary: "Instagram investment builds digital brand equity and new customer pipeline within 6 months, but requires consistent creative output and upfront ad spend with delayed ROI.",
        timeline: [
          { month: 1, narrative: "Campaign setup and first creatives. Ad budget deployed, minimal measurable foot traffic lift yet.", drivers: ["Customer", "Cash Flow"] },
          { month: 2, narrative: "Follower growth picks up. First customer conversions tracked via coupon codes; revenue impact modest.", drivers: ["Customer", "Market"] },
          { month: 3, narrative: "Break-even on ad spend. Referrals from engaged followers begin offsetting cost.", drivers: ["Customer", "Cash Flow"] },
          { month: 6, narrative: "Stable new customer cohort of ~30/month. Revenue impact solidifies at +€1.2k/month net.", drivers: ["Customer", "Market", "Cash Flow"] },
        ],
      },
      kpis: {
        revenueImpact: 12,
        risk: 42,
        customerImpact: 30,
        operatingCosts: 420,
        competitiveExposure: 55,
        opportunityCost: "Potential local referral network and physical community presence from a Cafe Central partnership.",
        overallScore: 67,
      },
    },
    B: {
      agents: [
        { role: AGENT_ROLES.map[0], insight: "Shared foot traffic from Cafe Central regulars provides immediate warm-lead introduction, low acquisition cost.", confidence: 0.78, grounding: "supplied" },
        { role: AGENT_ROLES.map[1], insight: "Partnership locks in geographic exclusivity within a 200m radius; reduces immediate competitive threat.", confidence: 0.71, grounding: "mixed" },
        { role: AGENT_ROLES.map[2], insight: "Local cross-referral partnerships in Madrid's Malasana district yield 20–40% faster payback vs solo digital.", confidence: 0.74, grounding: "mixed" },
        { role: AGENT_ROLES.map[3], insight: "Lower upfront cost: minimal ad spend, revenue split or referral fee only on converted customers.", confidence: 0.80, grounding: "supplied" },
      ],
      synthesis: {
        summary: "Partnership with Cafe Central provides immediate warm-customer pipeline with lower upfront cost, but limits geographic expansion and creates dependency on a single partner.",
        timeline: [
          { month: 1, narrative: "Partnership agreement signed. Flyers and co-promotions activate. First referred customers arrive.", drivers: ["Customer", "Cash Flow"] },
          { month: 2, narrative: "Word-of-mouth accelerates. Regular Cafe Central patrons become repeat bakery customers.", drivers: ["Customer", "Market"] },
          { month: 3, narrative: "Revenue contribution stabilizes. Referral conversion rate ~8% of Cafe Central daily traffic.", drivers: ["Customer", "Cash Flow"] },
          { month: 6, narrative: "Steady +€1.8k/month from partnership channel. Low ongoing cost, high community loyalty signal.", drivers: ["Customer", "Market", "Cash Flow"] },
        ],
      },
      kpis: {
        revenueImpact: 18,
        risk: 28,
        customerImpact: 45,
        operatingCosts: 120,
        competitiveExposure: 30,
        opportunityCost: "Broader digital brand awareness and social media presence that Instagram ads would have built.",
        overallScore: 78,
      },
    },
  },
  comparison: {
    winnerByKpi: {
      revenueImpact: "B",
      risk: "B",
      customerImpact: "B",
      operatingCosts: "B",
      competitiveExposure: "B",
      overallScore: "B",
    },
    overallWinner: "B",
  },
  meta: {
    latencyMs: 0,
    llmCalls: 0,
    estimatedCostEur: 0,
    fallbackUsed: false,
    cachedReplay: true,
    generatedAt: "2026-03-24T00:00:00Z",
    schemaVersion: "1.0.0",
  },
};
```

> The fixture uses `AGENT_ROLES.map[n]` for role labels — this guarantees the fixture stays in sync with the canonical constant if labels ever change.

### Testing Requirements

**`src/lib/types.test.ts`:**
```typescript
import { describe, it, expect } from "vitest";
import { AGENT_ROLES } from "./types";
import type { VizType } from "./types";

describe("AGENT_ROLES", () => {
  const VIZ_TYPES: VizType[] = ["map", "flow", "network", "fallback"];
  it("has a 4-tuple for every VizType", () => {
    for (const vt of VIZ_TYPES) {
      expect(AGENT_ROLES[vt]).toHaveLength(4);
      expect(AGENT_ROLES[vt].every((r) => typeof r === "string" && r.length > 0)).toBe(true);
    }
  });
});
```

**`src/lib/mock-fixture.test.ts`:**
```typescript
import { describe, it, expect } from "vitest";
import { MOCK_SIMULATION_RESPONSE } from "./mock-fixture";

describe("MOCK_SIMULATION_RESPONSE", () => {
  it("has both paths with 4 agents each", () => {
    expect(MOCK_SIMULATION_RESPONSE.paths.A.agents).toHaveLength(4);
    expect(MOCK_SIMULATION_RESPONSE.paths.B.agents).toHaveLength(4);
  });
  it("has all KPI fields on both paths", () => {
    const fields = ["revenueImpact", "risk", "customerImpact", "operatingCosts",
                    "competitiveExposure", "opportunityCost", "overallScore"] as const;
    for (const f of fields) {
      expect(MOCK_SIMULATION_RESPONSE.paths.A.kpis).toHaveProperty(f);
      expect(MOCK_SIMULATION_RESPONSE.paths.B.kpis).toHaveProperty(f);
    }
  });
  it("has synthesis timeline entries on both paths", () => {
    expect(MOCK_SIMULATION_RESPONSE.paths.A.synthesis.timeline.length).toBeGreaterThanOrEqual(2);
    expect(MOCK_SIMULATION_RESPONSE.paths.B.synthesis.timeline.length).toBeGreaterThanOrEqual(2);
  });
  it("has a valid overallWinner", () => {
    expect(["A", "B"]).toContain(MOCK_SIMULATION_RESPONSE.comparison.overallWinner);
  });
});
```

> TypeScript compile-time correctness is implicit: `MOCK_SIMULATION_RESPONSE: SimulationResponse` (or `satisfies SimulationResponse`) will fail to build if the fixture doesn't match the types.

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| `lib/types.ts` synchronized with prompt contracts (Additional Requirements) | All types derive from canonical JSON in Architecture §4 |
| `viz_type` backend-owned, stable routing decision (ADR-04) | `VizType` union is typed identically on client and server |
| `AGENT_ROLES` lookup drives AgentHUD slot labels (UX-DR7) | `AGENT_ROLES` const exported from `types.ts`; role index = slot index |
| Output schema validation before client caching/render (§7) | `SimulationResponse` type enables `satisfies` guard at parse boundary |
| Secrets only server-side (NFR-S1) | No env-var access in `types.ts` or `mock-fixture.ts`; these are pure type/data files |

### File Touch List

| File | Action | Owner |
|------|--------|-------|
| `src/lib/types.ts` | CREATE | Story 1.2 |
| `src/lib/mock-fixture.ts` | CREATE | Story 1.2 |
| `src/lib/types.test.ts` | CREATE | Story 1.2 |
| `src/lib/mock-fixture.test.ts` | CREATE | Story 1.2 |
| `src/lib/thin-slice-mock.ts` | **DO NOT TOUCH** | Epic 3 owns migration |
| `src/components/shell/ThinSliceDemo.tsx` | **DO NOT TOUCH** | Epic 3 owns |
| `package.json` | No new deps needed | — |

### Cross-Story Context

- **Story 1.3** (Application State Machine) will import `VizType`, `RunStatus`, and `SimulationResponse` from `lib/types.ts`. The state shape in 1.3 (`uiStage`, `runStatus`, `vizType`) is distinct from the API contract types here.
- **Story 1.4** (Integration Contract) will reference these types as the source-of-truth for cross-epic contracts.
- **Epic 2 (Dev 2)** backend: uses `SimulationRequest` for route validation, `SimulationResponse` for response building, `AGENT_ROLES` for role label resolution.
- **Epic 3 (Dev 1)** frontend: after Story 3.x, `ThinSliceDemo.tsx` should be refactored to use `MOCK_SIMULATION_RESPONSE` from `mock-fixture.ts` rather than `thin-slice-mock.ts`. That migration happens in Epic 3, not here.
- **Epic 5 (Dev 4)** dashboard: `KPICard`, `ScoreRing`, `AgentHUD` all consume `KPIs`, `PathData`, `SimulationResponse` shapes from `lib/types.ts`. The `risk` field is 1–100 in the type; KPICard renders it as a "1–10 bar" by dividing by 10.
- **Epic 6**: `schemaVersion` in `meta` is already typed (optional) to prevent breaking changes when cache validation lands.

### Previous Story Intelligence (from Story 1.1)

| Learning | Impact on 1.2 |
|----------|---------------|
| `src/` prefix on all source paths (not `app/` at root) | New files go in `src/lib/`, imports use `@/lib/` |
| Vitest + RTL is the test stack; no Jest | Use `vitest` in test files, not `jest` |
| `"use client"` only on components using React hooks/motion | `lib/types.ts` and `lib/mock-fixture.ts` are pure TS, no directive needed |
| Framer Motion `MotionConfig reducedMotion="user"` pattern | Not relevant — no UI components in this story |
| No dead state or unused exports | Only export what downstream consumers actually need |
| `satisfies` keyword available (TypeScript ≥ 4.9, in use in thin-slice-mock.ts) | Use `satisfies SimulationResponse` in fixture for compile-time check |

### Verification Checklist

- [x] `npx tsc --noEmit` passes — no type errors (via `next build` TypeScript step)
- [x] `npm run lint` clean
- [x] `npm run test` passes — all 4 new test cases green
- [x] `npm run build` clean — no bundle errors
- [x] `import { SimulationResponse, AGENT_ROLES } from "@/lib/types"` resolves correctly in a scratch file test
- [x] `MOCK_SIMULATION_RESPONSE.paths.A.agents.length === 4` at runtime in test

---

## Dev Agent Record

### Agent Model Used
Cursor agent (Claude) — bmad-dev-story workflow

### Debug Log References
None.

### Completion Notes List
- Added `src/lib/types.ts` with full API contract types per Architecture §4 and canonical `AGENT_ROLES`.
- Added `src/lib/mock-fixture.ts` with Madrid bakery map scenario; `MOCK_SIMULATION_RESPONSE` uses `satisfies SimulationResponse` for compile-time structural validation.
- Added Vitest suites `types.test.ts` (AGENT_ROLES 4-tuples) and `mock-fixture.test.ts` (agents, KPI fields, timelines, overallWinner).
- `npm run test`, `npm run lint`, and `npm run build` all pass. Did not modify `thin-slice-mock.ts` or `ThinSliceDemo.tsx` per story guardrails.

### File List
- `src/lib/types.ts` (created)
- `src/lib/mock-fixture.ts` (created)
- `src/lib/types.test.ts` (created)
- `src/lib/mock-fixture.test.ts` (created)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — story status)
- `_bmad-output/implementation-artifacts/1-2-typescript-domain-types-mock-data-fixture.md` (modified — completion)

## Change Log

- **2026-03-24:** Story 1.2 created — TypeScript domain types and canonical mock fixture for parallel team unblocking.
- **2026-03-25:** Implementation complete — types, mock fixture, Vitest coverage; build/lint/test green; status → review.

---

**Story completion status**

- Status: **review**
- Note: Ready for code review; all tasks and verification checklist items complete.
