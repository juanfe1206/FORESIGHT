import type { AgentOutput, GroundingLevel } from "./types";

/**
 * Clamp to [0, 1] and format as a whole-number percentage for display.
 * Returns "—" for non-finite values (NaN, Infinity) to avoid showing a
 * misleading 0% when the value is genuinely unavailable.
 */
export function formatConfidencePercent(confidence: number): string {
  if (!Number.isFinite(confidence)) return "—";
  const clamped = Math.min(1, Math.max(0, confidence));
  return `${Math.round(clamped * 100)}%`;
}

const GROUNDING_UI: Record<GroundingLevel, { label: string }> = {
  supplied: { label: "From your inputs" },
  mixed: { label: "Mixed: your inputs and assumptions" },
  assumed: { label: "Mostly assumed" },
};

/** Visible + screen-reader-friendly grounding label (not hue-only). */
export function formatAgentGroundingLabel(grounding: GroundingLevel): string {
  return GROUNDING_UI[grounding]?.label ?? "Unknown grounding";
}

/** One-line distribution from real agent outputs (no fabricated totals). */
export function summarizeGroundingDistribution(
  agents: AgentOutput[],
  pathLabel: string,
): string | null {
  if (!agents.length) return null;
  const counts: Record<GroundingLevel, number> = {
    supplied: 0,
    mixed: 0,
    assumed: 0,
  };
  for (const a of agents) {
    if (a.grounding in counts) {
      counts[a.grounding] += 1;
    }
  }
  const parts: string[] = [];
  if (counts.supplied) parts.push(`${counts.supplied} grounded in your inputs`);
  if (counts.mixed) parts.push(`${counts.mixed} mixed inputs/assumptions`);
  if (counts.assumed) parts.push(`${counts.assumed} largely assumed`);
  if (!parts.length) return null;
  return `${pathLabel}: ${parts.join(", ")}.`;
}
