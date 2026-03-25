"use client";

import dynamic from "next/dynamic";
import React, { Component, type ReactNode } from "react";
import type { VizSlotProps } from "@/lib/integration-contracts";
import { MapFallback } from "./MapFallback";

const MapScene = dynamic(
  () => import("./MapScene").then((m) => ({ default: m.MapScene })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[10rem] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-surface/40 text-caption text-text-dim"
        aria-hidden
      >
        Loading map…
      </div>
    ),
  },
);

export class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(err: unknown): void {
    console.error("[MapView] Error:", err);
  }

  render(): ReactNode {
    return this.state.hasError ? <MapFallback /> : this.props.children;
  }
}

export function MapHalf(props: VizSlotProps) {
  if (props.viz_type !== "map") return null;

  return (
    <MapErrorBoundary>
      <div className="relative flex min-h-[10rem] flex-1 flex-col">
        <MapScene pathData={props.pathData} pathLabel={props.pathLabel} />
      </div>
    </MapErrorBoundary>
  );
}
