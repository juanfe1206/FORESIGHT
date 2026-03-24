import type { ErrorResponse, SimulationResponse } from "@/lib/types";
import { MOCK_SIMULATION_RESPONSE } from "@/lib/mock-fixture";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./rate-limit";
import { validateSimulationRequest } from "./validate";

const createErrorResponse = (
  code: string,
  message: string,
  recoverable: boolean,
  status: number,
): Response => {
  const errorBody: ErrorResponse = {
    runId: `run_${Date.now()}`,
    status: "error",
    error: {
      code,
      message,
      recoverable,
    },
    recovery: {
      canUseCache: false,
      fallbackViz: false,
    },
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

    const responseBody: SimulationResponse = {
      ...MOCK_SIMULATION_RESPONSE,
      runId: `run_${Date.now()}`,
      status: "completed",
    };

    return Response.json(responseBody, { status: 200 });
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
