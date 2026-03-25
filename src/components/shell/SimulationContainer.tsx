"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { PathData, VizType } from "@/lib/types";
import { VizRouter } from "@/components/viz/VizRouter";
import { SimulationShell } from "./SimulationShell";
import { PanelHeader } from "./PanelHeader";

const panelCardClass =
  "flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4";

type SimulationContainerProps = {
  pathLabels: [string, string];
  vizType: VizType;
  pathDataA: PathData;
  pathDataB: PathData;
  center: ReactNode;
};

/**
 * Running-stage product shell: three-panel Path A | intelligence | Path B over `SimulationShell`.
 */
export function SimulationContainer({
  pathLabels,
  vizType,
  pathDataA,
  pathDataB,
  center,
}: SimulationContainerProps) {
  const reduceMotion = useReducedMotion();

  const stagger = reduceMotion ? 0 : 0.07;
  const containerTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };

  const panelMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: containerTransition,
  };

  return (
    <div data-testid="simulation-container" className="flex flex-1 flex-col">
      <SimulationShell
        leftAriaLabel={`Path A: ${pathLabels[0]}`}
        centerAriaLabel="Agent HUD and progress slot"
        rightAriaLabel={`Path B: ${pathLabels[1]}`}
        left={
          <motion.div
            {...panelMotion}
            transition={{ ...containerTransition, delay: stagger * 0 }}
            className={panelCardClass}
          >
            <PanelHeader title={pathLabels[0]} accentClassName="text-accent" />
            <VizRouter
              viz_type={vizType}
              pathData={pathDataA}
              pathLabel={pathLabels[0]}
            />
          </motion.div>
        }
        center={
          <motion.div
            {...panelMotion}
            transition={{ ...containerTransition, delay: stagger * 1 }}
            className={panelCardClass}
          >
            {center}
          </motion.div>
        }
        right={
          <motion.div
            {...panelMotion}
            transition={{ ...containerTransition, delay: stagger * 2 }}
            className={panelCardClass}
          >
            <PanelHeader title={pathLabels[1]} accentClassName="text-blue" />
            <VizRouter
              viz_type={vizType}
              pathData={pathDataB}
              pathLabel={pathLabels[1]}
            />
          </motion.div>
        }
      />
    </div>
  );
}
