"use client";

import { motion, useReducedMotion } from "framer-motion";

type LeakPointProps = {
  x: number;
  y: number;
  intensity: number;
};

export function LeakPoint({ x, y, intensity }: LeakPointProps) {
  const reduced = useReducedMotion();
  const glow = 0.35 + intensity * 0.55;

  return (
    <g data-testid="flow-leak" transform={`translate(${x},${y})`} aria-hidden>
      <circle cx={0} cy={0} r={5} fill="var(--color-red)" opacity={glow * 0.35} />
      <circle cx={0} cy={0} r={2.5} fill="var(--color-red)" opacity={0.9} />
      {!reduced && (
        <motion.circle
          cx={0}
          cy={0}
          r={1.8}
          fill="var(--color-red)"
          initial={{ opacity: 0.9 }}
          animate={{ cy: [0, 14, 0], opacity: [0.9, 0.2, 0.9] }}
          transition={{ duration: 1.6 + (1 - intensity) * 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}
