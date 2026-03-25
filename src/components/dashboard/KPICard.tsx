"use client";

import type { KPIs } from "@/lib/types";
import { ComparisonBar } from "./ComparisonBar";
import { WinnerBadge } from "./WinnerBadge";
import { CountUpNumber } from "@/components/shared/CountUpNumber";

export type KPICardProps = {
  title: string;
  kpiKey: keyof KPIs;
  variant: "numeric" | "narrative";
  valueA: number | string;
  valueB: number | string;
  winner?: "A" | "B";
  pathLabels: { A: string; B: string };
};

/**
 * Single comparison row: title, A/B values, optional dual bar + winner badge.
 * Numeric rows use CountUpNumber; narrative (`opportunityCost`) uses side-by-side text (no fake count-up).
 */
export function KPICard({
  title,
  kpiKey,
  variant,
  valueA,
  valueB,
  winner,
  pathLabels,
}: KPICardProps) {
  const headingId = `kpi-row-${String(kpiKey)}`;

  if (variant === "narrative") {
    const a = typeof valueA === "string" ? valueA : String(valueA);
    const b = typeof valueB === "string" ? valueB : String(valueB);

    return (
      <article
        aria-labelledby={headingId}
        className="rounded-xl border border-border bg-surface/60 p-4"
        data-kpi-key={String(kpiKey)}
      >
        <h3 id={headingId} className="font-heading text-body font-semibold text-text">
          {title}
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-caption font-medium text-accent">{pathLabels.A}</p>
            <p className="mt-1 line-clamp-5 text-caption leading-snug text-text">{a}</p>
          </div>
          <div className="min-w-0">
            <p className="text-caption font-medium text-blue">{pathLabels.B}</p>
            <p className="mt-1 line-clamp-5 text-caption leading-snug text-text">{b}</p>
          </div>
        </div>
        {/* No winner: omit badge — avoids false positive; narrative text is neutral without it */}
        {winner ? <WinnerBadge winner={winner} pathLabels={pathLabels} /> : null}
      </article>
    );
  }

  const numA = typeof valueA === "number" ? valueA : Number(valueA);
  const numB = typeof valueB === "number" ? valueB : Number(valueB);

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-xl border border-border bg-surface/60 p-4"
      data-kpi-key={String(kpiKey)}
    >
      <h3 id={headingId} className="font-heading text-body font-semibold text-text">
        {title}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-caption">
        <div className="min-w-0">
          <dt className="truncate font-medium text-accent">{pathLabels.A}</dt>
          <dd className="mt-1">
            <CountUpNumber
              value={Number.isFinite(numA) ? numA : 0}
              aria-label={`${pathLabels.A} ${title}: ${Number.isFinite(numA) ? numA : 0}%`}
            />
          </dd>
        </div>
        <div className="min-w-0 text-right sm:text-left">
          <dt className="truncate font-medium text-blue">{pathLabels.B}</dt>
          <dd className="mt-1 sm:text-left">
            <CountUpNumber
              value={Number.isFinite(numB) ? numB : 0}
              aria-label={`${pathLabels.B} ${title}: ${Number.isFinite(numB) ? numB : 0}%`}
            />
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <ComparisonBar valueA={numA} valueB={numB} winner={winner} />
        <p className="sr-only">
          {winner
            ? `Bar comparison for ${title}: ${winner === "A" ? pathLabels.A : pathLabels.B} leads.`
            : `Bar comparison for ${title}: no single-path lean indicated.`}
        </p>
      </div>
      {/* No winner: omit badge — avoids false positive; neutral bar emphasis signals parity */}
      {winner ? <WinnerBadge winner={winner} pathLabels={pathLabels} /> : null}
    </article>
  );
}
