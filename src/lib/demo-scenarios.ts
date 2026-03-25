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
 *
 * Each scenario is based on a real independent coffee shop in Madrid,
 * using realistic financials, customer profiles, and competitive data
 * sourced from public listings, review platforms, and market reports.
 */
export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  "demo-map-v1": {
    id: "demo-map-v1",
    decision:
      "Open a second Toma Café in Lavapiés vs renovate the Malasaña flagship with evening bar service",
    context: {
      industry: "Specialty coffee shop",
      location: "Calle de la Palma 49, Malasaña, Madrid",
      customerBase:
        "60% Malasaña regulars (25-45 yr old creatives & freelancers), 25% tourists exploring the barrio, 15% specialty coffee enthusiasts from across Madrid",
      monthlyRevenue: 14500,
      details:
        "45 sqm counter-service-only café, own-roasted single-origin beans (Colombia, Ethiopia, Kenya). 180 customers/day avg, €4.20 avg ticket, rent €3,200/mo. Weekday peaks 8-11 AM and 4-6 PM, weekend peak 10 AM-2 PM. Google 4.5★ with 3,100+ reviews. Open daily 8 AM-8 PM. Pioneer of Madrid third-wave coffee scene.",
      confirmedLocation: { lat: 40.4235, lng: -3.7038 },
    },
    expectedVizType: "map",
    businessType: "cafe",
    employeeCount: 6,
    productsOrServices:
      "Pour-over, V60, batch brew, espresso, orange cappuccino, avocado toast, carrot cake, grilled cheese, retail bean bags (€13-18/250g)",
    confirmedCompetitors: [
      { name: "HanSo Café", lat: 40.4230, lng: -3.7030 },
      { name: "Federal Café", lat: 40.4268, lng: -3.7085 },
      { name: "Café Pepe Botella", lat: 40.4267, lng: -3.7038 },
      { name: "VNT Coffee Gallery", lat: 40.4250, lng: -3.7048 },
    ],
  },

  "demo-flow-v1": {
    id: "demo-flow-v1",
    decision:
      "Extend hours to 10 PM with an evening tapas-and-cocktails menu vs launch a weekend catering service for corporate events",
    context: {
      industry: "Korean-inspired specialty café",
      location: "Corredera Baja de San Pablo 51, Malasaña, Madrid",
      customerBase:
        "45% young professionals (25-35), 30% international expats and visitors, 25% Malasaña locals and university students",
      monthlyRevenue: 18000,
      details:
        "Two locations (80 sqm + 55 sqm Costanilla de los Ángeles). Combined rent €5,800/mo. Hours 9 AM-8 PM (weekdays), 10 AM-8 PM (weekends). Avg brunch ticket €14.50, food margin 35%. Korean-inspired all-day brunch: bibimbap bowls, matcha lattes, waffles, bagels. V60 & AeroPress brewing. Instagram 12.4K followers. Google 4.3★ with 2,100 reviews. No reservations. Staff: 2 baristas + 2 cooks + 1 manager per location.",
      confirmedLocation: { lat: 40.4230, lng: -3.7030 },
    },
    expectedVizType: "flow",
    businessType: "cafe",
    employeeCount: 8,
    productsOrServices:
      "Specialty coffee (V60, AeroPress, espresso), matcha/chai/red velvet lattes, all-day brunch, avocado toast, Korean bibimbap bowls, waffles, bagels, croissants, artisan pastries",
    confirmedCompetitors: [
      { name: "Toma Café", lat: 40.4235, lng: -3.7038 },
      { name: "Federal Café", lat: 40.4268, lng: -3.7085 },
      { name: "ÉPICO", lat: 40.4255, lng: -3.7025 },
    ],
  },

  "demo-network-v1": {
    id: "demo-network-v1",
    decision:
      "Partner with Hola Coffee Roasters for a co-branded subscription box vs launch a solo online bean store with in-house roasting brand",
    context: {
      industry: "Specialty coffee roaster-café",
      location: "Calle de Embajadores 3, Lavapiés, Madrid",
      customerBase:
        "50% Lavapiés locals (diverse, 30-55 yr old professionals and artists), 30% specialty coffee enthusiasts from across Madrid, 20% Reina Sofía museum tourists",
      monthlyRevenue: 9200,
      details:
        "60 sqm with in-house roasting corner, rent €2,400/mo. Roasts 15 kg/week on premises from green beans sourced in Brazil, Colombia, Rwanda. Offers tasting workshops (€25/person, 8 seats, 2 sessions/month = €400/mo). Avg coffee ticket €3.80, 28% gross margin on retail beans. Instagram 4.8K followers. Google 4.5★ with 890 reviews. Hours: Mon-Fri 9-17, Sat-Sun 9-19.",
      confirmedLocation: { lat: 40.4103, lng: -3.7012 },
    },
    expectedVizType: "network",
    businessType: "cafe",
    employeeCount: 4,
    productsOrServices:
      "In-house roasted single-origin beans, espresso, pour-over, AeroPress, tasting workshops, retail bean bags (250g €9.50, 1kg €32)",
    confirmedCompetitors: [
      { name: "Hola Coffee Fourquet", lat: 40.4095, lng: -3.6975 },
      { name: "Cafelito", lat: 40.4085, lng: -3.6998 },
      { name: "ALCHEMY Specialty Coffee", lat: 40.4108, lng: -3.7042 },
      { name: "Café del Art", lat: 40.4102, lng: -3.7065 },
    ],
  },
};

export const DEMO_SCENARIO_ORDER: readonly DemoScenarioId[] = [
  "demo-map-v1",
  "demo-flow-v1",
  "demo-network-v1",
];
