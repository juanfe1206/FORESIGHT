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

  const businessTypeError = validateContextString(context.businessType, "context.businessType");
  if (businessTypeError) return businessTypeError;
  if (typeof context.businessType === "string" && context.businessType.length > 50) {
    return { valid: false, code: "VALIDATION_ERROR", message: "context.businessType must be 50 characters or fewer." };
  }

  if (context.employeeCount !== undefined) {
    if (typeof context.employeeCount !== "number" || context.employeeCount < 0) {
      return { valid: false, code: "VALIDATION_ERROR", message: "context.employeeCount must be a number >= 0 when provided." };
    }
  }

  const productsError = validateContextString(context.productsOrServices, "context.productsOrServices");
  if (productsError) return productsError;

  if (context.confirmedCompetitors !== undefined) {
    if (!Array.isArray(context.confirmedCompetitors)) {
      return { valid: false, code: "VALIDATION_ERROR", message: "context.confirmedCompetitors must be an array when provided." };
    }
    for (const comp of context.confirmedCompetitors) {
      if (typeof comp !== "object" || comp === null) {
        return { valid: false, code: "VALIDATION_ERROR", message: "Each confirmedCompetitor must be an object." };
      }
      const c = comp as Record<string, unknown>;
      if (typeof c.name !== "string" || typeof c.lat !== "number" || typeof c.lng !== "number") {
        return { valid: false, code: "VALIDATION_ERROR", message: "Each confirmedCompetitor must have name (string), lat (number), lng (number)." };
      }
    }
  }

  if (context.confirmedLocation !== undefined) {
    if (typeof context.confirmedLocation !== "object" || context.confirmedLocation === null) {
      return { valid: false, code: "VALIDATION_ERROR", message: "context.confirmedLocation must be an object when provided." };
    }
    const loc = context.confirmedLocation as Record<string, unknown>;
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      return { valid: false, code: "VALIDATION_ERROR", message: "context.confirmedLocation must have lat (number) and lng (number)." };
    }
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
        ...(typeof context.businessType === "string" ? { businessType: context.businessType } : undefined),
        ...(typeof context.employeeCount === "number" ? { employeeCount: context.employeeCount } : undefined),
        ...(typeof context.productsOrServices === "string" ? { productsOrServices: context.productsOrServices } : undefined),
        ...(Array.isArray(context.confirmedCompetitors) ? { confirmedCompetitors: context.confirmedCompetitors as SimulationRequest["context"]["confirmedCompetitors"] } : undefined),
        ...(typeof context.confirmedLocation === "object" && context.confirmedLocation !== null ? { confirmedLocation: context.confirmedLocation as SimulationRequest["context"]["confirmedLocation"] } : undefined),
      },
      ...(options ? { options } : undefined),
    },
  };
}
