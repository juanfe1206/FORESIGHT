import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentOutput } from "@/lib/types";
import {
  SynthesisParseError,
  SynthesisProviderError,
  SynthesisTimeoutError,
  SynthesisValidationError,
  synthesizePath,
} from "@/lib/synthesis";

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

const agentsA: AgentOutput[] = [
  { role: "Customer", insight: "A customer signal", confidence: 0.7, grounding: "mixed" },
  { role: "Competitor", insight: "A competitor pressure", confidence: 0.6, grounding: "assumed" },
  { role: "Market", insight: "A market trend", confidence: 0.8, grounding: "supplied" },
  { role: "Cash Flow", insight: "A cash-flow tradeoff", confidence: 0.65, grounding: "mixed" },
];

const validSynthesisPayload = {
  summary: "Path A is likely to grow demand with moderate execution risk.",
  timeline: [
    { month: 1, narrative: "Preparation phase.", drivers: ["Customer"] },
    { month: 3, narrative: "Early conversion impact.", drivers: ["Customer", "Market"] },
  ],
  kpis: {
    revenueImpact: 21,
    risk: 35,
    customerImpact: 42,
    operatingCosts: 510,
    competitiveExposure: 33,
    opportunityCost: "Partnership-led local foot traffic is delayed.",
    overallScore: 73,
  },
};

describe("synthesizePath", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    MockOpenAI.mockClear();
  });

  it("uses only the provided path inputs in the prompt", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(validSynthesisPayload) } }],
    });

    await synthesizePath({
      pathLabel: "Option A only",
      agents: agentsA,
      context: {
        industry: "Retail",
        details: "Expansion scenario over six months.",
      },
      apiKey: "test-key",
      model: "gpt-4o-mini",
      timeoutMs: 1_000,
    });

    const args = mockCreate.mock.calls[0]?.[0];
    const userPrompt = args?.messages?.[1]?.content as string;
    expect(userPrompt).toContain("Option A only");
    expect(userPrompt).toContain("A customer signal");
    expect(userPrompt).not.toContain("B competitor-only signal");
  });

  it("throws parse error for malformed provider JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{broken-json" } }],
    });

    await expect(
      synthesizePath({
        pathLabel: "Option A",
        agents: agentsA,
        context: {},
        apiKey: "test-key",
        model: "gpt-4o-mini",
        timeoutMs: 1_000,
      }),
    ).rejects.toBeInstanceOf(SynthesisParseError);
  });

  it("normalizes KPI bounds and requires non-empty fields", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validSynthesisPayload,
              kpis: {
                ...validSynthesisPayload.kpis,
                revenueImpact: 500,
                risk: -10,
                operatingCosts: -1,
                overallScore: 900,
              },
            }),
          },
        },
      ],
    });

    const result = await synthesizePath({
      pathLabel: "Option A",
      agents: agentsA,
      context: {},
      apiKey: "test-key",
      model: "gpt-4o-mini",
      timeoutMs: 1_000,
    });

    expect(result.kpis.revenueImpact).toBe(100);
    expect(result.kpis.risk).toBe(0);
    expect(result.kpis.operatingCosts).toBe(0);
    expect(result.kpis.overallScore).toBe(100);
  });

  it("rejects invalid timeline shape", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validSynthesisPayload,
              timeline: [{ month: 0, narrative: "", drivers: [] }],
            }),
          },
        },
      ],
    });

    await expect(
      synthesizePath({
        pathLabel: "Option A",
        agents: agentsA,
        context: {},
        apiKey: "test-key",
        model: "gpt-4o-mini",
        timeoutMs: 1_000,
      }),
    ).rejects.toBeInstanceOf(SynthesisValidationError);
  });

  it("rejects duplicate month values in timeline", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validSynthesisPayload,
              timeline: [
                { month: 1, narrative: "First entry.", drivers: ["Customer"] },
                { month: 1, narrative: "Duplicate month.", drivers: ["Market"] },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      synthesizePath({
        pathLabel: "Option A",
        agents: agentsA,
        context: {},
        apiKey: "test-key",
        model: "gpt-4o-mini",
        timeoutMs: 1_000,
      }),
    ).rejects.toBeInstanceOf(SynthesisValidationError);
  });

  it("throws SynthesisTimeoutError when the provider call times out", async () => {
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    mockCreate.mockRejectedValueOnce(timeoutError);

    await expect(
      synthesizePath({
        pathLabel: "Option A",
        agents: agentsA,
        context: {},
        apiKey: "test-key",
        model: "gpt-4o-mini",
        timeoutMs: 1_000,
      }),
    ).rejects.toBeInstanceOf(SynthesisTimeoutError);
  });

  it("throws SynthesisProviderError when the provider returns a non-timeout error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Provider connection refused"));

    await expect(
      synthesizePath({
        pathLabel: "Option A",
        agents: agentsA,
        context: {},
        apiKey: "test-key",
        model: "gpt-4o-mini",
        timeoutMs: 1_000,
      }),
    ).rejects.toBeInstanceOf(SynthesisProviderError);
  });
});
