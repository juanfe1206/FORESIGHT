import type { ReactNode } from "react";
import type { VizType } from "@/lib/types";

type VizMapSideCanvasProps = {
  side: "left" | "right";
  vizType: VizType;
  children: ReactNode;
};

/**
 * When `viz_type === "map"`, reserves a bounded region in left/right panels for Story 4.2 `MapView`.
 * Non-map modes render children without the wrapper.
 */
export function VizMapSideCanvas({ side, vizType, children }: VizMapSideCanvasProps) {
  if (vizType !== "map") return <>{children}</>;

  const testId = side === "left" ? "map-canvas-region-left" : "map-canvas-region-right";

  return (
    <div
      data-testid={testId}
      data-viz-side={side}
      className="flex min-h-[12rem] min-w-0 flex-col rounded-xl border border-dashed border-border bg-surface/60 p-3"
    >
      <p className="mb-2 font-heading text-caption font-medium uppercase tracking-wide text-text-dim">Map canvas</p>
      <div className="flex min-h-[8rem] min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
