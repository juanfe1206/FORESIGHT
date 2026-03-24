import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VizType } from "@/lib/types";
import { ModeBadge } from "./ModeBadge";

describe("ModeBadge", () => {
  it.each<[VizType, string]>([
    ["map", "Map"],
    ["flow", "Flow"],
    ["network", "Network"],
    ["fallback", "Fallback"],
  ])("renders visible mode label %s (not color-only)", (vizType, label) => {
    render(<ModeBadge vizType={vizType} />);
    expect(screen.getByTestId("mode-badge-label")).toHaveTextContent(label);
    expect(screen.getByTestId("mode-badge")).toBeVisible();
  });
});
