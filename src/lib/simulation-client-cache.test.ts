import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ROLES } from "@/lib/types";
import type { SimulationResponse } from "@/lib/types";

import {
  __simulationCacheTestUtils,
  readLatestValid,
  writeSuccess,
} from "./simulation-client-cache";

const flowAgents = (prefix: string) =>
  AGENT_ROLES.flow.map((role) => ({
    role,
    insight: `${prefix} ${role}`,
    confidence: 0.7,
    grounding: "mixed" as const,
  }));

const makeFullResponse = (labelA: string, labelB: string): SimulationResponse => ({
  runId: `run_${labelA}`,
  status: "completed",
  viz_type: "flow",
  path_labels: { A: labelA, B: labelB },
  progress: {
    agents_per_path: 4,
    agent_states: {
      A: ["complete", "complete", "complete", "complete"],
      B: ["complete", "complete", "complete", "complete"],
    },
  },
  paths: {
    A: {
      agents: flowAgents("A"),
      synthesis: { summary: "Sa", timeline: [] },
      kpis: {
        revenueImpact: 1,
        risk: 2,
        customerImpact: 3,
        operatingCosts: 4,
        competitiveExposure: 5,
        opportunityCost: "oc",
        overallScore: 50,
      },
    },
    B: {
      agents: flowAgents("B"),
      synthesis: { summary: "Sb", timeline: [] },
      kpis: {
        revenueImpact: 2,
        risk: 3,
        customerImpact: 4,
        operatingCosts: 5,
        competitiveExposure: 6,
        opportunityCost: "oc2",
        overallScore: 60,
      },
    },
  },
  comparison: {
    overallWinner: "B",
    winnerByKpi: { overallScore: "B" },
  },
  meta: {
    latencyMs: 1,
    llmCalls: 1,
    estimatedCostEur: 0.01,
    fallbackUsed: false,
    cachedReplay: false,
    generatedAt: "2026-01-01T00:00:00Z",
    schemaVersion: __simulationCacheTestUtils.TRUSTED_SCHEMA_VERSION,
  },
});

describe("simulation-client-cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns latest valid entry after writeSuccess", async () => {
    const a = makeFullResponse("A1", "B1");
    const b = makeFullResponse("A2", "B2");
    writeSuccess(a);
    writeSuccess(b);
    await vi.waitFor(() => {
      expect(readLatestValid()?.path_labels.A).toBe("A2");
    });
  });

  it("drops entries older than TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const old = makeFullResponse("OldA", "OldB");
    writeSuccess(old);
    await vi.waitFor(() => {
      expect(readLatestValid()?.path_labels.A).toBe("OldA");
    });

    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
    const fresh = makeFullResponse("NewA", "NewB");
    writeSuccess(fresh);
    await vi.waitFor(() => {
      expect(readLatestValid()?.path_labels.A).toBe("NewA");
    });

    vi.setSystemTime(new Date("2026-01-20T00:00:00Z"));
    expect(readLatestValid()).toBeNull();
    vi.useRealTimers();
  });

  it("does not store untrusted schemaVersion", async () => {
    const bad: SimulationResponse = {
      ...makeFullResponse("X", "Y"),
      meta: { ...makeFullResponse("X", "Y").meta, schemaVersion: "99.0.0" },
    };
    writeSuccess(bad);
    await vi.waitFor(() => {
      expect(readLatestValid()).toBeNull();
    });
  });
});
