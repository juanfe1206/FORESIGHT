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
        /Instagram investment builds digital brand equity/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Campaign setup and first creatives/i)).toBeInTheDocument();
    const tabA = screen.getByRole("tab", { name: /Invest in Instagram ads/i });
    expect(tabA).toHaveAttribute("aria-selected", "true");
  });

  it("shows Path B narratives after clicking Path B tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    await user.click(screen.getByRole("tab", { name: /Partner with Cafe Central/i }));
    expect(
      screen.getByText(/Partnership with Cafe Central provides immediate warm-customer pipeline/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Partnership agreement signed/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Partner with Cafe Central/i })).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowRight on Path A tab activates Path B tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    const tabA = screen.getByRole("tab", { name: /Invest in Instagram ads/i });
    tabA.focus();
    await user.keyboard("{ArrowRight}");
    const tabB = screen.getByRole("tab", { name: /Partner with Cafe Central/i });
    expect(tabB).toHaveFocus();
    expect(tabB).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowLeft on Path B tab activates Path A tab", async () => {
    const user = userEvent.setup();
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    await user.click(screen.getByRole("tab", { name: /Partner with Cafe Central/i }));
    const tabB = screen.getByRole("tab", { name: /Partner with Cafe Central/i });
    expect(tabB).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    const tabA = screen.getByRole("tab", { name: /Invest in Instagram ads/i });
    expect(tabA).toHaveFocus();
    expect(tabA).toHaveAttribute("aria-selected", "true");
  });

  it("renders attribution dots for Month 1 Path A (Customer blue, Cash Flow gold)", () => {
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    const activePanel = screen.getByRole("tabpanel");
    const month1Block = within(activePanel).getByTestId("narrative-block-month-1");
    expect(within(month1Block).getByTitle("Customer")).toHaveClass("bg-blue");
    expect(within(month1Block).getByTitle("Cash Flow")).toHaveClass("bg-gold");
  });

  it("exposes tablist with ARIA labels", () => {
    render(<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type="map" />);
    expect(screen.getByRole("tablist", { name: /simulation path narrative/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Invest in Instagram ads/i })).toHaveAttribute(
      "aria-controls",
      "panel-path-a",
    );
    expect(screen.getByRole("tab", { name: /Partner with Cafe Central/i })).toHaveAttribute(
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
