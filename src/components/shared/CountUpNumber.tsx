"use client";

import { useReducedMotionConfig } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const DEFAULT_MS = 1000;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export type CountUpNumberProps = {
  value: number;
  /** Animation duration in ms (default ~1s). Ignored when reduced motion is preferred. */
  durationMs?: number;
  className?: string;
  /** Suffix after the integer, e.g. `%` */
  suffix?: string;
  "aria-label"?: string;
};

/**
 * Counts from 0 to `value` over ~1s (ease-out). Uses JetBrains Mono via `font-mono` / KPI scale.
 * When reduced motion is preferred (`MotionConfig` or OS), shows the target value immediately.
 */
export function CountUpNumber({
  value,
  durationMs = DEFAULT_MS,
  className = "",
  suffix = "%",
  "aria-label": ariaLabel,
}: CountUpNumberProps) {
  const reducedMotion = useReducedMotionConfig();
  const reduce = reducedMotion === true;
  const target = Math.round(value);
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const safeDurationMs = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : DEFAULT_MS;

  useEffect(() => {
    if (reduce) return;

    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / safeDurationMs);
      setDisplay(Math.round(value * easeOutCubic(t)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, safeDurationMs, reduce]);

  const shown = reduce ? target : display;
  const text = `${shown}${suffix}`;

  return (
    <span
      className={`font-mono tabular-nums text-kpi leading-none text-text ${className}`.trim()}
      aria-label={ariaLabel ?? text}
    >
      {text}
    </span>
  );
}
