"use client";

import type { PathData } from "@/lib/types";
import { useLayoutEffect, useRef, useState } from "react";
import { clamp01, FLOW_CHANNEL_PATHS, FLOW_LABEL_ANCHORS, type FlowVizModel } from "./flowVizModel";
import { FlowPipe } from "./FlowPipe";
import { LeakPoint } from "./LeakPoint";
import { OutcomePools } from "./OutcomePool";
import { Particles } from "./Particles";
import { ResourcePool } from "./ResourcePool";

type FlowHalfProps = {
  pathData: PathData;
  model: FlowVizModel;
};

export function FlowHalf({ pathData, model }: FlowHalfProps) {
  const pipeSqueeze = clamp01(1 - pathData.kpis.competitiveExposure / 200);

  const r0 = useRef<SVGPathElement>(null);
  const r1 = useRef<SVGPathElement>(null);
  const r2 = useRef<SVGPathElement>(null);
  const r3 = useRef<SVGPathElement>(null);
  const pathRefs = [r0, r1, r2, r3];

  const [pathsReady, setPathsReady] = useState(false);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setPathsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div data-testid="flow-half" className="w-full min-w-0">
      <ResourcePool fill={model.resource.fill} displayAmount={model.resource.displayAmount} />
      <svg
        viewBox="0 0 360 320"
        className="h-auto max-h-[min(280px,40vh)] w-full"
        role="img"
        aria-label="Resource allocation channels and outcomes"
      >
        <defs>
          <linearGradient id="flow-pipe-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <OutcomePools outcomes={model.outcomes} />
        {FLOW_CHANNEL_PATHS.map((d, i) => {
          const anchor = FLOW_LABEL_ANCHORS[i] ?? FLOW_LABEL_ANCHORS[0];
          return (
            <FlowPipe
              key={d}
              pathD={d}
              strokeWidth={model.channels[i]?.strokeWidth ?? 6}
              label={model.channels[i]?.label ?? ""}
              labelX={anchor.x}
              labelY={anchor.y}
              pathRef={pathRefs[i]!}
              pipeSqueeze={pipeSqueeze}
              testId={`flow-channel-${i}`}
            />
          );
        })}
        <LeakPoint x={180} y={128} intensity={model.leak.intensity} />
        {pathsReady && (
          <Particles
            pathRefs={pathRefs}
            particleDurationSec={model.channels.map((c) => c.particleDurationSec)}
            flowVolume={model.channels.map((c) => c.flowVolume)}
          />
        )}
      </svg>
    </div>
  );
}
