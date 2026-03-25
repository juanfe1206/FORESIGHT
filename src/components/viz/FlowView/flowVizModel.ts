import type { PathData } from "@/lib/types";
import { AGENT_ROLES } from "@/lib/types";

/**
 * Mock scaling for Flow View when API does not expose raw channel € amounts.
 * Maps PathData.kpis (revenueImpact 0–∞, risk 0–100, etc.) to normalized fills and widths.
 */
export const FLOW_VIZ_SCALING = {
  /** customerImpact → outcome pool “New customers” fill (assumes ~80 = strong) */
  customerImpactMax: 80,
  /** revenueImpact → “Revenue” pool */
  revenueImpactMax: 50,
  /** operatingCosts (€) + risk → “Wasted spend” pool */
  operatingCostsScale: 1200,
  riskBlend: 200,
  /** Display € for resource pool header */
  resourceEuroBase: 400,
  resourceEuroPerOpCost: 0.2,
} as const;

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export interface FlowChannelModel {
  index: number;
  label: string;
  strokeWidth: number;
  flowVolume: number;
  /** Full path traverse duration (UX-DR24: typically 2–4s) */
  particleDurationSec: number;
}

export interface FlowOutcomeModel {
  id: "customers" | "revenue" | "waste";
  label: string;
  fill: number;
}

export interface FlowResourceModel {
  fill: number;
  displayAmount: string;
}

export interface FlowLeakModel {
  /** 0–1 from risk + competitiveExposure */
  intensity: number;
}

export interface FlowVizModel {
  resource: FlowResourceModel;
  channels: FlowChannelModel[];
  outcomes: FlowOutcomeModel[];
  leak: FlowLeakModel;
}

function channelLabel(agents: PathData["agents"], index: number): string {
  return agents[index]?.role ?? AGENT_ROLES.flow[index];
}

/**
 * Derives pool levels, pipe widths, particle timing, and leak intensity from PathData only.
 */
export function buildFlowVizModel(pathData: PathData): FlowVizModel {
  const { kpis, agents } = pathData;
  const { customerImpactMax, revenueImpactMax, operatingCostsScale, riskBlend, resourceEuroBase, resourceEuroPerOpCost } =
    FLOW_VIZ_SCALING;

  const channels: FlowChannelModel[] = [0, 1, 2, 3].map((i) => {
    const agent = agents[i];
    const conf = agent?.confidence ?? 0.65;
    const flowVolume = clamp01(conf * (1 - kpis.risk / riskBlend));
    return {
      index: i,
      label: channelLabel(agents, i),
      strokeWidth: 4 + flowVolume * 8,
      flowVolume,
      particleDurationSec: 2 + (1 - flowVolume) * 2,
    };
  });

  const resourceFill = clamp01(kpis.overallScore / 100);
  const displayAmount = `€${Math.round(resourceEuroBase + kpis.operatingCosts * resourceEuroPerOpCost)}`;

  const outcomes: FlowOutcomeModel[] = [
    {
      id: "customers",
      label: "New customers",
      fill: clamp01(kpis.customerImpact / customerImpactMax),
    },
    {
      id: "revenue",
      label: "Revenue",
      fill: clamp01(kpis.revenueImpact / revenueImpactMax),
    },
    {
      id: "waste",
      label: "Wasted spend",
      fill: clamp01(kpis.operatingCosts / operatingCostsScale + kpis.risk / riskBlend),
    },
  ];

  const leakIntensity = clamp01((kpis.risk + kpis.competitiveExposure) / riskBlend);

  return {
    resource: { fill: resourceFill, displayAmount },
    channels,
    outcomes,
    leak: { intensity: leakIntensity },
  };
}

/** SVG channel paths (viewBox 0 0 360 320) — geometry only; widths come from model. */
export const FLOW_CHANNEL_PATHS: readonly string[] = [
  "M 56 64 C 56 140 88 200 88 262",
  "M 118 64 C 118 130 140 200 164 262",
  "M 180 64 C 180 140 180 200 180 262",
  "M 242 64 C 242 130 260 200 274 262",
];

/** Label placement near mid-path (viewBox coords). */
export const FLOW_LABEL_ANCHORS: { x: number; y: number }[] = [
  { x: 72, y: 158 },
  { x: 132, y: 152 },
  { x: 180, y: 158 },
  { x: 248, y: 152 },
];
