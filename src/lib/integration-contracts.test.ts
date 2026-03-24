import { describe, expect, it } from "vitest";
import type {
  AgentHudSlotProps,
  DeepDivePanelSlotProps,
  KpiStackSlotProps,
  ScoreRingSlotProps,
  VizSlotProps,
} from "./integration-contracts";
import {
  MOCK_AGENT_HUD_PROPS,
  MOCK_DEEP_DIVE_PROPS,
  MOCK_KPI_STACK_PROPS,
  MOCK_SCORE_RING_PROPS_A,
  MOCK_VIZ_SLOT_PROPS_A,
} from "./integration-contracts";
import type { VizType } from "./types";

describe("integration-contracts", () => {
  const VIZ_TYPES: VizType[] = ["map", "flow", "network", "fallback"];

  it("assigns each mock to its contract interface (compile-time + structural)", () => {
    const viz: VizSlotProps = MOCK_VIZ_SLOT_PROPS_A;
    const hud: AgentHudSlotProps = MOCK_AGENT_HUD_PROPS;
    const kpi: KpiStackSlotProps = MOCK_KPI_STACK_PROPS;
    const score: ScoreRingSlotProps = MOCK_SCORE_RING_PROPS_A;
    const deep: DeepDivePanelSlotProps = MOCK_DEEP_DIVE_PROPS;

    expect(typeof viz.pathLabel).toBe("string");
    expect(viz.pathLabel.length).toBeGreaterThan(0);
    expect(hud.roles).toHaveLength(4);
    expect(kpi.pathLabels.A).toBeDefined();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(deep.pathA.kpis).toBeDefined();
  });

  it("MOCK_VIZ_SLOT_PROPS_A uses a valid VizType", () => {
    expect(VIZ_TYPES).toContain(MOCK_VIZ_SLOT_PROPS_A.viz_type);
  });

  it("MOCK_KPI_STACK_PROPS.comparison.overallWinner is A or B", () => {
    expect(MOCK_KPI_STACK_PROPS.comparison).toBeDefined();
    expect(["A", "B"]).toContain(MOCK_KPI_STACK_PROPS.comparison.overallWinner);
  });

  it("MOCK_AGENT_HUD_PROPS has four agent state slots", () => {
    expect(MOCK_AGENT_HUD_PROPS.agentStates).toHaveLength(4);
  });

  it("MOCK_AGENT_HUD_PROPS uses a valid VizType", () => {
    expect(VIZ_TYPES).toContain(MOCK_AGENT_HUD_PROPS.viz_type);
  });
});
