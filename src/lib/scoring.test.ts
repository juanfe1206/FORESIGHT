import { describe, expect, it } from "vitest";
import type { KPIs } from "@/lib/types";
import { overallWinner, winnerByKpi } from "@/lib/scoring";

const kpisA: KPIs = {
  revenueImpact: 12,
  risk: 25,
  customerImpact: 40,
  operatingCosts: 200,
  competitiveExposure: 18,
  opportunityCost: "Loses partner network opportunity.",
  overallScore: 74,
};

const kpisB: KPIs = {
  revenueImpact: 18,
  risk: 30,
  customerImpact: 35,
  operatingCosts: 240,
  competitiveExposure: 22,
  opportunityCost: "Loses paid ads growth opportunity.",
  overallScore: 69,
};

describe("scoring", () => {
  it("computes deterministic winners by KPI orientation", () => {
    expect(winnerByKpi(kpisA, kpisB)).toEqual({
      revenueImpact: "B",
      risk: "A",
      customerImpact: "A",
      operatingCosts: "A",
      competitiveExposure: "A",
      overallScore: "A",
    });
  });

  it("uses A as deterministic tiebreak winner", () => {
    const tied = { ...kpisA, overallScore: 70 };
    const tiedB = { ...kpisB, overallScore: 70 };
    expect(overallWinner(tied, tiedB)).toBe("A");
  });
});
