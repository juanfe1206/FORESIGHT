import type { SimulationResponse } from "@/lib/types";

/** Structural validation shared by `/api/simulate` and client cache read/write paths. */
export function validateSimulationResponse(value: unknown): value is SimulationResponse {
  if (typeof value !== "object" || value === null) return false;
  const res = value as SimulationResponse;

  if (!res.runId || !res.path_labels?.A || !res.path_labels?.B) return false;
  if (!res.paths?.A || !res.paths?.B) return false;
  if (!Array.isArray(res.paths.A.agents) || !Array.isArray(res.paths.B.agents)) return false;
  if (!res.paths.A.synthesis?.summary || !res.paths.B.synthesis?.summary) return false;
  if (!res.paths.A.kpis || !res.paths.B.kpis) return false;
  if (res.comparison?.overallWinner !== "A" && res.comparison?.overallWinner !== "B") return false;
  if (!res.comparison?.winnerByKpi) return false;
  if (!res.meta?.generatedAt || !Number.isFinite(res.meta.latencyMs)) return false;
  return true;
}
