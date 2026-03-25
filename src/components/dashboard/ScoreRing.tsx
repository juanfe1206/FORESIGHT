"use client";

import { motion, useReducedMotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CountUpNumber } from "@/components/shared/CountUpNumber";
import type { ScoreRingSlotProps } from "@/lib/integration-contracts";
import { SCORE_RING_ENTRANCE_DELAY_S } from "@/lib/dashboard-choreography";

const springTransition = { type: "spring" as const, stiffness: 280, damping: 32 };

/** Clamp API values to product range 0–100 for display and progress arc. */
export function clampOverallScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export type ScoreRingProps = ScoreRingSlotProps & {
  variant?: "standard" | "compact";
  /** Path A accent / Path B blue — matches side-panel hierarchy */
  pathTone: "A" | "B";
};

export function ScoreRing({
  score,
  pathLabel,
  variant = "standard",
  pathTone,
}: ScoreRingProps) {
  const reducedMotionResolved = useReducedMotionConfig();
  const reduced = reducedMotionResolved === true;
  const clamped = clampOverallScore(score);
  const entranceDelay = reduced ? 0 : SCORE_RING_ENTRANCE_DELAY_S;

  const [delayedCountReady, setDelayedCountReady] = useState(false);
  useEffect(() => {
    if (reducedMotionResolved === true) return;
    const ms = Math.round(SCORE_RING_ENTRANCE_DELAY_S * 1000);
    const id = window.setTimeout(() => setDelayedCountReady(true), ms);
    return () => window.clearTimeout(id);
  }, [reducedMotionResolved]);

  const countReady = reducedMotionResolved === true || delayedCountReady;

  const { size, stroke, r, cx } = useMemo(() => {
    if (variant === "compact") {
      return { size: 96, stroke: 6, r: 40, cx: 48 };
    }
    return { size: 128, stroke: 8, r: 54, cx: 64 };
  }, [variant]);

  const c = 2 * Math.PI * r;
  const targetOffset = c * (1 - clamped / 100);
  const strokeClass = pathTone === "A" ? "stroke-accent" : "stroke-blue";

  const strokeDuration = reduced ? 0.01 : 0.85;

  const label = `Overall score for ${pathLabel}: ${clamped} out of 100`;

  return (
    <motion.div
      data-testid="score-ring"
      className="flex flex-col items-center gap-2"
      initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springTransition, delay: entranceDelay }}
    >
      <div
        className="relative flex items-center justify-center"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            className="stroke-border/35"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            className={strokeClass}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{
              duration: strokeDuration,
              ease: "easeOut",
              delay: entranceDelay,
            }}
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center pt-0.5">
          {countReady ? (
            <CountUpNumber
              value={clamped}
              suffix=""
              className="text-text"
              aria-label={`${pathLabel} overall score ${clamped}`}
            />
          ) : (
            <span className="font-mono tabular-nums text-kpi leading-none text-text opacity-0" aria-hidden>
              0
            </span>
          )}
        </span>
      </div>
      <p className="text-center font-mono text-caption text-text-dim" aria-hidden>
        Overall score
      </p>
    </motion.div>
  );
}
