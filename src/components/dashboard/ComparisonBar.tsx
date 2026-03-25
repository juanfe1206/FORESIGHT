"use client";

import { motion, useReducedMotion } from "framer-motion";

export type ComparisonBarProps = {
  valueA: number;
  valueB: number;
  /** When omitted, both segments use balanced emphasis (no false winner). */
  winner?: "A" | "B";
};

/**
 * Dual segment bar: widths proportional to numeric values. Winner side uses full accent; other side muted (UX-DR11).
 */
export function ComparisonBar({ valueA, valueB, winner }: ComparisonBarProps) {
  const reduceMotion = useReducedMotion();
  const safeA = Math.max(0, valueA);
  const safeB = Math.max(0, valueB);
  const total = safeA + safeB;
  const pctA = total <= 0 ? 50 : (safeA / total) * 100;
  const pctB = total <= 0 ? 50 : (safeB / total) * 100;

  const segA =
    winner === undefined
      ? "bg-accent/55"
      : winner === "A"
        ? "bg-accent"
        : "bg-accent/35";
  const segB =
    winner === undefined
      ? "bg-blue/55"
      : winner === "B"
        ? "bg-blue"
        : "bg-blue/35";

  const dur = reduceMotion ? 0 : 0.75;

  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-border/90"
      role="presentation"
      aria-hidden="true"
    >
      <motion.div
        className={`h-full min-w-0 ${segA}`}
        initial={reduceMotion ? false : { width: "0%" }}
        animate={{ width: `${pctA}%` }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
      <motion.div
        className={`h-full min-w-0 ${segB}`}
        initial={reduceMotion ? false : { width: "0%" }}
        animate={{ width: `${pctB}%` }}
        transition={{ duration: dur, ease: "easeOut", delay: reduceMotion ? 0 : 0.04 }}
      />
    </div>
  );
}
