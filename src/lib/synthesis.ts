import OpenAI from "openai";
import type { AgentOutput, KPIs, PathSynthesis, SimulationRequest } from "@/lib/types";

const SYNTHESIS_SYSTEM_PROMPT = `You synthesize one simulation path into canonical dashboard output.
Return JSON only with this shape:
{
  "summary": "string",
  "timeline": [{ "month": 1, "narrative": "string", "drivers": ["string"] }],
  "kpis": {
    "revenueImpact": number,
    "risk": number,
    "customerImpact": number,
    "operatingCosts": number,
    "competitiveExposure": number,
    "opportunityCost": "string",
    "overallScore": number
  }
}
Rules:
- Use only the provided path label, context, and agent outputs.
- Timeline max 6 entries.
- Month must be integer 1..12.
- Do not include markdown or any extra keys.`;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const estimateSynthesisCostEur = (model: string): number => {
  const m = model.toLowerCase();
  if (m.includes("mini")) return 0.018;
  if (m.includes("nano")) return 0.01;
  return 0.03;
};

export class SynthesisTimeoutError extends Error {
  readonly kind = "SynthesisTimeoutError" as const;

  constructor(message = "Synthesis execution timed out.") {
    super(message);
    this.name = "SynthesisTimeoutError";
  }
}

export class SynthesisProviderError extends Error {
  readonly kind = "SynthesisProviderError" as const;

  constructor(message = "Synthesis provider returned an error.") {
    super(message);
    this.name = "SynthesisProviderError";
  }
}

export class SynthesisParseError extends Error {
  readonly kind = "SynthesisParseError" as const;

  constructor(message = "Synthesis response could not be parsed.") {
    super(message);
    this.name = "SynthesisParseError";
  }
}

export class SynthesisValidationError extends Error {
  readonly kind = "SynthesisValidationError" as const;

  constructor(message = "Synthesis response failed validation.") {
    super(message);
    this.name = "SynthesisValidationError";
  }
}

export interface SynthesizePathInput {
  pathLabel: string;
  agents: AgentOutput[];
  context: SimulationRequest["context"];
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface SynthesizePathResult {
  synthesis: PathSynthesis;
  kpis: KPIs;
  telemetry: {
    llmCalls: number;
    estimatedCostEur: number;
  };
}

function buildSynthesisPrompt(input: SynthesizePathInput): string {
  const contextLines: string[] = [];
  if (input.context.industry) contextLines.push(`Industry: ${input.context.industry}`);
  if (input.context.location) contextLines.push(`Location: ${input.context.location}`);
  if (input.context.customerBase) contextLines.push(`Customer base: ${input.context.customerBase}`);
  if (typeof input.context.monthlyRevenue === "number") {
    contextLines.push(`Monthly revenue: ${input.context.monthlyRevenue}`);
  }
  if (input.context.details) contextLines.push(`Details: ${input.context.details}`);
  const contextBlock = contextLines.length > 0 ? `\nContext:\n${contextLines.join("\n")}` : "";
  const agentLines = input.agents
    .map((agent, index) => {
      return `${index + 1}. role="${agent.role}" confidence=${agent.confidence} grounding=${agent.grounding}\ninsight="${agent.insight}"`;
    })
    .join("\n");

  return `Path label: ${input.pathLabel}${contextBlock}
Agent outputs:
${agentLines}`;
}

function normalizeTimeline(raw: unknown): PathSynthesis["timeline"] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new SynthesisValidationError("Timeline must be a non-empty array.");
  }

  const seenMonths = new Set<number>();
  return raw.slice(0, 6).map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new SynthesisValidationError(`Timeline entry ${index + 1} must be an object.`);
    }
    const item = entry as Record<string, unknown>;
    const month = toNumber(item.month, Number.NaN);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new SynthesisValidationError(`Timeline entry ${index + 1} has invalid month.`);
    }
    if (seenMonths.has(month)) {
      throw new SynthesisValidationError(`Timeline entry ${index + 1} has duplicate month ${month}.`);
    }
    seenMonths.add(month);
    const narrative = String(item.narrative ?? "").trim();
    if (!narrative) {
      throw new SynthesisValidationError(`Timeline entry ${index + 1} is missing narrative.`);
    }
    const rawDrivers = Array.isArray(item.drivers) ? item.drivers : [];
    const drivers = rawDrivers
      .map((driver) => String(driver ?? "").trim())
      .filter((driver) => driver.length > 0);
    if (drivers.length === 0) {
      throw new SynthesisValidationError(`Timeline entry ${index + 1} must include drivers.`);
    }
    return { month, narrative, drivers };
  });
}

function normalizeKpis(raw: unknown): KPIs {
  if (typeof raw !== "object" || raw === null) {
    throw new SynthesisValidationError("KPIs object is missing.");
  }
  const source = raw as Record<string, unknown>;
  const opportunityCost = String(source.opportunityCost ?? "").trim();
  if (!opportunityCost) {
    throw new SynthesisValidationError("KPI opportunityCost must be non-empty.");
  }

  return {
    revenueImpact: clamp(toNumber(source.revenueImpact), -100, 100),
    risk: clamp(toNumber(source.risk), 0, 100),
    customerImpact: clamp(toNumber(source.customerImpact), 0, 100),
    operatingCosts: clamp(toNumber(source.operatingCosts), 0, 1_000_000_000),
    competitiveExposure: clamp(toNumber(source.competitiveExposure), 0, 100),
    opportunityCost,
    overallScore: clamp(toNumber(source.overallScore), 0, 100),
  };
}

function normalizeSynthesisResult(raw: unknown): Pick<SynthesizePathResult, "synthesis" | "kpis"> {
  if (typeof raw !== "object" || raw === null) {
    throw new SynthesisValidationError("Synthesis output must be an object.");
  }

  const payload = raw as Record<string, unknown>;
  const summary = String(payload.summary ?? "").trim();
  if (!summary) {
    throw new SynthesisValidationError("Synthesis summary must be non-empty.");
  }

  return {
    synthesis: {
      summary,
      timeline: normalizeTimeline(payload.timeline),
    },
    kpis: normalizeKpis(payload.kpis),
  };
}

export async function synthesizePath(input: SynthesizePathInput): Promise<SynthesizePathResult> {
  if (!input.pathLabel || input.pathLabel.trim().length === 0) {
    throw new SynthesisValidationError("Path label is required for synthesis.");
  }
  if (!Array.isArray(input.agents) || input.agents.length === 0) {
    throw new SynthesisValidationError("Synthesis requires at least one agent output.");
  }

  const client = new OpenAI({ apiKey: input.apiKey });
  let completion;

  try {
    completion = await client.chat.completions.create(
      {
        model: input.model,
        messages: [
          { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
          { role: "user", content: buildSynthesisPrompt(input) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3,
      },
      { signal: AbortSignal.timeout(input.timeoutMs) },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new SynthesisTimeoutError(`Synthesis for "${input.pathLabel}" timed out.`);
    }
    throw new SynthesisProviderError(error instanceof Error ? error.message : String(error));
  }

  const content = completion.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new SynthesisParseError(`Synthesis for "${input.pathLabel}" returned invalid JSON.`);
  }

  const normalized = normalizeSynthesisResult(parsed);
  return {
    ...normalized,
    telemetry: {
      llmCalls: 1,
      estimatedCostEur: estimateSynthesisCostEur(input.model),
    },
  };
}
