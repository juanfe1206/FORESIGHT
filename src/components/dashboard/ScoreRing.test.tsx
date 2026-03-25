import { render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { describe, expect, it } from "vitest";
import { SCORE_RING_ENTRANCE_DELAY_S } from "@/lib/dashboard-choreography";
import { ScoreRing, clampOverallScore } from "./ScoreRing";

describe("clampOverallScore", () => {
  it("clamps to 0–100", () => {
    expect(clampOverallScore(-10)).toBe(0);
    expect(clampOverallScore(150)).toBe(100);
    expect(clampOverallScore(42)).toBe(42);
    expect(clampOverallScore(Number.NaN)).toBe(0);
  });
});

describe("ScoreRing", () => {
  it("renders with progressbar semantics and visible numeric label", async () => {
    render(
      <MotionConfig reducedMotion="always">
        <ScoreRing score={67} pathLabel="Path Alpha" pathTone="A" />
      </MotionConfig>,
    );

    expect(screen.getByTestId("score-ring")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "67");
    expect(bar.getAttribute("aria-label")).toContain("Path Alpha");
    expect(bar.getAttribute("aria-label")).toContain("67");

    await waitFor(() => expect(screen.getByText("67")).toBeInTheDocument());
  });

  it("displays clamped score when value is out of range", async () => {
    render(
      <MotionConfig reducedMotion="always">
        <ScoreRing score={999} pathLabel="Path B" pathTone="B" />
      </MotionConfig>,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await waitFor(() => expect(screen.getByText("100")).toBeInTheDocument());
  });

  it("reduced motion: shows target score without extended wait", async () => {
    render(
      <MotionConfig reducedMotion="always">
        <ScoreRing score={78} pathLabel="Coastal" pathTone="B" />
      </MotionConfig>,
    );

    await waitFor(() => expect(screen.getByText("78")).toBeInTheDocument(), { timeout: 500 });
  });

  it("defers center count until KPI-stack choreography delay when motion is preferred", async () => {
    render(
      <MotionConfig reducedMotion="never">
        <ScoreRing score={55} pathLabel="Deferred" pathTone="A" />
      </MotionConfig>,
    );

    expect(screen.queryByText("55")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("55")).toBeInTheDocument(), {
      timeout: Math.ceil(SCORE_RING_ENTRANCE_DELAY_S * 1000) + 2500,
    });
  });
});
