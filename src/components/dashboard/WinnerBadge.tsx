"use client";

import { motion, useReducedMotion } from "framer-motion";

export type WinnerBadgeProps = {
  winner: "A" | "B";
  pathLabels: { A: string; B: string };
};

/**
 * Pill showing which path leads on this dimension. Copy avoids redundancy: when the path label
 * already identifies the path (default "Path A" / "Path B"), only the label is shown.
 * When a custom label is used, it is prefixed with the path ID for non-color-only clarity (UX-DR10).
 * Slides in after numeric values settle (~1s) unless reduced motion is on.
 */
export function WinnerBadge({ winner, pathLabels }: WinnerBadgeProps) {
  const reduceMotion = useReducedMotion();
  const id = winner === "A" ? "Path A" : "Path B";
  const name = pathLabels[winner];
  const isDefaultLabel = name === id;

  return (
    <motion.p
      data-testid="winner-badge"
      className="mt-2 inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 rounded-full border border-border bg-surface/95 px-3 py-1 text-caption text-text"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 28,
        delay: reduceMotion ? 0 : 1,
      }}
    >
      {!isDefaultLabel && (
        <span className="font-semibold text-accent">{id}</span>
      )}
      <span className={isDefaultLabel ? "font-semibold text-accent" : "min-w-0 truncate font-medium text-text"} title={name}>
        {name}
      </span>
      <span className="text-text-dim">favors this outcome.</span>
    </motion.p>
  );
}
