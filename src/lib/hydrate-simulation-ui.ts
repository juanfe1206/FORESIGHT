import { isVizType } from "@/lib/ui-state";
import type {
  AgentOutput,
  KPIs,
  PathSynthesis,
  SimulationResponse,
  VizType,
} from "@/lib/types";

export type SimulationHydrationSlice = {
  vizType: VizType;
  pathLabels: [string, string];
  agentResults: { A: AgentOutput[]; B: AgentOutput[] };
  synthesisResults: { A: PathSynthesis; B: PathSynthesis };
  kpiResults: { A: KPIs; B: KPIs };
  comparison: SimulationResponse["comparison"];
  meta: SimulationResponse["meta"];
};

export function buildHydrationFromSimulationResponse(
  res: SimulationResponse,
  opts: { cachedReplay: boolean },
): SimulationHydrationSlice {
  return {
    vizType: isVizType(res.viz_type) ? res.viz_type : "map",
    pathLabels: [res.path_labels.A, res.path_labels.B],
    agentResults: { A: res.paths.A.agents, B: res.paths.B.agents },
    synthesisResults: { A: res.paths.A.synthesis, B: res.paths.B.synthesis },
    kpiResults: { A: res.paths.A.kpis, B: res.paths.B.kpis },
    comparison: res.comparison,
    meta: { ...res.meta, cachedReplay: opts.cachedReplay ? true : res.meta.cachedReplay },
  };
}
