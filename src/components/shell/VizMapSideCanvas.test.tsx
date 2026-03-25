import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VizMapSideCanvas } from "./VizMapSideCanvas";

describe("VizMapSideCanvas", () => {
  it("reserves left/right regions with stable test ids when vizType is map", () => {
    const { rerender } = render(
      <VizMapSideCanvas side="left" vizType="map">
        <span>inner</span>
      </VizMapSideCanvas>,
    );
    expect(screen.getByTestId("map-canvas-region-left")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();

    rerender(
      <VizMapSideCanvas side="right" vizType="map">
        <span>inner</span>
      </VizMapSideCanvas>,
    );
    expect(screen.getByTestId("map-canvas-region-right")).toBeInTheDocument();
  });

  it("does not wrap children when vizType is not map", () => {
    render(
      <VizMapSideCanvas side="left" vizType="flow">
        <span data-testid="child">content</span>
      </VizMapSideCanvas>,
    );
    expect(screen.queryByTestId("map-canvas-region-left")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
