import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader } from "./PanelHeader";

describe("PanelHeader", () => {
  it("renders the title as a heading", () => {
    render(<PanelHeader title="Invest in ads" />);
    expect(screen.getByRole("heading", { name: /invest in ads/i })).toBeInTheDocument();
  });

  it("does not use Scenario A/B default copy", () => {
    render(<PanelHeader title="North" />);
    expect(screen.queryByText(/scenario\s*a/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scenario\s*b/i)).not.toBeInTheDocument();
  });

  it("renders optional subtitle", () => {
    render(<PanelHeader title="A" subtitle="Context line" />);
    expect(screen.getByText(/context line/i)).toBeInTheDocument();
  });
});
