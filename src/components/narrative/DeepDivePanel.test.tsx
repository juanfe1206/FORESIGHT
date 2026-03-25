import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MOCK_DEEP_DIVE_PROPS } from "@/lib/integration-contracts";
import { DeepDivePanel } from "./DeepDivePanel";
import { DeepDiveStrip } from "./DeepDiveStrip";

describe("DeepDivePanel", () => {
  it("renders with MOCK_DEEP_DIVE_PROPS and viz_type map without throwing", () => {
    expect(() =>
      render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />),
    ).not.toThrow();
  });

  it("shows Path A timeline and summary by default", () => {
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    expect(
      screen.getByText(
        /Opening in Lavapiés leverages lower rents/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lease signed on Doctor Fourquet corridor/i)).toBeInTheDocument();
    const tabA = screen.getByRole("tab", { name: /Open second Toma Café in Lavapiés/i });
    expect(tabA).toHaveAttribute("aria-selected", "true");
  });

  it("shows Path B narratives after clicking Path B tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    await user.click(screen.getByRole("tab", { name: /Renovate Malasaña flagship/i }));
    expect(
      screen.getByText(/Evening bar service maximises the existing Malasaña space/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Liquor license application filed/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Renovate Malasaña flagship/i })).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowRight on Path A tab activates Path B tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    const tabA = screen.getByRole("tab", { name: /Open second Toma Café in Lavapiés/i });
    tabA.focus();
    await user.keyboard("{ArrowRight}");
    const tabB = screen.getByRole("tab", { name: /Renovate Malasaña flagship/i });
    expect(tabB).toHaveFocus();
    expect(tabB).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowLeft on Path B tab activates Path A tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    await user.click(screen.getByRole("tab", { name: /Renovate Malasaña flagship/i }));
    const tabB = screen.getByRole("tab", { name: /Renovate Malasaña flagship/i });
    expect(tabB).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    const tabA = screen.getByRole("tab", { name: /Open second Toma Café in Lavapiés/i });
    expect(tabA).toHaveFocus();
    expect(tabA).toHaveAttribute("aria-selected", "true");
  });

  it("renders attribution dots for Month 1 Path A (Cash Flow gold, Market accent)", () => {
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    const activePanel = screen.getByRole("tabpanel");
    const month1Block = within(activePanel).getByTestId("narrative-block-month-1");
    expect(within(month1Block).getByTitle("Cash Flow")).toHaveClass("bg-gold");
    expect(within(month1Block).getByTitle("Market")).toHaveClass("bg-accent");
  });

  it("exposes tablist with ARIA labels", () => {
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    expect(screen.getByRole("tablist", { name: /simulation path narrative/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Open second Toma Café in Lavapiés/i })).toHaveAttribute(
      "aria-controls",
      "panel-path-a",
    );
    expect(screen.getByRole("tab", { name: /Renovate Malasaña flagship/i })).toHaveAttribute(
      "aria-controls",
      "panel-path-b",
    );
  });
});

describe("DeepDiveStrip", () => {
  it("renders path label, numeric score, and summary text", () => {
    render(
      <DeepDiveStrip pathLabel="North expansion" score={72} summary="Short summary for the path." />,
    );
    expect(screen.getByText("North expansion")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Short summary for the path.")).toBeInTheDocument();
  });

  it("truncates long summaries beyond 120 characters", () => {
    const long = "x".repeat(130);
    render(<DeepDiveStrip pathLabel="A" score={50} summary={long} />);
    expect(screen.queryByText(long)).not.toBeInTheDocument();
    expect(screen.getByText(`${"x".repeat(117)}…`)).toBeInTheDocument();
  });
});
