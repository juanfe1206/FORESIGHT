import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES } from "@/lib/types";
import { DEMO_SCENARIOS } from "@/lib/demo-scenarios";

const {
  mockClassifyDecision,
  mockRunParallelAgents,
  mockSynthesizePath,
  MockProviderTimeoutError,
  MockProviderError,
  MockParseError,
  MockAgentPartialFailureError,
  MockSynthesisTimeoutError,
  MockSynthesisProviderError,
  MockSynthesisParseError,
  MockSynthesisValidationError,
} =
  vi.hoisted(() => {
    const classify = vi.fn();
    const runAgents = vi.fn();
    const synthesize = vi.fn();
    class ProviderTimeoutError extends Error {
      constructor(message = "LLM provider timed out.") {
        super(message);
        this.name = "ProviderTimeoutError";
      }
    }

    class ProviderError extends Error {
      constructor(message = "LLM provider returned an error.") {
        super(message);
        this.name = "ProviderError";
      }
    }

    class ParseError extends Error {
      constructor(message = "LLM response could not be parsed.") {
        super(message);
        this.name = "ParseError";
      }
    }

    class AgentPartialFailureError extends Error {
      failures: Array<Record<string, unknown>>;

      constructor(
        failures: Array<Record<string, unknown>> = [{ path: "A", slot: 1, role: "Role", reason: "failed" }],
      ) {
        super("One or more agent slots failed.");
        this.name = "AgentPartialFailureError";
        this.failures = failures;
      }
    }

    class SynthesisParseError extends Error {
      constructor(message = "Synthesis response could not be parsed.") {
        super(message);
        this.name = "SynthesisParseError";
      }
    }

    class SynthesisTimeoutError extends Error {
      constructor(message = "Synthesis execution timed out.") {
        super(message);
        this.name = "SynthesisTimeoutError";
      }
    }

    class SynthesisProviderError extends Error {
      constructor(message = "Synthesis provider returned an error.") {
        super(message);
        this.name = "SynthesisProviderError";
      }
    }

    class SynthesisValidationError extends Error {
      constructor(message = "Synthesis response failed validation.") {
        super(message);
        this.name = "SynthesisValidationError";
      }
    }

    return {
      mockClassifyDecision: classify,
      mockRunParallelAgents: runAgents,
      mockSynthesizePath: synthesize,
      MockProviderTimeoutError: ProviderTimeoutError,
      MockProviderError: ProviderError,
      MockParseError: ParseError,
      MockAgentPartialFailureError: AgentPartialFailureError,
      MockSynthesisTimeoutError: SynthesisTimeoutError,
      MockSynthesisProviderError: SynthesisProviderError,
      MockSynthesisParseError: SynthesisParseError,
      MockSynthesisValidationError: SynthesisValidationError,
    };
  });

vi.mock("@/lib/classifier", () => ({
  classifyDecision: mockClassifyDecision,
  ProviderTimeoutError: MockProviderTimeoutError,
  ProviderError: MockProviderError,
  ParseError: MockParseError,
}));

vi.mock("@/lib/agents", () => ({
  runParallelAgents: mockRunParallelAgents,
  AgentPartialFailureError: MockAgentPartialFailureError,
}));

vi.mock("@/lib/synthesis", () => ({
  synthesizePath: mockSynthesizePath,
  SynthesisTimeoutError: MockSynthesisTimeoutError,
  SynthesisProviderError: MockSynthesisProviderError,
  SynthesisParseError: MockSynthesisParseError,
  SynthesisValidationError: MockSynthesisValidationError,
}));

import type { NextRequest } from "next/server";
import { POST } from "./route";

