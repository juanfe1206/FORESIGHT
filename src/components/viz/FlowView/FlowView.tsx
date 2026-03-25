import type { PathData } from "@/lib/types";

type FlowViewProps = {
  pathLabel: string;
  pathData: PathData;
};

/**
 * Thin shell for flow visualization — Story 3.4 replaces body with full FlowView visuals.
 */
export function FlowView({ pathLabel, pathData }: FlowViewProps) {
  return (
    <div
      data-testid="viz-router-flow"
      className="mt-3 flex min-h-24 flex-1 flex-col rounded-lg border border-dashed border-border/60 bg-bg/40 p-3"
      role="region"
      aria-label={`Flow visualization for ${pathLabel}`}
    >
      <p className="text-caption text-text-dim">
        Flow view — Story 3.4 will render the full diagram here.
      </p>
      <p className="mt-2 line-clamp-3 text-caption text-text">{pathData.synthesis.summary}</p>
    </div>
  );
}
