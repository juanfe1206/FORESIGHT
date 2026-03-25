import OpenAI from "openai";
import type { AgentOutput, KPIs, PathSynthesis, SimulationRequest } from "@/lib/types";

const SYNTHESIS_SYSTEM_PROMPT = `You synthesize one simulation path for a side-by-side comparison dashboard. You will be called once per path — your job is to faithfully represent THIS path's strengths and weaknesses relative to the alternative.

Return JSON only with this exact shape:
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

Summary rules:
- 1-3 sentences capturing the core strategic thesis of this path. Lead with the most important tradeoff.

KPI definitions and scales:
- revenueImpact: integer -100 to 100. Estimated % change in revenue vs current baseline if this path is chosen. Negative = decline. Anchor to the business context (monthlyRevenue, customer base size) and weight by agent confidence scores — low-confidence insights should pull the estimate toward 0.
- risk: integer 0 to 100. Overall risk score. Higher = riskier. Weight low-grounding ("assumed") agent insights and uncertainty signals heavily. A path relying mostly on assumptions should score ≥60.
- customerImpact: integer 0 to 100. How positively customers are affected. Higher = better. Consider acquisition, retention, satisfaction, and experience changes.
- operatingCosts: realistic monthly operating cost in the same currency and order-of-magnitude as the provided monthlyRevenue. Must be an absolute €-figure, not a percentage. If monthlyRevenue is €14,500, operatingCosts should be in the thousands, not millions.
- competitiveExposure: integer 0 to 100. How exposed this path leaves the business to competitive threats. Higher = more exposed. Consider defensibility, imitation risk, and competitor reaction speed.
- overallScore: integer 0 to 100. Weighted composite calculated as: 30% × ((revenueImpact + 100) / 2) + 25% × (100 - risk) + 25% × customerImpact + 20% × (100 - competitiveExposure). Round to nearest integer.
- opportunityCost: one concrete sentence naming the specific upside this path sacrifices by not choosing the alternative. Must reference something the alternative path distinctively offers.

Differentiation rules (critical):
- You are given this path label AND the alternative path label. Your KPIs must reflect the genuine tradeoffs between the two.
- Each numeric KPI must be grounded in at least one specific agent insight from the provided outputs. Mentally cite the agent role + insight that supports each score.
- KPI values MUST differ meaningfully from what the alternative path would produce. Aim for at least 10-15 points of separation on most 0-100 KPIs. If both paths would score similarly on a metric, explain why in the summary.
- opportunityCost must name a concrete advantage the alternative path has that this path does not — never a generic platitude.

Evidence weighting:
- Agent insights with grounding="supplied" and confidence ≥0.7 are strong evidence — lean on them.
- Agent insights with grounding="assumed" or confidence <0.4 are weak evidence — discount them and let their uncertainty increase your risk score.
- If agents disagree, acknowledge the tension in your summary and let the lower-confidence view moderate your KPIs rather than ignoring it.

Timeline rules:
- 2-6 entries. Month must be integer 1..12.
- Entries should be in chronological order.
- Each narrative should describe a concrete event or milestone, not a vague phase label.
- Drivers must reference at least one agent role whose insight supports that timeline entry.

Do not include markdown, commentary, or any extra keys.`;

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
  alternativePathLabel: string;
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
  if (input.context.businessType) contextLines.push(`Business type: ${input.context.businessType}`);
  if (input.context.location) contextLines.push(`Location: ${input.context.location}`);
  if (input.context.customerBase) contextLines.push(`Customer base: ${input.context.customerBase}`);
  if (typeof input.context.monthlyRevenue === "number") {
    contextLines.push(`Monthly revenue: €${input.context.monthlyRevenue}`);
  }
  if (typeof input.context.employeeCount === "number") {
    contextLines.push(`Employees: ${input.context.employeeCount}`);
  }
  if (input.context.productsOrServices) contextLines.push(`Products/services: ${input.context.productsOrServices}`);
  if (input.context.confirmedCompetitors && input.context.confirmedCompetitors.length > 0) {
    const names = input.context.confirmedCompetitors.map((c) => c.name).join(", ");
    contextLines.push(`Known competitors nearby: ${names}`);
  }
  if (input.context.details) contextLines.push(`Details: ${input.context.details}`);
  const contextBlock = contextLines.length > 0 ? `\nBusiness context:\n${contextLines.join("\n")}` : "";
  const agentLines = input.agents
    .map((agent, index) => {
      return `${index + 1}. role="${agent.role}" confidence=${agent.confidence} grounding=${agent.grounding}\n   insight="${agent.insight}"`;
    })
    .join("\n");

  return `THIS path label: ${input.pathLabel}
ALTERNATIVE path label: ${input.alternativePathLabel}
(Produce KPIs that reflect the genuine differences between these two paths. Each KPI must be traceable to at least one agent insight below.)${contextBlock}

Agent outputs for THIS path:
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
        max_tokens: 800,
        // Lower sampling temp for more stable KPI/timeline synthesis.
        temperature: 0.45,
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
