import OpenAI from "openai";
import pLimit from "p-limit";
import type { AgentOutput, GroundingLevel, SimulationRequest } from "@/lib/types";

type PathKey = "A" | "B";
type SlotIndex = 1 | 2 | 3 | 4;

export interface AgentFailure {
  path: PathKey;
  slot: SlotIndex;
  role: string;
  reason: string;
}

export interface RunParallelAgentsInput {
  pathLabels: { A: string; B: string };
  roles: [string, string, string, string];
  context: SimulationRequest["context"];
  apiKey: string;
  model: string;
  timeoutMs: number;
  concurrency: number;
}

export interface RunAgentsResult {
  agentsByPath: { A: AgentOutput[]; B: AgentOutput[] };
}

export class AgentTimeoutError extends Error {
  readonly kind = "AgentTimeoutError" as const;

  constructor(message = "Agent execution timed out.") {
    super(message);
    this.name = "AgentTimeoutError";
  }
}

export class AgentProviderError extends Error {
  readonly kind = "AgentProviderError" as const;

  constructor(message = "Agent provider returned an error.") {
    super(message);
    this.name = "AgentProviderError";
  }
}

export class AgentParseError extends Error {
  readonly kind = "AgentParseError" as const;

  constructor(message = "Agent response could not be parsed.") {
    super(message);
    this.name = "AgentParseError";
  }
}

export class AgentPartialFailureError extends Error {
  readonly kind = "AgentPartialFailureError" as const;
  readonly failures: AgentFailure[];

  constructor(failures: AgentFailure[]) {
    super("One or more agent slots failed.");
    this.name = "AgentPartialFailureError";
    this.failures = failures;
  }
}

const VALID_GROUNDING = new Set<GroundingLevel>(["supplied", "mixed", "assumed"]);

const ROLE_PERSONAS: Record<string, string> = {
  "Customer": "You think like a customer strategist. Focus on acquisition cost, retention, lifetime value, satisfaction drivers, and how the target customer segment will perceive this path vs the alternative.",
  "Competitor": "You think like a competitive intelligence analyst. Focus on how competitors will react, market share shifts, defensibility, first-mover dynamics, and competitive gaps this path opens or closes.",
  "Market": "You think like a market analyst. Focus on market timing, demand trends, addressable market size, regulatory shifts, and macro/micro-economic forces that favor or hinder this path.",
  "Cash Flow": "You think like a CFO. Focus on cash runway, burn rate, break-even timeline, working capital needs, and how the capital structure changes under this path.",
  "Resource Impact": "You think like a COO. Focus on team capacity, operational bottlenecks, required hires, skill gaps, and infrastructure readiness for this path.",
  "Opportunity Cost": "You think like a strategic economist. Focus on what is sacrificed by choosing this path — the forgone revenue, delayed projects, locked-in commitments, and switching costs.",
  "Market Timing": "You think like a market strategist. Focus on whether the timing is right — seasonal demand, competitive windows, technology adoption curves, and first/late mover tradeoffs.",
  "Stakeholder": "You think like a stakeholder relations advisor. Focus on how employees, investors, partners, and community will respond to this path — alignment, buy-in risks, and morale effects.",
  "Partnership": "You think like a business development lead. Focus on partnership leverage, co-branding value, channel access, contractual risks, and mutual dependency under this path.",
  "Ecosystem": "You think like a platform/ecosystem strategist. Focus on network effects, supplier relationships, integration complexity, and how this path strengthens or weakens the wider business ecosystem.",
  "Risk-Reward": "You think like a risk manager. Focus on downside scenarios, probability-weighted outcomes, reversibility, and whether the upside justifies the exposure under this path.",
  "Analyst": "You think like a general business analyst. Focus on the overall strategic fit, data quality, assumptions being made, and logical consistency of this path.",
  "Strategist": "You think like a corporate strategist. Focus on long-term positioning, sustainable advantage, strategic coherence, and alignment with the business's core strengths.",
  "Risk Advisor": "You think like a risk advisor. Focus on tail risks, regulatory exposure, reputational hazards, and how recoverable failures would be under this path.",
  "Financial": "You think like a financial analyst. Focus on unit economics, margins, payback period, ROI projections, and capital efficiency under this path.",
};

const AGENT_SYSTEM_PROMPT = `You are a specialist business simulation agent assigned a specific analytical role. Your job is to produce ONE sharp, path-specific insight from that role's perspective.

CRITICAL — Differentiation:
Your insight MUST reflect what is distinctively true about THIS path and NOT the alternative. A generic observation that applies equally to both paths is a failure. Name the specific mechanism, tradeoff, or outcome that makes this path different.

Output format — return ONLY a JSON object with these keys:
- role: string (echo back your assigned role name)
- insight: string (one or two concrete sentences specific to THIS path's distinctive outcome; quantify with numbers, timeframes, or percentages when the context supports it)
- confidence: number 0 to 1 (see calibration guide below)
- grounding: "supplied" | "mixed" | "assumed" (see definitions below)

Confidence calibration:
- 0.85-1.0: the insight follows almost directly from the supplied data with minimal inference
- 0.6-0.84: the insight combines supplied data with reasonable domain knowledge
- 0.3-0.59: the insight requires significant assumptions beyond what was supplied
- 0.0-0.29: near-total speculation with little or no supporting data

Grounding definitions:
- "supplied": the insight is directly supported by facts in the provided context
- "mixed": the insight combines provided context with general business/industry knowledge
- "assumed": the context lacks relevant data, so the insight relies on general assumptions

When context is sparse, say so honestly via low confidence and "assumed" grounding — do not fabricate specifics.`;



