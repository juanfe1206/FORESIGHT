import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES } from "@/lib/types";

const { mockClassifyDecision, MockProviderTimeoutError, MockProviderError, MockParseError } =
  vi.hoisted(() => {
    const classify = vi.fn();
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

    return {
      mockClassifyDecision: classify,
      MockProviderTimeoutError: ProviderTimeoutError,
      MockProviderError: ProviderError,
      MockParseError: ParseError,
    };
  });

vi.mock("@/lib/classifier", () => ({
  classifyDecision: mockClassifyDecision,
  ProviderTimeoutError: MockProviderTimeoutError,
  ProviderError: MockProviderError,
  ParseError: MockParseError,
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
  const originalTimeout = process.env.SIMULATION_TIMEOUT_MS;

  beforeEach(() => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_MODEL_PARSE_CLASSIFY = "gpt-4o-mini";
    process.env.SIMULATION_TIMEOUT_MS = "30000";
    mockClassifyDecision.mockReset();
    mockClassifyDecision.mockResolvedValue({
      path_labels: { A: "Option A", B: "Option B" },
      viz_type: "flow",
      roles: AGENT_ROLES.flow,
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
