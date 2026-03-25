import { describe, expect, it } from "vitest";
import type {
  AgentHudSlotProps,
  DeepDivePanelSlotProps,
  FallbackVizProps,
  KpiStackSlotProps,
  ScoreRingSlotProps,
  VizSlotProps,
} from "./integration-contracts";
import {
  MOCK_AGENT_HUD_PROPS,
  MOCK_DEEP_DIVE_PROPS,
  MOCK_FALLBACK_VIZ_PROPS_A,
  MOCK_KPI_STACK_PROPS,
  MOCK_SCORE_RING_PROPS_A,
  MOCK_SCORE_RING_PROPS_B,
  MOCK_VIZ_SLOT_PROPS_A,
  MOCK_VIZ_SLOT_PROPS_NETWORK,
} from "./integration-contracts";
import type { VizType } from "./types";

describe("integration-contracts", () => {
  const VIZ_TYPES: VizType[] = ["map", "flow", "network", "fallback"];

  it("assigns each mock to its contract interface (compile-time + structural)", () => {
    const viz: VizSlotProps = MOCK_VIZ_SLOT_PROPS_A;
    const vizNet: VizSlotProps = MOCK_VIZ_SLOT_PROPS_NETWORK;
    const fb: FallbackVizProps = MOCK_FALLBACK_VIZ_PROPS_A;
    const hud: AgentHudSlotProps = MOCK_AGENT_HUD_PROPS;
    const kpi: KpiStackSlotProps = MOCK_KPI_STACK_PROPS;
    const scoreA: ScoreRingSlotProps = MOCK_SCORE_RING_PROPS_A;
    const scoreB: ScoreRingSlotProps = MOCK_SCORE_RING_PROPS_B;
    const deep: DeepDivePanelSlotProps = MOCK_DEEP_DIVE_PROPS;

    expect(typeof viz.pathLabel).toBe("string");
    expect(viz.pathLabel.length).toBeGreaterThan(0);
    expect(vizNet.viz_type).toBe("network");
    expect(fb.agentStates).toHaveLength(4);
    expect(hud.roles).toHaveLength(4);
    expect(kpi.pathLabels.A).toBeDefined();
    expect(scoreA.score).toBe(61);
    expect(scoreB.score).toBe(72);
    expect(deep.pathA.kpis).toBeDefined();
  });

  it("MOCK_VIZ_SLOT_PROPS_A uses a valid VizType", () => {
    expect(VIZ_TYPES).toContain(MOCK_VIZ_SLOT_PROPS_A.viz_type);
  });

  it("MOCK_VIZ_SLOT_PROPS_NETWORK uses network viz_type", () => {
    expect(MOCK_VIZ_SLOT_PROPS_NETWORK.viz_type).toBe("network");
    expect(VIZ_TYPES).toContain(MOCK_VIZ_SLOT_PROPS_NETWORK.viz_type);
  });

  it("MOCK_FALLBACK_VIZ_PROPS_A satisfies FallbackVizProps", () => {
    expect(MOCK_FALLBACK_VIZ_PROPS_A.viz_type).toBe("fallback");
    expect(MOCK_FALLBACK_VIZ_PROPS_A.agentStates).toHaveLength(4);
  });

  it("MOCK_KPI_STACK_PROPS.comparison.overallWinner is A or B", () => {
    expect(MOCK_KPI_STACK_PROPS.comparison).toBeDefined();
    expect(["A", "B"]).toContain(MOCK_KPI_STACK_PROPS.comparison.overallWinner);
  });

  it("MOCK_AGENT_HUD_PROPS has four agent state slots per path", () => {
    expect(MOCK_AGENT_HUD_PROPS.agentStatesByPath.A).toHaveLength(4);
    expect(MOCK_AGENT_HUD_PROPS.agentStatesByPath.B).toHaveLength(4);
  });

  it("MOCK_AGENT_HUD_PROPS has fixture path labels", () => {
    expect(MOCK_AGENT_HUD_PROPS.pathLabels.A.length).toBeGreaterThan(0);
    expect(MOCK_AGENT_HUD_PROPS.pathLabels.B.length).toBeGreaterThan(0);
  });

  it("MOCK_AGENT_HUD_PROPS uses a valid VizType", () => {
    expect(VIZ_TYPES).toContain(MOCK_AGENT_HUD_PROPS.viz_type);
  });
});
