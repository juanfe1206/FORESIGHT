import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AGENT_ROLES } from "@/lib/types";
import type { PathData } from "@/lib/types";
import { FlowView } from "./FlowView";

const minimalPathData: PathData = {
  agents: [
    { role: AGENT_ROLES.flow[0], insight: "i0", confidence: 0.7, grounding: "mixed" },
    { role: AGENT_ROLES.flow[1], insight: "i1", confidence: 0.7, grounding: "mixed" },
    { role: AGENT_ROLES.flow[2], insight: "i2", confidence: 0.7, grounding: "mixed" },
    { role: AGENT_ROLES.flow[3], insight: "i3", confidence: 0.7, grounding: "mixed" },
  ],
  synthesis: {
    summary: "Summary line for flow view.",
    timeline: [],
  },
  kpis: {
    revenueImpact: 10,
    risk: 35,
    customerImpact: 25,
    operatingCosts: 300,
    competitiveExposure: 40,
    opportunityCost: "—",
    overallScore: 60,
  },
};

describe("FlowView", () => {
  it("exposes viz-router-flow and flow subregions", () => {
    render(
      <FlowView pathLabel="Path A option" pathData={minimalPathData} />,
    );
    expect(screen.getByTestId("viz-router-flow")).toBeInTheDocument();
    expect(screen.getByTestId("flow-resource-pool")).toBeInTheDocument();
    expect(screen.getByTestId("flow-outcomes")).toBeInTheDocument();
    expect(screen.getByTestId("flow-channel-0")).toBeInTheDocument();
    expect(screen.getByText(AGENT_ROLES.flow[0])).toBeInTheDocument();
  });

  it("renders leak cue when risk data present", () => {
    render(<FlowView pathLabel="B" pathData={minimalPathData} />);
    expect(screen.getByTestId("flow-leak")).toBeInTheDocument();
  });

  it("shows synthesis summary from pathData", () => {
    render(<FlowView pathLabel="A" pathData={minimalPathData} />);
    expect(screen.getByText(/summary line for flow view/i)).toBeInTheDocument();
  });
});
