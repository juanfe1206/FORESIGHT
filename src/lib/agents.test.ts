import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES, type AgentOutput, type SimulationRequest } from "@/lib/types";
import {
  AgentParseError,
  AgentPartialFailureError,
  AgentTimeoutError,
  runParallelAgents,
} from "@/lib/agents";

const { mockCreate, MockOpenAI } = vi.hoisted(() => {
  const create = vi.fn();
  const OpenAIConstructor = vi.fn(function OpenAIConstructor() {
    return {
      chat: {
        completions: {
          create,
        },
      },
    };
  });

  return {
    mockCreate: create,
    MockOpenAI: OpenAIConstructor,
  };
});

vi.mock("openai", () => ({
  default: MockOpenAI,
}));

const context: SimulationRequest["context"] = {
  industry: "Retail",
  location: "Madrid",
  details: "Considering growth options over the next 6 months.",
};

const makeOutput = (role: string, index: number): AgentOutput => ({
  role,
  insight: `Insight ${index}`,
  confidence: 0.65,
  grounding: "mixed",
});

const makeJsonPayload = (role: string, index: number): string =>
  JSON.stringify(makeOutput(role, index));

const baseInput = {
  pathLabels: { A: "Option A", B: "Option B" },
  roles: AGENT_ROLES.map,
  context,
  apiKey: "test-key",
  model: "gpt-test",
  timeoutMs: 1_000,
  concurrency: 4,
} as const;

describe("runParallelAgents", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    MockOpenAI.mockClear();
  });

  it("returns 8 validated agent outputs split 4/4", async () => {
    const roles = AGENT_ROLES.flow;
    for (let i = 0; i < 8; i += 1) {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: makeJsonPayload(roles[i % 4], i + 1) } }],
      });
    }

    const result = await runParallelAgents({
      pathLabels: {
        A: "Open a second location",
        B: "Invest in digital acquisition",
      },
      roles,
      context,
      apiKey: "test-key",
      model: "gpt-test",
      timeoutMs: 1_000,
      concurrency: 4,
    });

    expect(result.agentsByPath.A).toHaveLength(4);
    expect(result.agentsByPath.B).toHaveLength(4);
    expect(result.agentsByPath.A[0]?.role).toBe(roles[0]);
    expect(result.agentsByPath.B[3]?.role).toBe(roles[3]);
    expect(mockCreate).toHaveBeenCalledTimes(8);
  });

  it("caps parallel provider calls using configured concurrency", async () => {
    const roles = AGENT_ROLES.network;
    let activeCalls = 0;
    let maxConcurrent = 0;
    mockCreate.mockImplementation(async () => {
      activeCalls += 1;
      maxConcurrent = Math.max(maxConcurrent, activeCalls);
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      activeCalls -= 1;
      return {
        choices: [{ message: { content: makeJsonPayload("ignored", 1) } }],
      };
    });

    await runParallelAgents({
      ...baseInput,
      roles,
      concurrency: 2,
    });
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("classifies timeout failures", async () => {
    const timeoutError = new Error("timed out");
    timeoutError.name = "TimeoutError";
    let callCount = 0;
    mockCreate.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        throw timeoutError;
      }
      return {
        choices: [{ message: { content: makeJsonPayload("role", callCount) } }],
      };
    });

    await expect(runParallelAgents({ ...baseInput })).rejects.toMatchObject({
      failures: [expect.objectContaining({ path: "A", slot: 1 })],
    });
  });

  it("classifies malformed json as parse failure", async () => {
    let callCount = 0;
    mockCreate.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return { choices: [{ message: { content: "{not-json" } }] };
      }
      return {
        choices: [{ message: { content: makeJsonPayload("role", callCount) } }],
      };
    });

    await expect(runParallelAgents({ ...baseInput })).rejects.toMatchObject({
      failures: [expect.objectContaining({ path: "A", slot: 1 })],
    });
  });

  it("captures partial failures with path and slot metadata", async () => {
    let callCount = 0;
    mockCreate.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error("provider down");
      }
      return {
        choices: [{ message: { content: makeJsonPayload("Role", callCount) } }],
      };
    });

    let capturedError: unknown;
    try {
      await runParallelAgents({ ...baseInput });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(AgentPartialFailureError);
    const partialError = capturedError as AgentPartialFailureError;
    expect(partialError.failures).toContainEqual(
      expect.objectContaining({
        path: "A",
        slot: 2,
        role: AGENT_ROLES.map[1],
      }),
    );
  });

  it("throws parse errors for direct parser validation when required fields are missing", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ insight: "Missing fields" }) } }],
    });
    for (let i = 0; i < 7; i += 1) {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: makeJsonPayload("Role", i + 1) } }],
      });
    }

    await expect(
      runParallelAgents({
        ...baseInput,
      }),
    ).rejects.toBeInstanceOf(AgentPartialFailureError);
  });

  it("exposes timeout class for route mapping", () => {
    const error = new AgentTimeoutError();
    expect(error.name).toBe("AgentTimeoutError");
    expect(error.message).toContain("timed out");
  });

  it("exposes parse class for route mapping", () => {
    const error = new AgentParseError();
    expect(error.name).toBe("AgentParseError");
    expect(error.message).toContain("parsed");
  });
});
