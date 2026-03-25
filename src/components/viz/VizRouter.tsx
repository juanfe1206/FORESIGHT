"use client";

import React from "react";
import type { FallbackVizProps, VizSlotProps } from "@/lib/integration-contracts";
import { useUiShell } from "@/lib/ui-shell-context";
import type { AgentState } from "@/lib/types";
import { FallbackViz } from "./FallbackViz";
import { NetworkView } from "./NetworkView/NetworkView";

export type VizRouterProps = VizSlotProps & {
  agentStates: AgentState[];
};

function MapFlowPlaceholder({ viz_type, pathLabel }: VizSlotProps) {
  const title = viz_type === "map" ? "Map view" : "Resource flow view";
  return (
    <div
      data-testid={`viz-placeholder-${viz_type}`}
      className="flex min-h-36 flex-1 flex-col justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-surface/40 p-4"
      aria-label={`${title} placeholder for ${pathLabel}`}
    >
      <p className="font-heading text-caption font-medium text-text-dim">{title}</p>
      <p className="text-caption text-text-dim">
        Full visualization ships in Epic {viz_type === "map" ? "4" : "3"}. This path:{" "}
        <span className="text-text">{pathLabel}</span>
      </p>
      <span className="text-2xl opacity-40" aria-hidden>
        {viz_type === "map" ? "🗺️" : "→"}
      </span>
    </div>
  );
}

function VizRouterSwitch(props: VizRouterProps) {
  const { runStatus } = useUiShell();
  const forcedFallback = runStatus === "fallback";
  const mode = forcedFallback ? "fallback" : props.viz_type;

  switch (mode) {
    case "network":
      return <NetworkView {...props} />;
    case "fallback":
      return <FallbackViz {...props} />;
    case "map":
      return <MapFlowPlaceholder viz_type="map" pathLabel={props.pathLabel} pathData={props.pathData} />;
    case "flow":
      return <MapFlowPlaceholder viz_type="flow" pathLabel={props.pathLabel} pathData={props.pathData} />;
    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
      return <FallbackViz {...props} />;
    }
  }
}

type BoundaryState = { hasError: boolean };

class VizRenderErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackProps: FallbackVizProps },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode; fallbackProps: FallbackVizProps }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[VizRenderErrorBoundary] Caught render error, swapping to FallbackViz:", error);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackViz {...this.props.fallbackProps} />;
    }
    return this.props.children;
  }
}

/**
 * Single `viz_type` switch for thin-slice side panels. Shell `runStatus === "fallback"`
 * forces `FallbackViz` regardless of response mode (graceful degradation).
 */
export function VizRouter(props: VizRouterProps) {
  const fallbackProps: FallbackVizProps = {
    ...props,
    viz_type: "fallback",
  };

  return (
    <div data-testid="viz-router" className="flex min-h-0 flex-1 flex-col">
      <VizRenderErrorBoundary
        key={`${props.pathLabel}-${props.viz_type}`}
        fallbackProps={fallbackProps}
      >
        <VizRouterSwitch {...props} />
      </VizRenderErrorBoundary>
    </div>
  );
}
