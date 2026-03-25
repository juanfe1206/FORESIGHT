import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlowButton } from "./GlowButton";

describe("GlowButton", () => {
  it("sets aria-busy when loading and preserves a stable min width", () => {
    const { rerender } = render(
      <GlowButton data-testid="glow" loading={false}>
        Simulate My Decision
      </GlowButton>,
    );
    const btn = screen.getByTestId("glow");
    expect(btn).not.toHaveAttribute("aria-busy", "true");
    expect(btn).toHaveClass("min-w-[16rem]");

    rerender(
      <GlowButton data-testid="glow" loading>
        Simulate My Decision
      </GlowButton>,
    );
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toHaveTextContent(/working/i);
    expect(btn).toHaveClass("min-w-[16rem]");
  });

  it("disables the control while loading", () => {
    render(
      <GlowButton loading type="button">
        Go
      </GlowButton>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
