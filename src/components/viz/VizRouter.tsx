import type { VizSlotProps } from "@/lib/integration-contracts";
import { FlowView } from "./FlowView/FlowView";

const placeholderBase = "mt-3 flex min-h-24 flex-1 flex-col rounded-lg border border-dashed border-border/60 p-3 text-caption text-text-dim";

/**
 * Routes `viz_type` to the correct visualization branch (Epic 3–5).
 */
export function VizRouter(props: VizSlotProps) {
  const { viz_type, pathData, pathLabel } = props;

  switch (viz_type) {
    case "flow":
      return <FlowView pathLabel={pathLabel} pathData={pathData} />;
    case "map":
      return (
        <div data-testid="viz-router-map" className={placeholderBase} role="region" aria-label="Map visualization placeholder">
          Map view — Epic 4 integration
        </div>
      );
    case "network":
      return (
        <div data-testid="viz-router-network" className={placeholderBase} role="region" aria-label="Network visualization placeholder">
          Network view — Epic 5 integration
        </div>
      );
    case "fallback":
      return (
        <div data-testid="viz-router-fallback" className={placeholderBase} role="region" aria-label="Fallback visualization placeholder">
          Fallback visualization
        </div>
      );
    default: {
      const _exhaustive: never = viz_type;
      void _exhaustive;
      return null;
    }
  }
}
