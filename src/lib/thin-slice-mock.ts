/**
 * Provisional mock comparison for Story 1.1 (no network).
 * Replaced by canonical types + fixture in Story 1.2.
 */
export type ThinSliceMockKpis = {
  revenue: string;
  risk: string;
  timeToValue: string;
  confidence: string;
};

export function buildThinSliceMockComparison(pathALabel: string, pathBLabel: string) {
  return {
    pathA: {
      label: pathALabel,
      kpis: {
        revenue: "$1.24M",
        risk: "Medium",
        timeToValue: "6 mo",
        confidence: "72%",
      } satisfies ThinSliceMockKpis,
    },
    pathB: {
      label: pathBLabel,
      kpis: {
        revenue: "$980K",
        risk: "Lower",
        timeToValue: "3 mo",
        confidence: "81%",
      } satisfies ThinSliceMockKpis,
    },
  };
}
