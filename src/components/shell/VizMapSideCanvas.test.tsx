import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VizMapSideCanvas } from "./VizMapSideCanvas";

describe("VizMapSideCanvas", () => {
  it("reserves left/right regions with stable test ids", () => {
    const { rerender } = render(
      <VizMapSideCanvas side="left">
        <span>inner</span>
      </VizMapSideCanvas>,
    );
    expect(screen.getByTestId("map-canvas-region-left")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();

    rerender(
      <VizMapSideCanvas side="right">
        <span>inner</span>
      </VizMapSideCanvas>,
    );
    expect(screen.getByTestId("map-canvas-region-right")).toBeInTheDocument();
  });

  it("always wraps children with map canvas styling", () => {
    render(
      <VizMapSideCanvas side="left">
        <span data-testid="child">content</span>
      </VizMapSideCanvas>,
    );
    expect(screen.getByTestId("map-canvas-region-left")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
