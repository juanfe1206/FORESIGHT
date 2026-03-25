import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MOCK_AGENT_HUD_PROPS } from "@/lib/integration-contracts";
import type { AgentOutput } from "@/lib/types";
import { AgentHUD } from "./AgentHUD";

describe("AgentHUD", () => {
  it("renders dual path rows with four agent nodes each", () => {
    render(<AgentHUD {...MOCK_AGENT_HUD_PROPS} />);
    expect(screen.getByTestId("agent-hud")).toBeInTheDocument();
    for (const p of ["A", "B"] as const) {
      for (let i = 0; i < 4; i++) {
        expect(screen.getByTestId(`agent-node-${p}-${i}`)).toBeInTheDocument();
      }
    }
  });

  it("renders path labels as section headings", () => {
    render(<AgentHUD {...MOCK_AGENT_HUD_PROPS} />);
    expect(screen.getByRole("region", { name: new RegExp(MOCK_AGENT_HUD_PROPS.pathLabels.A, "i") })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: new RegExp(MOCK_AGENT_HUD_PROPS.pathLabels.B, "i") })).toBeInTheDocument();
  });

  it("shows insight text on nodes in insight state", () => {
    render(
      <AgentHUD
        {...MOCK_AGENT_HUD_PROPS}
        agentStatesByPath={{
          A: ["insight", "dormant", "dormant", "dormant"],
          B: ["dormant", "dormant", "dormant", "dormant"],
        }}
        insightsByPath={{
          A: ["Low margin risk", undefined, undefined, undefined],
          B: [undefined, undefined, undefined, undefined],
        }}
      />,
    );
    expect(screen.getByText("Low margin risk")).toBeInTheDocument();
  });

  it("does not render a KPI summary block at completion", () => {
    render(
      <AgentHUD
        {...MOCK_AGENT_HUD_PROPS}
        agentStatesByPath={{
          A: ["complete", "complete", "complete", "complete"],
          B: ["complete", "complete", "complete", "complete"],
        }}
      />,
    );
    expect(screen.queryByTestId("agent-hud-kpi-preview")).not.toBeInTheDocument();
  });

  it("shows grounding label and confidence for insight state when agentsByPath is set", () => {
    const agentsA: AgentOutput[] = [
      { role: "R0", insight: "Low margin risk", confidence: 0.81, grounding: "supplied" },
      { role: "R1", insight: "x", confidence: 0.5, grounding: "mixed" },
      { role: "R2", insight: "x", confidence: 0.5, grounding: "mixed" },
      { role: "R3", insight: "x", confidence: 0.5, grounding: "mixed" },
    ];
    render(
      <AgentHUD
        {...MOCK_AGENT_HUD_PROPS}
        agentStatesByPath={{
          A: ["insight", "dormant", "dormant", "dormant"],
          B: ["dormant", "dormant", "dormant", "dormant"],
        }}
        insightsByPath={{
          A: ["Low margin risk", undefined, undefined, undefined],
          B: [undefined, undefined, undefined, undefined],
        }}
        agentsByPath={{ A: agentsA, B: [] }}
      />,
    );
    expect(screen.getByText("Low margin risk")).toBeInTheDocument();
    expect(screen.getByText(/From your inputs/i)).toBeInTheDocument();
    expect(screen.getByText(/81%\s*conf\./)).toBeInTheDocument();
  });
});
