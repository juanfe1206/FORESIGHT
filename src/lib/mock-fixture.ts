import type { SimulationResponse } from "./types";
import { AGENT_ROLES } from "./types";

export const MOCK_SIMULATION_RESPONSE = {
  runId: "run_mock_bakery_map_v1",
  status: "completed",
  viz_type: "map",
  path_labels: {
    A: "Invest in Instagram ads",
    B: "Partner with Cafe Central",
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
            "Digital reach targets 18–35 demographic, boosting new customer acquisition by ~15%.",
          confidence: 0.72,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[1],
          insight:
            "Competitors in Malasana already running Instagram; differentiation requires strong visual identity.",
          confidence: 0.65,
          grounding: "assumed",
        },
        {
          role: AGENT_ROLES.map[2],
          insight:
            "Madrid food SMB ad market grows 12% YoY; Instagram CPM remains competitive at €2–4.",
          confidence: 0.7,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[3],
          insight:
            "Monthly ad spend €300–500 expected; positive ROI only after month 3 as brand awareness builds.",
          confidence: 0.68,
          grounding: "mixed",
        },
      ],
      synthesis: {
        summary:
          "Instagram investment builds digital brand equity and new customer pipeline within 6 months, but requires consistent creative output and upfront ad spend with delayed ROI.",
        timeline: [
          {
            month: 1,
            narrative:
              "Campaign setup and first creatives. Ad budget deployed, minimal measurable foot traffic lift yet.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 2,
            narrative:
              "Follower growth picks up. First customer conversions tracked via coupon codes; revenue impact modest.",
            drivers: ["Customer", "Market"],
          },
          {
            month: 3,
            narrative:
              "Break-even on ad spend. Referrals from engaged followers begin offsetting cost.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 6,
            narrative:
              "Stable new customer cohort of ~30/month. Revenue impact solidifies at +€1.2k/month net.",
            drivers: ["Customer", "Market", "Cash Flow"],
          },
        ],
      },
      kpis: {
        revenueImpact: 12,
        risk: 42,
        customerImpact: 30,
        operatingCosts: 420,
        competitiveExposure: 55,
        opportunityCost:
          "Potential local referral network and physical community presence from a Cafe Central partnership.",
        overallScore: 67,
      },
    },
    B: {
      agents: [
        {
          role: AGENT_ROLES.map[0],
          insight:
            "Shared foot traffic from Cafe Central regulars provides immediate warm-lead introduction, low acquisition cost.",
          confidence: 0.78,
          grounding: "supplied",
        },
        {
          role: AGENT_ROLES.map[1],
          insight:
            "Partnership locks in geographic exclusivity within a 200m radius; reduces immediate competitive threat.",
          confidence: 0.71,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[2],
          insight:
            "Local cross-referral partnerships in Madrid's Malasana district yield 20–40% faster payback vs solo digital.",
          confidence: 0.74,
          grounding: "mixed",
        },
        {
          role: AGENT_ROLES.map[3],
          insight:
            "Lower upfront cost: minimal ad spend, revenue split or referral fee only on converted customers.",
          confidence: 0.8,
          grounding: "supplied",
        },
      ],
      synthesis: {
        summary:
          "Partnership with Cafe Central provides immediate warm-customer pipeline with lower upfront cost, but limits geographic expansion and creates dependency on a single partner.",
        timeline: [
          {
            month: 1,
            narrative:
              "Partnership agreement signed. Flyers and co-promotions activate. First referred customers arrive.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 2,
            narrative:
              "Word-of-mouth accelerates. Regular Cafe Central patrons become repeat bakery customers.",
            drivers: ["Customer", "Market"],
          },
          {
            month: 3,
            narrative:
              "Revenue contribution stabilizes. Referral conversion rate ~8% of Cafe Central daily traffic.",
            drivers: ["Customer", "Cash Flow"],
          },
          {
            month: 6,
            narrative:
              "Steady +€1.8k/month from partnership channel. Low ongoing cost, high community loyalty signal.",
            drivers: ["Customer", "Market", "Cash Flow"],
          },
        ],
      },
      kpis: {
        revenueImpact: 18,
        risk: 28,
        customerImpact: 45,
        operatingCosts: 120,
        competitiveExposure: 30,
        opportunityCost:
          "Broader digital brand awareness and social media presence that Instagram ads would have built.",
        overallScore: 78,
      },
    },
  },
  comparison: {
    winnerByKpi: {
      revenueImpact: "B",
      risk: "B",
      customerImpact: "B",
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
    generatedAt: "2026-03-24T00:00:00Z",
    schemaVersion: "1.0.0",
  },
} satisfies SimulationResponse;

/** Alias for integration contracts / cross-epic docs (same data as `MOCK_SIMULATION_RESPONSE`). */
export const MOCK_BAKERY_MAP_FIXTURE = MOCK_SIMULATION_RESPONSE;
