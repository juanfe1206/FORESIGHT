export type VizType = "map" | "flow" | "network" | "fallback";

export type AgentState = "dormant" | "thinking" | "insight" | "complete" | "error";
export type GroundingLevel = "supplied" | "mixed" | "assumed";
export type RunStatus = "completed" | "fallback" | "error";

export interface SimulationRequest {
  decision: string;
  context: {
    industry?: string;
    monthlyRevenue?: number;
    location?: string;
    customerBase?: string;
    details?: string;
    businessType?: string;
    employeeCount?: number;
    productsOrServices?: string;
    confirmedCompetitors?: Array<{ name: string; lat: number; lng: number }>;
    confirmedLocation?: { lat: number; lng: number };
  };
  options?: {
    stream?: boolean;
    useCachedOnFailure?: boolean;
    demoScenarioId?: string;
  };
}

export interface AgentOutput {
  role: string;
  insight: string;
  confidence: number;
  grounding: GroundingLevel;
}

export interface TimelineEntry {
  month: number;
  narrative: string;
  drivers: string[];
}

export interface PathSynthesis {
  summary: string;
  timeline: TimelineEntry[];
}

export interface KPIs {
  revenueImpact: number;
  risk: number;
  customerImpact: number;
  operatingCosts: number;
  competitiveExposure: number;
  opportunityCost: string;
  overallScore: number;
}

export interface PathData {
  agents: AgentOutput[];
  synthesis: PathSynthesis;
  kpis: KPIs;
}

export interface SimulationResponse {
  runId: string;
  status: RunStatus;
  viz_type: VizType;
  path_labels: { A: string; B: string };
  progress: {
    agents_per_path: number;
    agent_states: { A: AgentState[]; B: AgentState[] };
  };
  paths: { A: PathData; B: PathData };
  comparison: {
    winnerByKpi: Partial<Record<keyof KPIs, "A" | "B">>;
    overallWinner: "A" | "B";
  };
  meta: {
    latencyMs: number;
    llmCalls: number;
    estimatedCostEur: number;
    fallbackUsed: boolean;
    cachedReplay: boolean;
    generatedAt: string;
    schemaVersion?: string;
  };
}

export interface ErrorResponse {
  runId?: string;
  status: "error";
  error: {
    code: string;
    message: string;
    recoverable: boolean;
    details?: Record<string, unknown>;
  };
  recovery?: {
    canUseCache: boolean;
    fallbackViz: boolean;
  };
}

export const AGENT_ROLES: Record<VizType, [string, string, string, string]> = {
  map: ["Customer", "Competitor", "Market", "Cash Flow"],
  flow: ["Resource Impact", "Opportunity Cost", "Market Timing", "Cash Flow"],
  network: ["Stakeholder", "Partnership", "Ecosystem", "Risk-Reward"],
  fallback: ["Analyst", "Strategist", "Risk Advisor", "Financial"],
};
