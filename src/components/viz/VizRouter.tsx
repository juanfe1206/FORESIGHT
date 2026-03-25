"use client";

import React from "react";
import type { FallbackVizProps, VizSlotProps } from "@/lib/integration-contracts";
import { useUiShell } from "@/lib/ui-shell-context";
import type { AgentState } from "@/lib/types";
import { FallbackViz } from "./FallbackViz";
import { FlowView } from "./FlowView/FlowView";
import { NetworkView } from "./NetworkView/NetworkView";

export type VizRouterProps = VizSlotProps & {
  agentStates?: AgentState[];
};

type VizRouterSwitchProps = VizSlotProps & {
  agentStates: AgentState[];
};

function MapPlaceholder({ pathLabel }: VizSlotProps) {
  return (
    <div
      data-testid="viz-placeholder-map"
      className="flex min-h-36 flex-1 flex-col justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-surface/40 p-4"
      aria-label={`Map view placeholder for ${pathLabel}`}
    >
      <p className="font-heading text-caption font-medium text-text-dim">Map view</p>
      <p className="text-caption text-text-dim">
        Map rendered via MapHalf in the shell. This path:{" "}
        <span className="text-text">{pathLabel}</span>
      </p>
    </div>
  );
}

function VizRouterSwitch(props: VizRouterSwitchProps) {
  const { runStatus } = useUiShell();
  const forcedFallback = runStatus === "fallback";
  const mode = forcedFallback ? "fallback" : props.viz_type;

  switch (mode) {
    case "flow":
      return <FlowView pathLabel={props.pathLabel} pathData={props.pathData} />;
    case "network":
      return <NetworkView {...props} />;
    case "fallback":
      return <FallbackViz {...props} />;
    case "map":
      return <MapPlaceholder viz_type="map" pathLabel={props.pathLabel} pathData={props.pathData} />;
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
const DEFAULT_AGENT_STATES: AgentState[] = ["dormant", "dormant", "dormant", "dormant"];

export function VizRouter(props: VizRouterProps) {
  const agentStates = props.agentStates ?? DEFAULT_AGENT_STATES;
  const fallbackProps: FallbackVizProps = {
    ...props,
    agentStates,
    viz_type: "fallback",
  };

  return (
    <div data-testid="viz-router" className="flex min-h-0 flex-1 flex-col">
      <VizRenderErrorBoundary
        key={`${props.pathLabel}-${props.viz_type}`}
        fallbackProps={fallbackProps}
      >
        <VizRouterSwitch {...props} agentStates={agentStates} />
      </VizRenderErrorBoundary>
    </div>
  );
}
