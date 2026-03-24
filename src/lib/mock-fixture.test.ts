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

  it("keeps required string and timeline fields non-empty", () => {
    expect(MOCK_SIMULATION_RESPONSE.runId.trim().length).toBeGreaterThan(0);
    expect(MOCK_SIMULATION_RESPONSE.path_labels.A.trim().length).toBeGreaterThan(0);
    expect(MOCK_SIMULATION_RESPONSE.path_labels.B.trim().length).toBeGreaterThan(0);
    expect(MOCK_SIMULATION_RESPONSE.meta.generatedAt.trim().length).toBeGreaterThan(0);

    for (const path of [MOCK_SIMULATION_RESPONSE.paths.A, MOCK_SIMULATION_RESPONSE.paths.B]) {
      expect(path.synthesis.summary.trim().length).toBeGreaterThan(0);
      expect(path.kpis.opportunityCost.trim().length).toBeGreaterThan(0);

      for (const agent of path.agents) {
        expect(agent.role.trim().length).toBeGreaterThan(0);
        expect(agent.insight.trim().length).toBeGreaterThan(0);
      }

      for (const entry of path.synthesis.timeline) {
        expect(entry.narrative.trim().length).toBeGreaterThan(0);
        expect(entry.drivers.length).toBeGreaterThan(0);
      }
    }
  });
});
