import { describe, expect, it } from "vitest";
import { buildThinSliceMockComparison } from "./thin-slice-mock";

describe("buildThinSliceMockComparison", () => {
  it("embeds path labels and returns mock KPI shape", () => {
    const result = buildThinSliceMockComparison("Austin", "Regional");
    expect(result.pathA.label).toBe("Austin");
    expect(result.pathB.label).toBe("Regional");
    expect(result.pathA.kpis.revenue).toMatch(/^\$/);
    expect(result.pathB.kpis.confidence).toMatch(/%$/);
  });
});
