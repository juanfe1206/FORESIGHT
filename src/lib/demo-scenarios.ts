import type { NearbyBusiness } from "@/lib/overpass";
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
  businessType?: string;
  employeeCount?: number;
  productsOrServices?: string;
  confirmedCompetitors?: NearbyBusiness[];
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
        "Place-based decision about geographic reach and local market expansion.",
    },
    expectedVizType: "map",
    businessType: "bakery",
    employeeCount: 4,
    productsOrServices: "Artisan bread, pastries, coffee",
    confirmedCompetitors: [
      { name: "Panadería La Mallorquina", lat: 40.418, lng: -3.6995 },
      { name: "Horno San Onofre", lat: 40.4205, lng: -3.7018 },
      { name: "Panaria", lat: 40.4152, lng: -3.6972 },
    ],
  },
  "demo-flow-v1": {
    id: "demo-flow-v1",
    decision:
      "Hire two new staff and launch a paid digital ad campaign vs invest in team training and upgrade back-office equipment",
    context: {
      industry: "Local services",
      location: "Madrid, Spain",
      customerBase: "Existing customers + targeted upsell",
      monthlyRevenue: 12000,
      details:
        "Aggressive capacity and reach expansion vs operational strengthening before growing — different cost structures and time horizons.",
    },
    expectedVizType: "flow",
    businessType: "services",
    employeeCount: 8,
    productsOrServices: "Home cleaning, handyman repairs, pest control",
    confirmedCompetitors: [
      { name: "Multiasistencia", lat: 40.4195, lng: -3.6988 },
      { name: "ServiHogar Madrid", lat: 40.4140, lng: -3.7045 },
    ],
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
        "Relationships and ecosystem decision about partnerships and stakeholder dynamics.",
    },
    expectedVizType: "network",
    businessType: "bakery",
    employeeCount: 5,
    productsOrServices: "Sourdough loaves, seasonal pastries, catering trays",
    confirmedCompetitors: [
      { name: "Café Manuela", lat: 40.4245, lng: -3.7065 },
      { name: "Toma Café", lat: 40.4270, lng: -3.7010 },
      { name: "Federal Café", lat: 40.4232, lng: -3.7055 },
    ],
  },
};

export const DEMO_SCENARIO_ORDER: readonly DemoScenarioId[] = [
  "demo-map-v1",
  "demo-flow-v1",
  "demo-network-v1",
];

