import {
  classifyDecision,
  ParseError,
  ProviderError,
  ProviderTimeoutError,
} from "@/lib/classifier";
import { AgentPartialFailureError, runParallelAgents } from "@/lib/agents";
import {
  SynthesisParseError,
  SynthesisProviderError,
  SynthesisTimeoutError,
  SynthesisValidationError,
  synthesizePath,
} from "@/lib/synthesis";
import { overallWinner, winnerByKpi } from "@/lib/scoring";
import type { ErrorResponse, SimulationResponse } from "@/lib/types";
import { MOCK_SIMULATION_RESPONSE } from "@/lib/mock-fixture";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./rate-limit";
import { validateSimulationRequest } from "./validate";

const CLASSIFY_RECOVERY = {
  canUseCache: true,
  fallbackViz: true,
} as const;

const createErrorResponse = (
  code: string,
  message: string,
  recoverable: boolean,
  status: number,
  recovery: ErrorResponse["recovery"] = {
    canUseCache: false,
    fallbackViz: false,
  },
  details?: Record<string, unknown>,
): Response => {
  const errorBody: ErrorResponse = {
    runId: `run_${Date.now()}`,
    status: "error",
    error: {
      code,
      message,
      recoverable,
      ...(details ? { details } : {}),
    },
    recovery,
  };

  return Response.json(errorBody, { status });
};

const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "unknown";
  }

  return forwardedFor.split(",")[0]?.trim() || "unknown";
};

const validateSimulationResponse = (value: unknown): value is SimulationResponse => {
  if (typeof value !== "object" || value === null) return false;
  const res = value as SimulationResponse;

  if (!res.runId || !res.path_labels?.A || !res.path_labels?.B) return false;
  if (!res.paths?.A || !res.paths?.B) return false;
  if (!res.paths.A.synthesis?.summary || !res.paths.B.synthesis?.summary) return false;
  if (!res.paths.A.kpis || !res.paths.B.kpis) return false;
  if (!res.comparison?.overallWinner || !res.comparison?.winnerByKpi) return false;
  if (!res.meta?.generatedAt || typeof res.meta.latencyMs !== "number") return false;
  return true;
};

