import OpenAI from "openai";
import { AGENT_ROLES, type SimulationRequest, type VizType } from "@/lib/types";
import { DEMO_SCENARIOS, type DemoScenarioId } from "@/lib/demo-scenarios";
import { derivePathLabels } from "@/lib/derive-path-labels";

export interface ClassifyResult {
  path_labels: { A: string; B: string };
  viz_type: VizType;
  roles: [string, string, string, string];
}

export class ProviderTimeoutError extends Error {
  readonly kind = "ProviderTimeoutError" as const;

  constructor(message = "LLM provider timed out.") {
    super(message);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderError extends Error {
  readonly kind = "ProviderError" as const;

  constructor(message = "LLM provider returned an error.") {
    super(message);
    this.name = "ProviderError";
  }
}

export class ParseError extends Error {
  readonly kind = "ParseError" as const;

  constructor(message = "LLM response could not be parsed.") {
    super(message);
    this.name = "ParseError";
  }
}

const CLASSIFY_SYSTEM_PROMPT = `You are a business decision classifier. Given a business decision and context, you must:
1. Extract the two distinct options being considered as path_a and path_b, using the user's exact wording where possible.
2. Classify the decision type as exactly one of: "map", "flow", or "network".

Classification rules:
- "map": decision involves location, geographic reach, local market, physical presence, territory, or place-based customers
- "flow": decision involves budget, resource allocation, investment, capacity, cost, staffing, or time allocation
- "network": decision involves partnerships, stakeholders, relationships, collaborations, or ecosystem dynamics

Respond with a JSON object only. No explanation, no markdown, no surrounding text. Example:
{"path_a": "Invest in Instagram ads", "path_b": "Partner with Cafe Central", "viz_type": "map"}`;

const VALID_VIZ = new Set<VizType>(["map", "flow", "network"]);

function buildUserPrompt(decision: string, context: SimulationRequest["context"]): string {
  const contextParts: string[] = [];
  if (context.industry) contextParts.push(`Industry: ${context.industry}`);
  if (context.location) contextParts.push(`Location: ${context.location}`);
  if (context.customerBase) contextParts.push(`Customer base: ${context.customerBase}`);
  if (typeof context.monthlyRevenue === "number") {
    contextParts.push(`Monthly revenue: €${context.monthlyRevenue}`);
  }
  if (context.details) contextParts.push(`Additional details: ${context.details}`);

  const contextBlock = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : "";
  return `Decision: ${decision.trim()}${contextBlock}`;
}

export async function classifyDecision(
  decision: string,
  context: SimulationRequest["context"],
  apiKey: string,
  model: string,
  timeoutMs: number,
  demoScenarioId?: string,
): Promise<ClassifyResult> {
  // Demo-mode: when a stable demoScenarioId is provided, return deterministic mapping
  // (no OpenAI call) so CI/demo rehearsals stay repeatable.
  if (demoScenarioId && demoScenarioId in DEMO_SCENARIOS) {
    const scenario = DEMO_SCENARIOS[demoScenarioId as DemoScenarioId]!;
    const [A, B] = derivePathLabels(decision);
    return {
      path_labels: { A, B },
      viz_type: scenario.expectedVizType,
      roles: AGENT_ROLES[scenario.expectedVizType],
    };
  }

  const client = new OpenAI({ apiKey });

  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(decision, context) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.2,
      },
      { signal: AbortSignal.timeout(timeoutMs) },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ProviderTimeoutError();
    }
    throw new ProviderError(error instanceof Error ? error.message : String(error));
  }

  const raw = completion.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ParseError(`Non-JSON response: ${raw.slice(0, 100)}`);
  }

  const p = parsed as Record<string, unknown>;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof p.path_a !== "string" ||
    typeof p.path_b !== "string" ||
    typeof p.viz_type !== "string"
  ) {
    throw new ParseError("Missing required fields in LLM response.");
  }

  if (!p.path_a || !p.path_b) {
    throw new ParseError("LLM returned empty path labels.");
  }

  const normalized = p as { path_a: string; path_b: string; viz_type: string };
  const viz_type: VizType = VALID_VIZ.has(normalized.viz_type as VizType)
    ? (normalized.viz_type as VizType)
    : "network";
  const roles = AGENT_ROLES[viz_type];

  return {
    path_labels: {
      A: normalized.path_a,
      B: normalized.path_b,
    },
    viz_type,
    roles,
  };
}