const makeRequest = (body: unknown, ip = "127.0.0.1") =>
  new Request("http://localhost/api/simulate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });

describe("POST /api/simulate", () => {
  const originalEnv = process.env.LLM_API_KEY;
  const originalModel = process.env.LLM_MODEL_PARSE_CLASSIFY;
  const originalAgentModel = process.env.LLM_MODEL_AGENT;
  const originalConcurrency = process.env.AGENT_CONCURRENCY_LIMIT;
  const originalTimeout = process.env.SIMULATION_TIMEOUT_MS;

  beforeEach(() => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_MODEL_PARSE_CLASSIFY = "gpt-4o-mini";
    process.env.LLM_MODEL_AGENT = "gpt-4o-mini";
    process.env.AGENT_CONCURRENCY_LIMIT = "4";
    process.env.SIMULATION_TIMEOUT_MS = "30000";
    mockClassifyDecision.mockReset();
    mockRunParallelAgents.mockReset();
    mockSynthesizePath.mockReset();
    mockClassifyDecision.mockResolvedValue({
      path_labels: { A: "Option A", B: "Option B" },
      viz_type: "flow",
      roles: AGENT_ROLES.flow,
    });
    mockRunParallelAgents.mockResolvedValue({
      agentsByPath: {
        A: AGENT_ROLES.flow.map((role, index) => ({
          role,
          insight: `Path A insight ${index + 1}`,
          confidence: 0.6,
          grounding: "mixed",
        })),
        B: AGENT_ROLES.flow.map((role, index) => ({
          role,
          insight: `Path B insight ${index + 1}`,
          confidence: 0.7,
          grounding: "supplied",
        })),
      },
    });
    mockSynthesizePath.mockImplementation(async ({ pathLabel }: { pathLabel: string }) => {
      if (pathLabel === "Option A") {
        return {
          synthesis: {
            summary: "Path A synthesized summary",
            timeline: [
              { month: 1, narrative: "A month 1", drivers: ["Customer"] },
              { month: 3, narrative: "A month 3", drivers: ["Market"] },
            ],
          },
          kpis: {
            revenueImpact: 10,
            risk: 38,
            customerImpact: 22,
            operatingCosts: 420,
            competitiveExposure: 44,
            opportunityCost: "Loses partner channel speed.",
            overallScore: 62,
          },
          telemetry: {
            llmCalls: 1,
            estimatedCostEur: 0.018,
          },
        };
      }
      return {
        synthesis: {
          summary: "Path B synthesized summary",
          timeline: [
            { month: 1, narrative: "B month 1", drivers: ["Customer"] },
            { month: 3, narrative: "B month 3", drivers: ["Market"] },
          ],
        },
        kpis: {
          revenueImpact: 16,
          risk: 28,
          customerImpact: 31,
          operatingCosts: 180,
          competitiveExposure: 29,
          opportunityCost: "Loses digital ad learning.",
          overallScore: 74,
        },
        telemetry: {
          llmCalls: 1,
          estimatedCostEur: 0.018,
        },
      };
    });
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.LLM_API_KEY;
    } else {
      process.env.LLM_API_KEY = originalEnv;
    }

    if (originalModel === undefined) {
      delete process.env.LLM_MODEL_PARSE_CLASSIFY;
    } else {
      process.env.LLM_MODEL_PARSE_CLASSIFY = originalModel;
    }

    if (originalAgentModel === undefined) {
      delete process.env.LLM_MODEL_AGENT;
    } else {
      process.env.LLM_MODEL_AGENT = originalAgentModel;
    }

    if (originalConcurrency === undefined) {
      delete process.env.AGENT_CONCURRENCY_LIMIT;
    } else {
      process.env.AGENT_CONCURRENCY_LIMIT = originalConcurrency;
    }

    if (originalTimeout === undefined) {
      delete process.env.SIMULATION_TIMEOUT_MS;
      return;
    }
    process.env.SIMULATION_TIMEOUT_MS = originalTimeout;
  });

  const asNextRequest = (request: Request): NextRequest => request as unknown as NextRequest;

  it("returns 200 with SimulationResponse shape for valid input", async () => {
    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we expand to a second location?" }, "10.0.0.1")),
    );
    const json = await response.json();

    const expectedAgentCount = AGENT_ROLES.flow.length;

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(json.runId).toBeTypeOf("string");
    expect(json.status).toBe("completed");
    expect(json.viz_type).toBe("flow");
    expect(json.path_labels).toEqual({ A: "Option A", B: "Option B" });
    expect(json.paths.A).toBeDefined();
    expect(json.paths.B).toBeDefined();
    expect(json.paths.A.agents).toHaveLength(expectedAgentCount);
    expect(json.paths.B.agents).toHaveLength(expectedAgentCount);
    expect(json.progress.agents_per_path).toBe(4);
    expect(json.progress.agent_states.A).toHaveLength(expectedAgentCount);
    expect(json.progress.agent_states.B).toHaveLength(expectedAgentCount);
    expect(json.progress.agent_states.A).toEqual(expect.arrayContaining(["complete"]));
    expect(json.progress.agent_states.B).toEqual(expect.arrayContaining(["complete"]));
    expect(json.paths.A.agents[0].insight).toContain("Path A insight");
    expect(json.paths.A.synthesis.summary).toBe("Path A synthesized summary");
    expect(json.paths.B.synthesis.summary).toBe("Path B synthesized summary");
    expect(json.comparison.winnerByKpi.revenueImpact).toBe("B");
    expect(json.comparison.overallWinner).toBe("B");
    expect(json.meta.llmCalls).toBe(11);
    expect(json.meta.cachedReplay).toBe(false);
    expect(mockRunParallelAgents).toHaveBeenCalledTimes(1);
    expect(mockSynthesizePath).toHaveBeenCalledTimes(2);
  });

  it("returns 400 for missing decision", async () => {
    const response = await POST(
      asNextRequest(makeRequest({ context: { industry: "retail" } }, "10.0.0.2")),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.recoverable).toBe(false);
    expect(json.recovery).toEqual({ canUseCache: false, fallbackViz: false });
  });

  it("returns 400 when decision exceeds 2000 chars", async () => {
    const response = await POST(asNextRequest(makeRequest({ decision: "a".repeat(2001) }, "10.0.0.3")));

    expect(response.status).toBe(400);
  });

  it("returns 503 when LLM_API_KEY is not set", async () => {
    delete process.env.LLM_API_KEY;

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we launch a referral program?" }, "10.0.0.4")),
    );
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("MISSING_CONFIG");
    expect(json.error.recoverable).toBe(false);
  });

  it("returns 504 when classifier times out", async () => {
    mockClassifyDecision.mockRejectedValueOnce(new MockProviderTimeoutError());

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we launch in Lisbon?" }, "10.0.0.41")),
    );
    const json = await response.json();

    expect(response.status).toBe(504);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("PROVIDER_TIMEOUT");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });
  });

  it("forces a controlled ProviderTimeoutError for Demo 3 (network) to exercise fallback", async () => {
    mockClassifyDecision.mockResolvedValueOnce({
      path_labels: { A: "Option A", B: "Option B" },
      viz_type: "network",
      roles: AGENT_ROLES.network,
    });

    const response = await POST(
      asNextRequest(
        makeRequest(
          {
            decision: "Partner with Hola Coffee Roasters for a co-branded subscription box vs launch a solo online bean store with in-house roasting brand",
            context: { industry: "Specialty coffee roaster-café", location: "Calle de Embajadores 3, Lavapiés, Madrid", monthlyRevenue: 9200 },
            options: { demoScenarioId: DEMO_SCENARIOS["demo-network-v1"].id },
          },
          "10.0.0.46",
        ),
      ),
    );

    const json = await response.json();

    expect(response.status).toBe(504);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("PROVIDER_TIMEOUT");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });

    // The forced timeout is applied after classification, so no agent/synthesis work should run.
    expect(mockRunParallelAgents).not.toHaveBeenCalled();
    expect(mockSynthesizePath).not.toHaveBeenCalled();
  });

  it("returns 502 when classifier provider fails", async () => {
    mockClassifyDecision.mockRejectedValueOnce(new MockProviderError());

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we hire 2 more engineers?" }, "10.0.0.42")),
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("PROVIDER_ERROR");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });
  });

  it("returns 502 when classifier cannot parse the LLM response", async () => {
    mockClassifyDecision.mockRejectedValueOnce(new MockParseError());

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we outsource our support?" }, "10.0.0.43")),
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("PARSE_ERROR");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });
  });

  it("returns 502 with metadata when agent execution has partial failures", async () => {
    mockRunParallelAgents.mockRejectedValueOnce(
      new MockAgentPartialFailureError([
        { path: "A", slot: 2, role: "Opportunity Cost", reason: "Agent slot A-2 timed out." },
      ]),
    );

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we outsource our support?" }, "10.0.0.44")),
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("PARTIAL_AGENT_FAILURE");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });
    expect(json.error.details.failures).toEqual([
      { path: "A", slot: 2, role: "Opportunity Cost", reason: "Agent slot A-2 timed out." },
    ]);
  });

  it("returns 429 when a single IP exceeds the rate limit", async () => {
    const ip = "10.0.0.5";
    // Aligned with rate-limit.ts: MAX_REQUESTS per 60s window (currently 30).
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await POST(
        asNextRequest(makeRequest({ decision: `Decision ${attempt}` }, ip)),
      );
      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(
      asNextRequest(makeRequest({ decision: "31st call should be blocked" }, ip)),
    );
    const json = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("RATE_LIMITED");
    expect(json.error.recoverable).toBe(true);
  });

  it("returns 502 when synthesis parsing fails", async () => {
    mockSynthesizePath.mockReset();
    mockSynthesizePath.mockRejectedValue(new MockSynthesisParseError());

    const response = await POST(
      asNextRequest(makeRequest({ decision: "Should we open a new channel?" }, "10.0.0.45")),
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("SYNTHESIS_PARSE_ERROR");
    expect(json.error.recoverable).toBe(true);
    expect(json.recovery).toEqual({ canUseCache: true, fallbackViz: true });
  });
});
