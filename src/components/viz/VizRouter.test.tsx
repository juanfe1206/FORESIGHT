import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MOCK_VIZ_SLOT_PROPS_A } from "@/lib/integration-contracts";
import { VizRouter } from "./VizRouter";

describe("VizRouter", () => {
  it("renders flow branch with FlowView test id", () => {
    render(
      <VizRouter
        {...MOCK_VIZ_SLOT_PROPS_A}
        viz_type="flow"
      />,
    );
    expect(screen.getByTestId("viz-router-flow")).toBeInTheDocument();
  });

  it("renders map placeholder", () => {
    render(
      <VizRouter
        {...MOCK_VIZ_SLOT_PROPS_A}
        viz_type="map"
      />,
    );
    expect(screen.getByTestId("viz-router-map")).toBeInTheDocument();
  });

  it("renders network placeholder", () => {
    render(
      <VizRouter
        {...MOCK_VIZ_SLOT_PROPS_A}
        viz_type="network"
      />,
    );
    expect(screen.getByTestId("viz-router-network")).toBeInTheDocument();
  });

  it("renders fallback placeholder", () => {
    render(
      <VizRouter
        {...MOCK_VIZ_SLOT_PROPS_A}
        viz_type="fallback"
      />,
    );
    expect(screen.getByTestId("viz-router-fallback")).toBeInTheDocument();
  });
});
