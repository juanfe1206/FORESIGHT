import { describe, expect, it } from "vitest";
import { MOCK_SIMULATION_RESPONSE } from "./mock-fixture";

describe("MOCK_SIMULATION_RESPONSE", () => {
  it("has both paths with 4 agents each", () => {
    expect(MOCK_SIMULATION_RESPONSE.paths.A.agents).toHaveLength(4);
    expect(MOCK_SIMULATION_RESPONSE.paths.B.agents).toHaveLength(4);
  });
  it("has all KPI fields on both paths", () => {
    const fields = [
      "revenueImpact",
      "risk",
      "customerImpact",
      "operatingCosts",
      "competitiveExposure",
      "opportunityCost",
      "overallScore",
    ] as const;
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
