"use client";

import type { DeepDivePanelSlotProps } from "@/lib/integration-contracts";
import { summarizeGroundingDistribution } from "@/lib/format-agent-output";
import { AGENT_ROLES, type PathData, type VizType } from "@/lib/types";
import { NarrativeBlock } from "./NarrativeBlock";
import { PathTabs } from "./PathTabs";

const SLOT_BG: Record<number, string> = {
  0: "bg-blue",
  1: "bg-red",
  2: "bg-accent",
  3: "bg-gold",
};

function getDriverSlotIndex(driver: string, viz_type: VizType): number {
  const roles = AGENT_ROLES[viz_type];
  return roles.findIndex((r) => r.toLowerCase() === driver.toLowerCase());
}

function driverBgClass(driver: string, viz_type: VizType): string {
  const idx = getDriverSlotIndex(driver, viz_type);
  if (idx < 0) return "bg-text-dim";
  return SLOT_BG[idx] ?? "bg-text-dim";
}

function PathNarrativeColumn({
  pathData,
  pathLabel,
  viz_type,
}: {
  pathData: PathData;
  pathLabel: string;
  viz_type: VizType;
}) {
  const groundLine = summarizeGroundingDistribution(pathData.agents, pathLabel);
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1 border-b border-border pb-3">
        <p className="text-caption text-text-dim">
          Timeline narratives are simulation-derived scenarios—they are not guaranteed outcomes.
        </p>
        {groundLine ? (
          <p className="text-caption text-text-dim" data-testid="deep-dive-grounding-summary">
            {groundLine}
          </p>
        ) : null}
      </div>
      <p className="text-body text-text-dim">{pathData.synthesis.summary}</p>
      {pathData.synthesis.timeline.map((entry, i) => (
        <NarrativeBlock
          key={`${entry.month}-${i}`}
          month={entry.month}
          narrative={entry.narrative}
          drivers={entry.drivers}
          getDriverBgClass={(d) => driverBgClass(d, viz_type)}
        />
      ))}
    </div>
  );
}

export function DeepDivePanel({
  pathA,
  pathB,
  pathLabels,
  viz_type,
}: DeepDivePanelSlotProps & { viz_type: VizType }) {
  return (
    <PathTabs
      labelA={pathLabels.A}
      labelB={pathLabels.B}
      panelA={
        <PathNarrativeColumn pathData={pathA} pathLabel={pathLabels.A} viz_type={viz_type} />
      }
      panelB={
        <PathNarrativeColumn pathData={pathB} pathLabel={pathLabels.B} viz_type={viz_type} />
      }
    />
  );
}
