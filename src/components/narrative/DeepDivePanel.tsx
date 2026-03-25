"use client";

import { AGENT_ROLES, type VizType } from "@/lib/types";
import type { DeepDivePanelSlotProps } from "@/lib/integration-contracts";
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
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-dim">{pathA.synthesis.summary}</p>
          {pathA.synthesis.timeline.map((entry, i) => (
            <NarrativeBlock
              key={`${entry.month}-${i}`}
              month={entry.month}
              narrative={entry.narrative}
              drivers={entry.drivers}
              getDriverBgClass={(d) => driverBgClass(d, viz_type)}
            />
          ))}
        </div>
      }
      panelB={
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-dim">{pathB.synthesis.summary}</p>
          {pathB.synthesis.timeline.map((entry, i) => (
            <NarrativeBlock
              key={`${entry.month}-${i}`}
              month={entry.month}
              narrative={entry.narrative}
              drivers={entry.drivers}
              getDriverBgClass={(d) => driverBgClass(d, viz_type)}
            />
          ))}
        </div>
      }
    />
  );
}
