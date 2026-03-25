import type { KPIs } from "@/lib/types";

type PathKey = "A" | "B";

const HIGHER_IS_BETTER_KEYS = ["revenueImpact", "customerImpact", "overallScore"] as const;
const LOWER_IS_BETTER_KEYS = ["risk", "operatingCosts", "competitiveExposure"] as const;

type ComparableKpiKey = (typeof HIGHER_IS_BETTER_KEYS)[number] | (typeof LOWER_IS_BETTER_KEYS)[number];

const NUMERIC_KEYS: ComparableKpiKey[] = [...HIGHER_IS_BETTER_KEYS, ...LOWER_IS_BETTER_KEYS];

const winnerForValue = (a: number, b: number, higherIsBetter: boolean): PathKey =>
  higherIsBetter ? (a >= b ? "A" : "B") : a <= b ? "A" : "B";

export function winnerByKpi(a: KPIs, b: KPIs): Partial<Record<keyof KPIs, PathKey>> {
  const winners: Partial<Record<keyof KPIs, PathKey>> = {};

  for (const key of NUMERIC_KEYS) {
    const valueA = a[key];
    const valueB = b[key];
    const higherIsBetter = HIGHER_IS_BETTER_KEYS.includes(
      key as (typeof HIGHER_IS_BETTER_KEYS)[number],
    );
    winners[key] = winnerForValue(valueA, valueB, higherIsBetter);
  }

  return winners;
}

export function overallWinner(a: KPIs, b: KPIs): PathKey {
  return winnerForValue(a.overallScore, b.overallScore, true);
}
