"use client";

import { useMemo } from "react";
import type { PathData } from "@/lib/types";
import { FlowHalf } from "./FlowHalf";
import { buildFlowVizModel } from "./flowVizModel";

type FlowViewProps = {
  pathLabel: string;
  pathData: PathData;
};

/**
 * Flow mode resource allocation visualization (FR15) — data from PathData via flowVizModel.
 */
export function FlowView({ pathLabel, pathData }: FlowViewProps) {
  const model = useMemo(() => buildFlowVizModel(pathData), [pathData]);

  return (
    <div
      data-testid="viz-router-flow"
      className="mt-3 flex min-h-48 flex-1 flex-col rounded-lg border border-border/60 bg-bg/40 p-3"
      role="region"
      aria-labelledby="flow-viz-title"
    >
      <h2 id="flow-viz-title" className="sr-only">
        Flow visualization for {pathLabel}
      </h2>
      <FlowHalf pathData={pathData} model={model} />
      {pathData.synthesis?.summary ? (
        <p className="mt-2 line-clamp-3 text-caption text-text-dim">{pathData.synthesis.summary}</p>
      ) : null}
    </div>
  );
}
