import { describe, expect, it } from "vitest";
import { AGENT_ROLES } from "@/lib/types";
import type { PathData } from "@/lib/types";
import { buildFlowVizModel, clamp01, FLOW_VIZ_SCALING } from "./flowVizModel";

const fixedPathData: PathData = {
  agents: [
    { role: AGENT_ROLES.flow[0], insight: "a", confidence: 0.8, grounding: "supplied" },
    { role: AGENT_ROLES.flow[1], insight: "b", confidence: 0.7, grounding: "mixed" },
    { role: AGENT_ROLES.flow[2], insight: "c", confidence: 0.75, grounding: "mixed" },
    { role: AGENT_ROLES.flow[3], insight: "d", confidence: 0.72, grounding: "mixed" },
  ],
  synthesis: {
    summary: "Test synthesis line.",
    timeline: [],
  },
  kpis: {
    revenueImpact: 12,
    risk: 40,
    customerImpact: 30,
    operatingCosts: 420,
    competitiveExposure: 55,
    opportunityCost: "x",
    overallScore: 67,
  },
};

describe("clamp01", () => {
  it("clamps to [0, 1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });
});

describe("buildFlowVizModel", () => {
  it("produces deterministic structure for fixed PathData", () => {
    const a = buildFlowVizModel(fixedPathData);
    const b = buildFlowVizModel(fixedPathData);
    expect(a).toEqual(b);
  });

  it("maps four channels with labels from agents", () => {
    const m = buildFlowVizModel(fixedPathData);
    expect(m.channels).toHaveLength(4);
    expect(m.channels.map((c) => c.label)).toEqual([
      AGENT_ROLES.flow[0],
      AGENT_ROLES.flow[1],
      AGENT_ROLES.flow[2],
      AGENT_ROLES.flow[3],
    ]);
    expect(m.channels[0].particleDurationSec).toBeGreaterThanOrEqual(2);
    expect(m.channels[0].particleDurationSec).toBeLessThanOrEqual(4);
  });

  it("derives resource display from KPI scaling", () => {
    const m = buildFlowVizModel(fixedPathData);
    const expected = Math.round(
      FLOW_VIZ_SCALING.resourceEuroBase + fixedPathData.kpis.operatingCosts * FLOW_VIZ_SCALING.resourceEuroPerOpCost,
    );
    expect(m.resource.displayAmount).toBe(`€${expected}`);
    expect(m.resource.fill).toBeCloseTo(0.67, 2);
  });

  it("maps leak intensity from risk and competitive exposure", () => {
    const m = buildFlowVizModel(fixedPathData);
    expect(m.leak.intensity).toBeGreaterThan(0);
    expect(m.leak.intensity).toBeLessThanOrEqual(1);
  });

  it("falls back to AGENT_ROLES.flow when agent missing", () => {
    const sparse: PathData = {
      ...fixedPathData,
      agents: fixedPathData.agents.slice(0, 2),
    };
    const m = buildFlowVizModel(sparse);
    expect(m.channels[2].label).toBe(AGENT_ROLES.flow[2]);
    expect(m.channels[3].label).toBe(AGENT_ROLES.flow[3]);
  });
});
