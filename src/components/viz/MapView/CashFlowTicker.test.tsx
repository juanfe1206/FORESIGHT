import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CashFlowTicker } from "./CashFlowTicker";

describe("CashFlowTicker", () => {
  it("formats positive, negative, and zero revenueImpact with correct sign", () => {
    const { rerender } = render(
      <div className="relative">
        <CashFlowTicker pathLabel="Path A" revenueImpact={12} visible reducedMotion />
      </div>,
    );
    expect(screen.getByTestId("cash-flow-ticker")).toHaveTextContent(/€\+12\/mo/);

    rerender(
      <div className="relative">
        <CashFlowTicker pathLabel="Path B" revenueImpact={-5} visible reducedMotion />
      </div>,
    );
    expect(screen.getByTestId("cash-flow-ticker")).toHaveTextContent(/€-5\/mo/);

    rerender(
      <div className="relative">
        <CashFlowTicker pathLabel="Flat" revenueImpact={0} visible reducedMotion />
      </div>,
    );
    expect(screen.getByTestId("cash-flow-ticker")).toHaveTextContent(/€0\/mo/);
  });
});
