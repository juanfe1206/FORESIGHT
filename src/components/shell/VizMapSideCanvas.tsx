import type { ReactNode } from "react";
import type { VizType } from "@/lib/types";

type VizMapSideCanvasProps = {
  side: "left" | "right";
  vizType: VizType;
  pathLabel?: string;
  children: ReactNode;
};

/**
 * Reserves a bounded region in left/right panels for the map visualization.
 * Always wraps children with map canvas styling (post-7.1 map-only pivot).
 */
export function VizMapSideCanvas({ side, pathLabel, children }: VizMapSideCanvasProps) {
  const testId = side === "left" ? "map-canvas-region-left" : "map-canvas-region-right";
  const accentClass = side === "left" ? "text-accent" : "text-blue";

  return (
    <div
      data-testid={testId}
      data-viz-side={side}
      className="flex min-h-48 min-w-0 flex-col rounded-xl border border-dashed border-border bg-surface/60 p-3"
    >
      {pathLabel ? (
        <h3 className={`mb-2 truncate font-heading text-body font-semibold ${accentClass}`} title={pathLabel}>
          {pathLabel}
        </h3>
      ) : (
        <p className="mb-2 font-heading text-caption font-medium uppercase tracking-wide text-text-dim">Map canvas</p>
      )}
      <div className="flex min-h-32 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
