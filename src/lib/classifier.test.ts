import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES, type SimulationRequest } from "@/lib/types";
import {
  classifyDecision,
  ParseError,
  ProviderTimeoutError,
} from "@/lib/classifier";

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

describe("classifyDecision", () => {
  const context: SimulationRequest["context"] = {
    industry: "Retail",
    location: "Madrid",
  };

  beforeEach(() => {
    mockCreate.mockReset();
    MockOpenAI.mockClear();
  });

  it("returns path labels, viz type, and roles for valid response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              path_a: "Open second location",
              path_b: "Invest in online ads",
              viz_type: "flow",
            }),
          },
        },
      ],
    });

    const result = await classifyDecision("Which growth path should we pick?", context, "test-key", "gpt-test", 1000);

    expect(result.path_labels).toEqual({
      A: "Open second location",
      B: "Invest in online ads",
    });
    expect(result.viz_type).toBe("flow");
    expect(result.roles).toEqual(AGENT_ROLES.flow);
  });

  it('defaults unknown viz_type to "network"', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              path_a: "Open second location",
              path_b: "Invest in online ads",
              viz_type: "unknown",
            }),
          },
        },
      ],
    });

    const result = await classifyDecision("Test decision", context, "test-key", "gpt-test", 1000);

    expect(result.viz_type).toBe("network");
    expect(result.roles).toEqual(AGENT_ROLES.network);
  });

  it("throws ParseError on malformed JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "{not valid json",
          },
        },
      ],
    });

    await expect(
      classifyDecision("Test decision", context, "test-key", "gpt-test", 1000),
    ).rejects.toBeInstanceOf(ParseError);
  });

  it("throws ParseError when LLM returns an empty path label", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              path_a: "",
              path_b: "Invest in online ads",
              viz_type: "flow",
            }),
          },
        },
      ],
    });

    await expect(
      classifyDecision("Test decision", context, "test-key", "gpt-test", 1000),
    ).rejects.toBeInstanceOf(ParseError);
  });

  it("throws ProviderTimeoutError when provider call times out", async () => {
    const timeoutError = new Error("Request timed out");
    timeoutError.name = "TimeoutError";
    mockCreate.mockRejectedValueOnce(timeoutError);

    await expect(
      classifyDecision("Test decision", context, "test-key", "gpt-test", 1000),
    ).rejects.toBeInstanceOf(ProviderTimeoutError);
  });
});
