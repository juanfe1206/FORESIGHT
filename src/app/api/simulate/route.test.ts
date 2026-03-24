import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES } from "@/lib/types";

const {
  mockClassifyDecision,
  mockRunParallelAgents,
  MockProviderTimeoutError,
  MockProviderError,
  MockParseError,
  MockAgentPartialFailureError,
} =
  vi.hoisted(() => {
    const classify = vi.fn();
    const runAgents = vi.fn();
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

    return {
      mockClassifyDecision: classify,
      mockRunParallelAgents: runAgents,
      MockProviderTimeoutError: ProviderTimeoutError,
      MockProviderError: ProviderError,
      MockParseError: ParseError,
      MockAgentPartialFailureError: AgentPartialFailureError,
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

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(json.runId).toBeTypeOf("string");
    expect(json.status).toBe("completed");
    expect(json.viz_type).toBe("flow");
    expect(json.path_labels).toEqual({ A: "Option A", B: "Option B" });
    expect(json.paths.A).toBeDefined();
    expect(json.paths.B).toBeDefined();
    expect(json.paths.A.agents).toHaveLength(4);
    expect(json.paths.B.agents).toHaveLength(4);
    expect(json.paths.A.agents[0].insight).toContain("Path A insight");
    expect(mockRunParallelAgents).toHaveBeenCalledTimes(1);
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
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await POST(
        asNextRequest(makeRequest({ decision: `Decision ${attempt}` }, ip)),
      );
      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(
      asNextRequest(makeRequest({ decision: "11th call should be blocked" }, ip)),
    );
    const json = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("RATE_LIMITED");
    expect(json.error.recoverable).toBe(true);
  });
});
