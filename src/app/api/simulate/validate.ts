import type { SimulationRequest } from "@/lib/types";

type ValidationSuccess = { valid: true; data: SimulationRequest };
type ValidationFailure = { valid: false; code: string; message: string };

const MAX_DECISION_LENGTH = 2000;
const MAX_CONTEXT_STRING_LENGTH = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateContextString = (value: unknown, fieldName: string): ValidationFailure | null => {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: `${fieldName} must be a string.`,
    };
  }

  if (value.length > MAX_CONTEXT_STRING_LENGTH) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: `${fieldName} must be ${MAX_CONTEXT_STRING_LENGTH} characters or fewer.`,
    };
  }

  return null;
};

export function validateSimulationRequest(body: unknown): ValidationSuccess | ValidationFailure {
  if (!isRecord(body)) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: "Request body must be a JSON object.",
    };
  }

  const decision = body.decision;
  if (typeof decision !== "string" || decision.trim().length === 0) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: "decision must be a non-empty string.",
    };
  }

  if (decision.length > MAX_DECISION_LENGTH) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: `decision must be ${MAX_DECISION_LENGTH} characters or fewer.`,
    };
  }

  const contextValue = body.context;
  if (contextValue !== undefined && !isRecord(contextValue)) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: "context must be an object when provided.",
    };
  }

  const context = contextValue ?? {};
  const industryError = validateContextString(context.industry, "context.industry");
  if (industryError) {
    return industryError;
  }

  const locationError = validateContextString(context.location, "context.location");
  if (locationError) {
    return locationError;
  }

  const customerBaseError = validateContextString(context.customerBase, "context.customerBase");
  if (customerBaseError) {
    return customerBaseError;
  }

  const detailsError = validateContextString(context.details, "context.details");
  if (detailsError) {
    return detailsError;
  }

  if (context.monthlyRevenue !== undefined && typeof context.monthlyRevenue !== "number") {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: "context.monthlyRevenue must be a number when provided.",
    };
  }

  const optionsValue = body.options;
  if (optionsValue !== undefined && !isRecord(optionsValue)) {
    return {
      valid: false,
      code: "VALIDATION_ERROR",
      message: "options must be an object when provided.",
    };
  }

  const options: SimulationRequest["options"] = optionsValue
    ? {
        ...(typeof optionsValue.stream === "boolean"
          ? { stream: optionsValue.stream }
          : undefined),
        ...(typeof optionsValue.useCachedOnFailure === "boolean"
          ? { useCachedOnFailure: optionsValue.useCachedOnFailure }
          : undefined),
        ...(typeof optionsValue.demoScenarioId === "string"
          ? { demoScenarioId: optionsValue.demoScenarioId }
          : undefined),
      }
    : undefined;

  return {
    valid: true,
    data: {
      decision,
      context: {
        ...(typeof context.industry === "string" ? { industry: context.industry } : undefined),
        ...(typeof context.monthlyRevenue === "number"
          ? { monthlyRevenue: context.monthlyRevenue }
          : undefined),
        ...(typeof context.location === "string" ? { location: context.location } : undefined),
        ...(typeof context.customerBase === "string"
          ? { customerBase: context.customerBase }
          : undefined),
        ...(typeof context.details === "string" ? { details: context.details } : undefined),
      },
      ...(options ? { options } : undefined),
    },
  };
}
