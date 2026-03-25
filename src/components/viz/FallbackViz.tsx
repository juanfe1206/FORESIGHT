"use client";

import { motion, useReducedMotionConfig } from "framer-motion";
import type { FallbackVizProps } from "@/lib/integration-contracts";
import { AGENT_ROLES } from "@/lib/types";
import type { AgentState } from "@/lib/types";

const ROLES = AGENT_ROLES.fallback;

/** Diamond vertex positions (viewBox 0 0 200 200): top, right, bottom, left. */
const VERTICES: { x: number; y: number }[] = [
  { x: 100, y: 28 },
  { x: 168, y: 100 },
  { x: 100, y: 172 },
  { x: 32, y: 100 },
];

const CX = 100;
const CY = 100;

function edgeActive(state: AgentState | undefined): boolean {
  if (!state) return false;
  return state !== "dormant" && state !== "error";
}

export function FallbackViz({ pathLabel, agentStates }: FallbackVizProps) {
  const reducedMotionResolved = useReducedMotionConfig();
  const reduced = reducedMotionResolved === true;
  const states = Array.from({ length: 4 }, (_, i) => agentStates[i] ?? "dormant") as AgentState[];

  return (
    <div
      data-testid="fallback-viz"
      className="flex min-h-36 flex-1 flex-col gap-2"
      aria-label={`Simplified view for ${pathLabel}`}
    >
      <p className="text-caption font-medium text-text-dim">Simplified view</p>
      <div className="relative flex flex-1 min-h-0 items-center justify-center rounded-lg border border-border/60 bg-surface/50 px-2 py-3">
        <svg
          viewBox="0 0 200 200"
          className="h-44 w-full max-w-[220px] text-purple"
          role="img"
          aria-hidden
        >
          <title>Fallback diamond diagram</title>
          {VERTICES.map((v, i) => {
            const active = edgeActive(states[i]);
            return (
              <motion.line
                key={`spoke-${i}`}
                x1={CX}
                y1={CY}
                x2={v.x}
                y2={v.y}
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.2}
                strokeOpacity={active ? 0.95 : 0.28}
                initial={reduced ? false : { opacity: 0.2 }}
                animate={{
                  opacity: active ? 1 : 0.35,
                  strokeWidth: active ? 2.4 : 1.2,
                }}
                transition={
                  reduced
                    ? { duration: 0.01 }
                    : {
                        opacity: { duration: 0.45, delay: i * 0.08, ease: "easeOut" },
                        strokeWidth: { duration: 0.4 },
                      }
                }
              />
            );
          })}
          {VERTICES.map((v, i) => {
            const active = edgeActive(states[i]);
            return (
              <g key={`node-${i}`}>
                <motion.circle
                  cx={v.x}
                  cy={v.y}
                  r={active ? 11 : 9}
                  className="fill-surface stroke-current"
                  strokeWidth={1.5}
                  animate={
                    reduced || !active
                      ? {}
                      : { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }
                  }
                  transition={
                    reduced || !active
                      ? {}
                      : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  }
                />
                <text
                  x={v.x}
                  y={v.y + 22}
                  textAnchor="middle"
                  className="fill-text-dim text-[8px] font-sans"
                >
                  {ROLES[i]?.slice(0, 14) ?? `Slot ${i + 1}`}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={5} className="fill-purple/80" />
        </svg>
      </div>
    </div>
  );
}
