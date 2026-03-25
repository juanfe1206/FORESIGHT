"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentHudSlotProps } from "@/lib/integration-contracts";
import type { AgentState } from "@/lib/types";
import { AgentNode } from "./AgentNode";

function stateVerb(state: AgentState): string {
  switch (state) {
    case "dormant":
      return "waiting";
    case "thinking":
      return "analyzing";
    case "insight":
      return "sharing insight";
    case "complete":
      return "complete";
    case "error":
      return "error";
    default:
      return state;
  }
}

export function AgentHUD({
  viz_type: _vizType,
  roles,
  pathLabels,
  agentStatesByPath,
  insightsByPath,
  agentsByPath,
}: AgentHudSlotProps) {
  void _vizType;
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFingerprint = useRef<string>("");

  useEffect(() => {
    const parts: string[] = [];
    const pathIds: ("A" | "B")[] = ["A", "B"];
    for (const pid of pathIds) {
      const label = pathLabels[pid];
      const states = agentStatesByPath[pid];
      for (let i = 0; i < 4; i++) {
        const st = states[i];
        const role = roles[i] ?? `Agent ${i + 1}`;
        if (st && st !== "dormant") {
          parts.push(`Path ${pid} ${label}: ${role}, ${stateVerb(st)}.`);
        }
      }
    }
    const fp = parts.join("|");
    if (!fp || fp === lastFingerprint.current) return;
    lastFingerprint.current = fp;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLiveAnnouncement(parts.join(" "));
    }, 420);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [agentStatesByPath, pathLabels, roles]);

  return (
    <div
      data-testid="agent-hud"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="false">
        {liveAnnouncement}
      </p>

      <div>
        <h2 className="font-heading text-h3 text-text">Intelligence</h2>
        <p className="mt-1 text-caption text-text-dim">Dual-path agents (simulation)</p>
      </div>

      <div className="flex flex-col gap-6">
        {(["A", "B"] as const).map((pathId) => {
          const full = pathLabels[pathId];
          const states = agentStatesByPath[pathId];
          const insights = insightsByPath?.[pathId];
          const agents = agentsByPath?.[pathId];
          return (
            <section
              key={pathId}
              aria-label={`${full} agent row`}
              className="flex flex-col gap-2"
            >
              <h3
                className="truncate font-heading text-body font-semibold text-text"
                title={full}
              >
                {pathId === "A" ? "Path A" : "Path B"} —{" "}
                <span className="text-accent">{full}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => {
                  const agentRow = agents?.[i];
                  return (
                    <AgentNode
                      key={`${pathId}-${i}`}
                      pathId={pathId}
                      slotIndex={i}
                      role={roles[i] ?? `Agent ${i + 1}`}
                      state={states[i] ?? "dormant"}
                      insight={insights?.[i]}
                      confidence={agentRow?.confidence}
                      grounding={agentRow?.grounding}
                      pathLabelFull={full}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