function buildUserPrompt(
  pathLabel: string,
  alternativePathLabel: string,
  role: string,
  context: SimulationRequest["context"],
): string {
  const contextLines: string[] = [];
  if (context.industry) contextLines.push(`Industry: ${context.industry}`);
  if (context.businessType) contextLines.push(`Business type: ${context.businessType}`);
  if (context.location) contextLines.push(`Location: ${context.location}`);
  if (context.customerBase) contextLines.push(`Customer base: ${context.customerBase}`);
  if (typeof context.monthlyRevenue === "number") {
    contextLines.push(`Monthly revenue: €${context.monthlyRevenue}`);
  }
  if (typeof context.employeeCount === "number") {
    contextLines.push(`Employees: ${context.employeeCount}`);
  }
  if (context.productsOrServices) contextLines.push(`Products/services: ${context.productsOrServices}`);
  if (context.confirmedCompetitors && context.confirmedCompetitors.length > 0) {
    const names = context.confirmedCompetitors.map((c) => c.name).join(", ");
    contextLines.push(`Known competitors nearby: ${names}`);
  }
  if (context.details) contextLines.push(`Details: ${context.details}`);

  const contextBlock = contextLines.length ? `\nBusiness context:\n${contextLines.join("\n")}` : "";
  const persona = ROLE_PERSONAS[role] ?? "";
  const personaBlock = persona ? `\nRole guidance: ${persona}` : "";

  return `THIS path: ${pathLabel}
ALTERNATIVE path: ${alternativePathLabel}
Role: ${role}${personaBlock}${contextBlock}

From your role's perspective, what does THIS path specifically do differently from the alternative? Name the concrete mechanism, tradeoff, or outcome. Quantify with numbers, timeframes, or percentages when the business context supports it.`;
}

function normalizeAgentOutput(raw: unknown, expectedRole: string): AgentOutput {
  if (typeof raw !== "object" || raw === null) {
    throw new AgentParseError("Agent output must be a JSON object.");
  }

  const output = raw as Record<string, unknown>;
  if (typeof output.role !== "string" || output.role.trim().length === 0) {
    throw new AgentParseError("Agent output is missing a valid role.");
  }
  if (typeof output.insight !== "string" || output.insight.trim().length === 0) {
    throw new AgentParseError("Agent output is missing a valid insight.");
  }

  const numericConfidence =
    typeof output.confidence === "number"
      ? output.confidence
      : Number.parseFloat(String(output.confidence ?? "0"));
  const clampedConfidence = Number.isFinite(numericConfidence)
    ? Math.min(1, Math.max(0, numericConfidence))
    : 0;

  const groundingCandidate = String(output.grounding ?? "assumed").toLowerCase();
  const grounding: GroundingLevel = VALID_GROUNDING.has(groundingCandidate as GroundingLevel)
    ? (groundingCandidate as GroundingLevel)
    : "assumed";

  return {
    role: expectedRole,
    insight: output.insight.trim(),
    confidence: clampedConfidence,
    grounding,
  };
}

async function executeAgentSlot(
  client: OpenAI,
  input: RunParallelAgentsInput,
  path: PathKey,
  slot: SlotIndex,
): Promise<AgentOutput> {
  const role = input.roles[slot - 1];
  const pathLabel = input.pathLabels[path];
  const alternativePathLabel = input.pathLabels[path === "A" ? "B" : "A"];
  let completion;

  try {
    completion = await client.chat.completions.create(
      {
        model: input.model,
        messages: [
          { role: "system", content: AGENT_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(pathLabel, alternativePathLabel, role, input.context) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.7,
      },
      { signal: AbortSignal.timeout(input.timeoutMs) },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AgentTimeoutError(`Agent slot ${path}-${slot} timed out.`);
    }
    throw new AgentProviderError(error instanceof Error ? error.message : String(error));
  }

  const raw = completion.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AgentParseError(`Agent slot ${path}-${slot} returned invalid JSON.`);
  }

  return normalizeAgentOutput(parsed, role);
}

export async function runParallelAgents(input: RunParallelAgentsInput): Promise<RunAgentsResult> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const limit = pLimit(Math.max(1, input.concurrency));

  const tasks: Array<{
    path: PathKey;
    slot: SlotIndex;
    role: string;
    run: () => Promise<AgentOutput>;
  }> = [];

  const slotIndices: SlotIndex[] = [1, 2, 3, 4];
  const paths: PathKey[] = ["A", "B"];

  for (const path of paths) {
    for (const slot of slotIndices) {
      tasks.push({
        path,
        slot,
        role: input.roles[slot - 1],
        run: () => limit(() => executeAgentSlot(client, input, path, slot)),
      });
    }
  }

  const settled = await Promise.allSettled(tasks.map((task) => task.run()));
  const agentsByPath: { A: AgentOutput[]; B: AgentOutput[] } = { A: [], B: [] };
  const failures: AgentFailure[] = [];

  for (let i = 0; i < settled.length; i += 1) {
    const task = tasks[i];
    const outcome = settled[i];
    if (!task || !outcome) continue;

    if (outcome.status === "fulfilled") {
      agentsByPath[task.path].push(outcome.value);
      continue;
    }

    const reason = outcome.reason;
    failures.push({
      path: task.path,
      slot: task.slot,
      role: task.role,
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  }

  if (failures.length > 0) {
    throw new AgentPartialFailureError(failures);
  }

  return {
    agentsByPath,
  };
}
