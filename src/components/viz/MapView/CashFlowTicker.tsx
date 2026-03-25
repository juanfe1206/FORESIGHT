"use client";

import { useEffect, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function useAnimatedCount(target: number, active: boolean, durationMs: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(target * easeOutCubic(p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs]);

  return value;
}

function formatRevenueImpact(impact: number): { sign: "+" | "-" | ""; body: string } {
  if (impact === 0) return { sign: "", body: "0" };
  if (impact > 0) return { sign: "+", body: String(Math.abs(Math.round(impact))) };
  return { sign: "-", body: String(Math.abs(Math.round(impact))) };
}

export type CashFlowTickerProps = {
  pathLabel: string;
  revenueImpact: number;
  visible: boolean;
  reducedMotion: boolean;
};

export function CashFlowTicker({ pathLabel, revenueImpact, visible, reducedMotion }: CashFlowTickerProps) {
  const animated = useAnimatedCount(revenueImpact, visible && !reducedMotion, 1000);
  const displayValue = !visible ? 0 : reducedMotion ? revenueImpact : animated;
  const rounded = Math.round(displayValue);
  const { sign, body } = formatRevenueImpact(rounded);
  const colorClass =
    revenueImpact > 0 ? "text-accent" : revenueImpact < 0 ? "text-red" : "text-text-dim";

  return (
    <div
      data-testid="cash-flow-ticker"
      className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,14rem)] rounded-md border border-border/80 bg-bg/85 px-2 py-1.5 shadow-sm backdrop-blur-sm"
      aria-hidden={!visible}
    >
      <p className="truncate text-caption text-text-dim">{pathLabel}</p>
      <p className={`font-mono text-caption font-medium tabular-nums ${colorClass}`}>
        €{sign}
        {body}/mo
      </p>
    </div>
  );
}
