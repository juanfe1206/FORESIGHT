import type { SimulationRequest, VizType } from "@/lib/types";

export type DemoScenarioId = "demo-map-v1" | "demo-flow-v1" | "demo-network-v1";

export type DemoScenario = {
  id: DemoScenarioId;
  /**
   * User-facing either/or decision text used by the classifier.
   * Keep it deterministic so script/checklist references remain stable.
   */
  decision: string;
  /** Typed payload shape reused from `SimulationRequest["context"]`. */
  context: SimulationRequest["context"];
  /** Expected backend `viz_type` for this demo scenario. */
  expectedVizType: Exclude<VizType, "fallback">;
};

/**
 * Canonical demo scenario fixtures (Story 6.4).
 * Used for deterministic script/checklist references and demo-only classifier mapping.
 */
export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  "demo-map-v1": {
    id: "demo-map-v1",
    decision:
      "Open a new bakery location near Madrid centro vs stay put and upgrade operations",
    context: {
      industry: "Neighborhood bakery",
      location: "Madrid, Spain",
      customerBase: "Locals + weekend tourists",
      monthlyRevenue: 8500,
      details:
        "Rehearsal intent: decision is place-based (geographic reach / local market).",
    },
    expectedVizType: "map",
  },
  "demo-flow-v1": {
    id: "demo-flow-v1",
    decision:
      "Increase monthly ad budget and staffing vs invest the same cash into maintenance only",
    context: {
      industry: "Local services",
      location: "Madrid, Spain",
      customerBase: "Existing customers + targeted upsell",
      monthlyRevenue: 12000,
      details:
        "Rehearsal intent: decision is resource allocation (budget/capacity/time planning).",
    },
    expectedVizType: "flow",
  },
  "demo-network-v1": {
    id: "demo-network-v1",
    decision:
      "Partner with a local café ecosystem vs launch solo marketing campaigns independently",
    context: {
      industry: "Neighborhood bakery",
      location: "Madrid, Spain",
      customerBase: "Cross-referrals from partner venues",
      monthlyRevenue: 10000,
      details:
        "Rehearsal intent: decision is relationships/ecosystem dynamics (partnerships + stakeholders).",
    },
    expectedVizType: "network",
  },
};

export const DEMO_SCENARIO_ORDER: readonly DemoScenarioId[] = [
  "demo-map-v1",
  "demo-flow-v1",
  "demo-network-v1",
];

