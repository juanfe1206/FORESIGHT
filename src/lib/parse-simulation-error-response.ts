import type { ErrorResponse } from "@/lib/types";

export function parseSimulationErrorResponse(data: unknown): ErrorResponse | null {
  if (typeof data !== "object" || data === null) return null;
  const o = data as Partial<ErrorResponse>;
  if (o.status !== "error") return null;
  if (!o.error || typeof o.error.code !== "string") return null;
  return data as ErrorResponse;
}