const buildEstimatedCost = (synthesisCosts: [number, number]): number => {
  const classifyCostEur = 0.008;
  const agentCostEur = 8 * 0.012;
  const total = classifyCostEur + agentCostEur + synthesisCosts[0] + synthesisCosts[1];
  return Number(total.toFixed(3));
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return createErrorResponse(
        "RATE_LIMITED",
        "Too many requests. Please retry in a moment.",
        true,
        429,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Request body must be valid JSON.", false, 400);
    }

    const validation = validateSimulationRequest(body);
    if (!validation.valid) {
      return createErrorResponse(validation.code, validation.message, false, 400);
    }

    if (!process.env.LLM_API_KEY) {
      return createErrorResponse(
        "MISSING_CONFIG",
        "Server configuration is incomplete.",
        false,
        503,
      );
    }

    const model = process.env.LLM_MODEL_PARSE_CLASSIFY ?? "gpt-4o-mini";
    const agentModel = process.env.LLM_MODEL_AGENT ?? model;
    const timeoutMs = Number(process.env.SIMULATION_TIMEOUT_MS ?? "30000");
    const concurrency = Number(process.env.AGENT_CONCURRENCY_LIMIT ?? "4") || 4;
    const startedAt = Date.now();

    try {
      const { path_labels, viz_type, roles } = await classifyDecision(
        validation.data.decision,
        validation.data.context,
        process.env.LLM_API_KEY,
        model,
        timeoutMs,
      );
      const agentRun = await runParallelAgents({
        pathLabels: path_labels,
        roles,
        context: validation.data.context,
        apiKey: process.env.LLM_API_KEY,
        model: agentModel,
        timeoutMs,
        concurrency,
      });

      const [pathA, pathB] = await Promise.all([
        synthesizePath({
          pathLabel: path_labels.A,
          agents: agentRun.agentsByPath.A,
          context: validation.data.context,
          apiKey: process.env.LLM_API_KEY,
          model: agentModel,
          timeoutMs,
        }),
        synthesizePath({
          pathLabel: path_labels.B,
          agents: agentRun.agentsByPath.B,
          context: validation.data.context,
          apiKey: process.env.LLM_API_KEY,
          model: agentModel,
          timeoutMs,
        }),
      ]);

      const comparison = {
        winnerByKpi: winnerByKpi(pathA.kpis, pathB.kpis),
        overallWinner: overallWinner(pathA.kpis, pathB.kpis),
      } as const;

      const latencyMs = Date.now() - startedAt;
      const llmCalls = 1 + 8 + pathA.telemetry.llmCalls + pathB.telemetry.llmCalls;
      const estimatedCostEur = buildEstimatedCost([
        pathA.telemetry.estimatedCostEur,
        pathB.telemetry.estimatedCostEur,
      ]);
      const generatedAt = new Date().toISOString();

      const responseBody: SimulationResponse = {
        ...MOCK_SIMULATION_RESPONSE,
        runId: `run_${Date.now()}`,
        status: "completed",
        viz_type,
        path_labels,
        paths: {
          A: {
            ...MOCK_SIMULATION_RESPONSE.paths.A,
            agents: agentRun.agentsByPath.A,
            synthesis: pathA.synthesis,
            kpis: pathA.kpis,
          },
          B: {
            ...MOCK_SIMULATION_RESPONSE.paths.B,
            agents: agentRun.agentsByPath.B,
            synthesis: pathB.synthesis,
            kpis: pathB.kpis,
          },
        },
        comparison,
        meta: {
          ...MOCK_SIMULATION_RESPONSE.meta,
          latencyMs,
          llmCalls,
          estimatedCostEur,
          fallbackUsed: false,
          cachedReplay: false,
          generatedAt,
        },
      };

      if (!validateSimulationResponse(responseBody)) {
        return createErrorResponse(
          "RESPONSE_VALIDATION_ERROR",
          "Simulation output failed schema validation.",
          true,
          502,
          CLASSIFY_RECOVERY,
        );
      }

      return Response.json(responseBody, { status: 200 });
    } catch (error) {
      if (error instanceof ProviderTimeoutError) {
        return createErrorResponse(
          "PROVIDER_TIMEOUT",
          "Simulation timed out. Try again.",
          true,
          504,
          CLASSIFY_RECOVERY,
        );
      }
      if (error instanceof ProviderError) {
        return createErrorResponse(
          "PROVIDER_ERROR",
          "Simulation provider unavailable.",
          true,
          502,
          CLASSIFY_RECOVERY,
        );
      }
      if (error instanceof ParseError) {
        return createErrorResponse(
          "PARSE_ERROR",
          "Could not interpret simulation result.",
          true,
          502,
          CLASSIFY_RECOVERY,
        );
      }
      if (error instanceof AgentPartialFailureError) {
        return createErrorResponse(
          "PARTIAL_AGENT_FAILURE",
          "One or more agent slots failed.",
          true,
          502,
          CLASSIFY_RECOVERY,
          { failures: error.failures },
        );
      }
      if (error instanceof SynthesisTimeoutError) {
        return createErrorResponse(
          "SYNTHESIS_TIMEOUT",
          "Synthesis timed out while assembling results.",
          true,
          504,
          CLASSIFY_RECOVERY,
        );
      }
      if (error instanceof SynthesisProviderError) {
        return createErrorResponse(
          "SYNTHESIS_PROVIDER_ERROR",
          "Synthesis provider unavailable.",
          true,
          502,
          CLASSIFY_RECOVERY,
        );
      }
      if (error instanceof SynthesisParseError || error instanceof SynthesisValidationError) {
        return createErrorResponse(
          "SYNTHESIS_PARSE_ERROR",
          "Could not assemble simulation synthesis.",
          true,
          502,
          CLASSIFY_RECOVERY,
        );
      }
      throw error;
    }

  } catch (err) {
    console.error("[/api/simulate] Unexpected error:", err);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Unexpected server error while processing simulation request.",
      false,
      500,
    );
  }
}
