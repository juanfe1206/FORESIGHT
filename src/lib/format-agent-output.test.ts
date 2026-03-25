import { describe, expect, it } from "vitest";
import {
  formatAgentGroundingLabel,
  formatConfidencePercent,
  summarizeGroundingDistribution,
} from "./format-agent-output";
import type { AgentOutput } from "./types";

describe("format-agent-output", () => {
  it("formatConfidencePercent clamps and rounds", () => {
    expect(formatConfidencePercent(0.724)).toBe("72%");
    expect(formatConfidencePercent(1.5)).toBe("100%");
    expect(formatConfidencePercent(-0.1)).toBe("0%");
  });

  it("formatAgentGroundingLabel returns readable labels", () => {
    expect(formatAgentGroundingLabel("supplied")).toContain("inputs");
    expect(formatAgentGroundingLabel("mixed")).toContain("Mixed");
    expect(formatAgentGroundingLabel("assumed").toLowerCase()).toContain("assumed");
  });

  it("summarizeGroundingDistribution uses only real agent rows", () => {
    const agents: AgentOutput[] = [
      { role: "a", insight: "", confidence: 0.5, grounding: "supplied" },
      { role: "b", insight: "", confidence: 0.5, grounding: "supplied" },
      { role: "c", insight: "", confidence: 0.5, grounding: "mixed" },
      { role: "d", insight: "", confidence: 0.5, grounding: "assumed" },
    ];
    const line = summarizeGroundingDistribution(agents, "Plan A");
    expect(line).toContain("Plan A");
    expect(line).toContain("2");
    expect(line).toContain("1");
  });
});
