import type { AgentState, KPIs, PathData, SimulationResponse, VizType } from "./types";
import { AGENT_ROLES } from "./types";
import { MOCK_BAKERY_MAP_FIXTURE } from "./mock-fixture";

const fx = MOCK_BAKERY_MAP_FIXTURE;

/**
 * Common props for FlowView / MapView / NetworkView / FallbackViz (Epic 3–5).
 */
export interface VizSlotProps {
  viz_type: VizType;
  pathData: PathData;
  pathLabel: string;
}

/**
 * Center panel while simulation is running (Epic 5).
 * Dual-path agent animation — both paths progress in parallel (Story 5.1).
 */
export interface AgentHudSlotProps {
  viz_type: VizType;
  roles: string[];
  pathLabels: { A: string; B: string };
  agentStatesByPath: { A: AgentState[]; B: AgentState[] };
  insightsByPath?: { A: (string | undefined)[]; B: (string | undefined)[] };
}

/**
 * Center panel dashboard stage (Epic 5).
 */
export interface KpiStackSlotProps {
  kpisA: KPIs;
  kpisB: KPIs;
  comparison: SimulationResponse["comparison"];
  pathLabels: { A: string; B: string };
}

/**
 * Side panel score region (Epic 5).
 */
export interface ScoreRingSlotProps {
  score: number;
  pathLabel: string;
}

/**
 * Deep-dive stage center (Epic 4).
 */
export interface DeepDivePanelSlotProps {
  pathA: PathData;
  pathB: PathData;
  pathLabels: { A: string; B: string };
}

export const MOCK_VIZ_SLOT_PROPS_A: VizSlotProps = {
  viz_type: fx.viz_type,
  pathData: fx.paths.A,
  pathLabel: fx.path_labels.A,
};

const dormant4 = (): AgentState[] => ["dormant", "dormant", "dormant", "dormant"];

export const MOCK_AGENT_HUD_PROPS: AgentHudSlotProps = {
  viz_type: fx.viz_type,
  roles: [...AGENT_ROLES[fx.viz_type]],
  pathLabels: { ...fx.path_labels },
  agentStatesByPath: { A: dormant4(), B: dormant4() },
};

export const MOCK_KPI_STACK_PROPS: KpiStackSlotProps = {
  kpisA: fx.paths.A.kpis,
  kpisB: fx.paths.B.kpis,
  comparison: fx.comparison,
  pathLabels: fx.path_labels,
};

export const MOCK_SCORE_RING_PROPS_A: ScoreRingSlotProps = {
  score: fx.paths.A.kpis.overallScore,
  pathLabel: fx.path_labels.A,
};

export const MOCK_DEEP_DIVE_PROPS: DeepDivePanelSlotProps = {
  pathA: fx.paths.A,
  pathB: fx.paths.B,
  pathLabels: fx.path_labels,
};
