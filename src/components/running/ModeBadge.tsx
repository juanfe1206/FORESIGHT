"use client";

import type { VizType } from "@/lib/types";

const MODE_LABEL: Record<VizType, string> = {
  map: "Map",
  flow: "Flow",
  network: "Network",
  fallback: "Fallback",
};

const accentClass: Record<VizType, string> = {
  map: "border-accent/50 ring-accent/35",
  flow: "border-blue/50 ring-blue/35",
  network: "border-gold/50 ring-gold/35",
  fallback: "border-border ring-border/80",
};

function ModeGlyph({ vizType }: { vizType: VizType }) {
  const cls = "h-4 w-4 shrink-0 text-current";
  switch (vizType) {
    case "map":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      );
    case "flow":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h4l2-6 4 12 2-6h4" />
        </svg>
      );
    case "network":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M8 7.5h8M10.5 8.5l2.5 7M13.5 8.5l-2.5 7" />
        </svg>
      );
    case "fallback":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    default:
      return null;
  }
}

export function ModeBadge({ vizType, className = "" }: { vizType: VizType; className?: string }) {
  return (
    <div
      data-testid="mode-badge"
      className={`inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 font-heading text-caption font-semibold tracking-wide text-text shadow-sm ring-1 ${accentClass[vizType]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <ModeGlyph vizType={vizType} />
      <span data-testid="mode-badge-label">{MODE_LABEL[vizType]}</span>
    </div>
  );
}
