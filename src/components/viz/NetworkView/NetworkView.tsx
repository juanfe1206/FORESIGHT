"use client";

import { motion, useReducedMotionConfig } from "framer-motion";
import type { VizSlotProps } from "@/lib/integration-contracts";
import { AGENT_ROLES } from "@/lib/types";
import type { AgentState } from "@/lib/types";

const NETWORK_ROLES = AGENT_ROLES.network;

export type NetworkViewProps = VizSlotProps & {
  /** Four agent states for this path — drives hub / edge pulse during run. */
  agentStates: AgentState[];
};

function anyAgentActive(states: AgentState[]): boolean {
  return states.some((s) => s === "thinking" || s === "insight");
}

export function NetworkView({ pathData, pathLabel, agentStates }: NetworkViewProps) {
  const reducedMotionResolved = useReducedMotionConfig();
  const reduced = reducedMotionResolved === true;
  const states = Array.from({ length: 4 }, (_, i) => agentStates[i] ?? "dormant") as AgentState[];

  const hubActive = anyAgentActive(states);
  const cx = 100;
  const cy = 100;
  const r = 62;
  const angles = [-90, 0, 90, 180].map((deg) => (deg * Math.PI) / 180);

  const satellites = angles.map((a, i) => {
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const role = pathData.agents[i]?.role ?? NETWORK_ROLES[i] ?? `Stakeholder ${i + 1}`;
    return { x, y, role, state: states[i] };
  });

  return (
    <div
      data-testid="network-view"
      className="flex min-h-36 flex-1 flex-col gap-2"
      aria-label={`Network view for ${pathLabel}`}
    >
      <div className="relative flex flex-1 min-h-0 flex-col items-center justify-center rounded-lg border border-border/60 bg-surface/50 px-2 py-3">
        <svg
          viewBox="0 0 200 200"
          className="h-48 w-full max-w-[240px] text-purple"
          role="img"
          aria-hidden
        >
          {satellites.map((s, i) => {
            const edgeActive = s.state !== "dormant" && s.state !== "error";
            return (
              <motion.line
                key={`edge-${i}`}
                x1={cx}
                y1={cy}
                x2={s.x}
                y2={s.y}
                stroke="currentColor"
                strokeWidth={edgeActive ? 2 : 1.2}
                strokeOpacity={edgeActive ? 0.9 : 0.35}
                initial={reduced ? false : { opacity: 0.25 }}
                animate={{
                  opacity: edgeActive ? 1 : 0.4,
                  strokeWidth: edgeActive ? 2.2 : 1.2,
                }}
                transition={
                  reduced
                    ? { duration: 0.01 }
                    : { duration: 0.4, delay: i * 0.05, ease: "easeOut" }
                }
              />
            );
          })}
          {satellites.map((s, i) => (
            <g key={`sat-${i}`}>
              <circle
                cx={s.x}
                cy={s.y}
                r={9}
                className="fill-surface stroke-current"
                strokeWidth={1.5}
              />
              <text
                x={s.x}
                y={s.y + 22}
                textAnchor="middle"
                className="fill-text-dim text-[7.5px] font-sans"
              >
                {s.role.length > 16 ? `${s.role.slice(0, 14)}…` : s.role}
              </text>
            </g>
          ))}
          <motion.g
            animate={reduced || !hubActive ? {} : { scale: [1, 1.045, 1] }}
            transition={
              reduced || !hubActive
                ? {}
                : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <circle cx={cx} cy={cy} r={24} className="fill-purple/25 stroke-purple" strokeWidth={2} />
            <text
              x={cx}
              y={cy + 3}
              textAnchor="middle"
              className="fill-text font-sans text-[8px] font-semibold leading-tight"
            >
              {pathLabel.length > 18 ? `${pathLabel.slice(0, 16)}…` : pathLabel}
            </text>
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
