"use client";

import { motion, useReducedMotionConfig } from "framer-motion";
import type { KpiStackSlotProps } from "@/lib/integration-contracts";
import { KPI_STACK_ROW_STAGGER_S } from "@/lib/dashboard-choreography";
import type { KPIs } from "@/lib/types";
import { KPICard } from "./KPICard";

const springTransition = { type: "spring" as const, stiffness: 380, damping: 30 };

/** Stable row order: six comparative dimensions only (`overallScore` is Story 5.3 / ScoreRing). */
export const KPI_STACK_ROW_DEFS: {
  key: Exclude<keyof KPIs, "overallScore">;
  title: string;
  variant: "numeric" | "narrative";
}[] = [
  { key: "revenueImpact", title: "Revenue impact", variant: "numeric" },
  { key: "risk", title: "Risk", variant: "numeric" },
  { key: "customerImpact", title: "Customer impact", variant: "numeric" },
  { key: "operatingCosts", title: "Operating costs", variant: "numeric" },
  { key: "competitiveExposure", title: "Competitive exposure", variant: "numeric" },
  { key: "opportunityCost", title: "What you'd miss", variant: "narrative" },
];

export function KpiStack(props: KpiStackSlotProps) {
  const { kpisA, kpisB, comparison, pathLabels } = props;
  const reduceMotion = useReducedMotionConfig() === true;

  return (
    <section
      data-testid="kpi-stack"
      aria-labelledby="kpi-stack-heading"
      className="flex w-full min-w-0 flex-col gap-3"
    >
      <div>
        <h2 id="kpi-stack-heading" className="font-heading text-h3 text-text">
          Compare paths
        </h2>
        <p className="mt-1 text-caption text-text-dim">
          Six dimensions compared side by side.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {KPI_STACK_ROW_DEFS.map((row, index) => {
          const winner = comparison.winnerByKpi[row.key];
          const delay = reduceMotion ? 0 : index * KPI_STACK_ROW_STAGGER_S;

          return (
            <motion.div
              key={row.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay }}
            >
              <KPICard
                title={row.title}
                kpiKey={row.key}
                variant={row.variant}
                valueA={kpisA[row.key]}
                valueB={kpisB[row.key]}
                winner={winner}
                pathLabels={pathLabels}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
