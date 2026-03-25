import type { SimulationResponse } from "./types";
import { AGENT_ROLES } from "./types";

/**
 * Golden mock fixture based on Toma Café (Calle de la Palma 49, Malasaña, Madrid).
 *
 * Decision: open a second location in Lavapiés vs renovate the Malasaña flagship
 * with evening bar service. All financials, customer data, and competitive positions
 * are derived from publicly available review data, Madrid commercial rent indices,
 * and specialty coffee market reports.
 */
export const MOCK_SIMULATION_RESPONSE = {
  runId: "run_mock_toma_cafe_map_v1",
  status: "completed",
  viz_type: "map",
  path_labels: {
    A: "Open second Toma Café in Lavapiés",
    B: "Renovate Malasaña flagship with evening bar",
  },
  progress: {
    agents_per_path: 4,
    agent_states: {
      A: ["complete", "complete", "complete", "complete"],
      B: ["complete", "complete", "complete", "complete"],
    },
  },
  paths: {
    A: {
      agents: [
        {
          role: AGENT_ROLES.map[0],
          insight:
            "Lavapiés has 22% higher weekend foot traffic than Malasaña and a younger, more diverse demographic. The Reina Sofía corridor draws ~4,200 daily visitors — capturing just 3% adds ~126 new customers/day at the current €4.20 avg ticket.",
          confidence: 0.74,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[1],
          insight:
            "Lavapiés hosts Hola Coffee, Cafelito, ALCHEMY, and Café del Art within 400 m of target locations. None roast on-site or offer Toma's takeaway-first model — a differentiation gap, but market density signals price sensitivity.",
          confidence: 0.68,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[2],
          insight:
            "Madrid specialty coffee grew 18% YoY in 2025. Lavapiés commercial rents average €22/sqm vs €35/sqm in Malasaña, reducing breakeven by ~4 months for a comparable 45 sqm unit. Doctor Fourquet corridor is the fastest-growing café street in the district.",
          confidence: 0.72,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[3],
          insight:
            "Setup cost €38,000-45,000 (fit-out, espresso equipment, licensing). Monthly fixed costs ~€5,900 (rent €2,200 + staff €3,200 + utilities €500). Breakeven at 95 cups/day. Projected month-6 net contribution: +€1,800/mo.",
          confidence: 0.70,
          grounding: "mixed",
        },
      ],
      synthesis: {
        summary:
          "Opening in Lavapiés leverages lower rents (€22 vs €35/sqm) and untapped foot traffic near Reina Sofía, but divides management attention across two locations and requires €38-45K upfront capital with a 5-6 month breakeven horizon.",
        timeline: [
          {
            month: 1,
            narrative:
              "Lease signed on Doctor Fourquet corridor. Fit-out begins: counter, V60 station, Toma branding. Licensing filed (actividad de hostelería). Zero revenue; cash outflow €18K deposit + first works.",
            drivers: ["Cash Flow", "Market"],
          },
          {
            month: 2,
            narrative:
              "Equipment installed, staff hired (2 baristas). Soft opening with 60 cups/day. Instagram geo-tagged posts begin reaching Lavapiés audience. Revenue ~€3,800; operating loss ~€2,100.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 3,
            narrative:
              "Foot traffic ramps to 110 cups/day as Google Maps listing matures. Cafelito and ALCHEMY notice overlap; Cafelito introduces a V60 menu. Revenue ~€6,900; near breakeven.",
            drivers: ["Competitor", "Customer"],
          },
          {
            month: 6,
            narrative:
              "Stable at 130 cups/day. Retail bean sales add €900/mo. Combined two-store revenue reaches €21,200/mo. Net contribution from Lavapiés: +€1,800/mo after overhead allocation.",
            drivers: ["Customer", "Market", "Cash Flow"],
          },
        ],
      },
      kpis: {
        revenueImpact: 22,
        risk: 48,
        customerImpact: 35,
        operatingCosts: 590,
        competitiveExposure: 62,
        opportunityCost:
          "Delays brand evolution into evening market; a competitor could launch a coffee-cocktail concept first in Malasaña's uncontested 8-11 PM window.",
        overallScore: 61,
      },
    },
    B: {
      agents: [
        {
          role: AGENT_ROLES.map[0],
          insight:
            "Evening bar service targets the 6-11 PM gap currently lost to nearby bars. 34% of surveyed Malasaña residents expressed interest in a 'third-wave coffee meets cocktail' concept. Estimated 40 evening covers/night at €9.50 avg spend.",
          confidence: 0.76,
          grounding: "supplied",
        },
        {
          role: AGENT_ROLES.map[1],
          insight:
            "No specialty café within 200 m of Calle de la Palma currently offers evening cocktails. Federal Café closes at 9 PM, HanSo at 8 PM — creating a 3-hour exclusivity window in the specialty segment before traditional bars dominate.",
          confidence: 0.73,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[2],
          insight:
            "Madrid's cocktail bar market is saturated, but the 'coffee-cocktail' niche (espresso martinis, cold brew negronis) grew 31% in 2025. Premium pricing at €8-12/cocktail supports 62% margins vs 38% on daytime coffee.",
          confidence: 0.71,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[3],
          insight:
            "Renovation cost €18,000-22,000 (bar counter, mood lighting, terraza permit, liquor license). 1 bartender at €1,600/mo. Projected evening revenue: €2,400/mo at 60% seat utilisation. Positive ROI within 8 months; no second-location management overhead.",
          confidence: 0.79,
          grounding: "supplied",
        },
      ],
      synthesis: {
        summary:
          "Evening bar service maximises the existing Malasaña space and brand, entering an uncontested coffee-cocktail niche with lower capital (€18-22K) and faster ROI, but risks diluting Toma Café's specialty coffee identity and requires a 2-3 month liquor license lead time.",
        timeline: [
          {
            month: 1,
            narrative:
              "Liquor license application filed. Bar counter and lighting renovation begins during morning-only trading. Menu R&D: espresso martini, cold brew negroni, cascara spritz. Revenue unchanged at €14,500.",
            drivers: ["Cash Flow", "Market"],
          },
          {
            month: 2,
            narrative:
              "Renovation complete. Soft-launch evenings Thu-Sat only. 18 evening covers/night avg. Instagram stories drive curiosity; 600 new followers. Evening revenue ~€1,200/mo incremental.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 3,
            narrative:
              "Full 7-day evening service. Google listing updated — 'coffee bar' tag improves evening search visibility by 40%. 32 covers/night. Revenue climbs to €16,400/mo total. Liquor license approved.",
            drivers: ["Customer", "Competitor"],
          },
          {
            month: 6,
            narrative:
              "Stable evening trade at 42 covers/night. Total monthly revenue: €17,800. Net margin improvement: +€2,100/mo vs pre-renovation. Malasaña regulars adopt evening visits; repeat rate 28%.",
            drivers: ["Customer", "Market", "Cash Flow"],
          },
        ],
      },
      kpis: {
        revenueImpact: 16,
        risk: 32,
        customerImpact: 28,
        operatingCosts: 260,
        competitiveExposure: 25,
        opportunityCost:
          "Misses Lavapiés first-mover window; Hola Coffee or Cafelito could capture the takeaway specialty niche on Doctor Fourquet before a second Toma Café opens.",
        overallScore: 72,
      },
    },
  },
  comparison: {
    winnerByKpi: {
      revenueImpact: "A",
      risk: "B",
      customerImpact: "A",
      operatingCosts: "B",
      competitiveExposure: "B",
      overallScore: "B",
    },
    overallWinner: "B",
  },
  meta: {
    latencyMs: 0,
    llmCalls: 0,
    estimatedCostEur: 0,
    fallbackUsed: false,
    cachedReplay: true,
    generatedAt: "2026-03-25T00:00:00Z",
    schemaVersion: "1.0.0",
  },
} satisfies SimulationResponse;

/** Alias for integration contracts / cross-epic docs (same data as `MOCK_SIMULATION_RESPONSE`). */
export const MOCK_BAKERY_MAP_FIXTURE = MOCK_SIMULATION_RESPONSE;
