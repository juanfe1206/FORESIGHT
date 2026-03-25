"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { AgentState } from "@/lib/types";

const SLOT_ACCENT = [
  "border-blue/50 text-blue",
  "border-red/50 text-red",
  "border-emerald-400/50 text-emerald-400",
  "border-gold/50 text-gold",
] as const;

function stateLabel(state: AgentState): string {
  switch (state) {
    case "dormant":
      return "Waiting";
    case "thinking":
      return "Analyzing";
    case "insight":
      return "Insight ready";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    default:
      return state;
  }
}

function StateIcon({ state }: { state: AgentState }) {
  switch (state) {
    case "dormant":
      return <span aria-hidden="true">○</span>;
    case "thinking":
      return <span aria-hidden="true">◉</span>;
    case "insight":
      return <span aria-hidden="true">◆</span>;
    case "complete":
      return <span aria-hidden="true">✓</span>;
    case "error":
      return <span aria-hidden="true">!</span>;
    default:
      return null;
  }
}

export type AgentNodeProps = {
  pathId: "A" | "B";
  slotIndex: number;
  role: string;
  state: AgentState;
  insight?: string;
  /** Accessible name uses full path label + role (truncation is visual-only on parent). */
  pathLabelFull: string;
};

export function AgentNode({
  pathId,
  slotIndex,
  role,
  state,
  insight,
  pathLabelFull,
}: AgentNodeProps) {
  const reduceMotion = useReducedMotion();
  const accent = SLOT_ACCENT[Math.min(slotIndex, 3)] ?? SLOT_ACCENT[0];
  const accessibleName = `${pathLabelFull}, ${role}, ${stateLabel(state)}`;

  const body =
    state === "insight" && insight ? (
      <p className="mt-1 line-clamp-2 text-caption leading-tight text-text">{insight}</p>
    ) : (
      <p className="mt-1 text-caption text-text-dim">{stateLabel(state)}</p>
    );

  return (
    <motion.div
      layout
      data-testid={`agent-node-${pathId}-${slotIndex}`}
      className={`flex min-w-0 flex-col rounded-lg border bg-surface/80 px-3 py-2 ${accent}`}
      aria-label={accessibleName}
    >
      <div className="flex items-center gap-2">
        {state === "thinking" && !reduceMotion ? (
          <motion.span
            aria-hidden="true"
            className="inline-flex text-body"
            animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <StateIcon state={state} />
          </motion.span>
        ) : (
          <span className="inline-flex text-body" aria-hidden="true">
            <StateIcon state={state} />
          </span>
        )}
        <span className="min-w-0 truncate font-medium text-caption text-text">{role}</span>
      </div>
      {body}
    </motion.div>
  );
}
