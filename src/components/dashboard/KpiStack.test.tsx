import { render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { describe, expect, it } from "vitest";
import { MOCK_KPI_STACK_PROPS } from "@/lib/integration-contracts";
import { KPI_STACK_ROW_DEFS, KpiStack } from "./KpiStack";
import { CountUpNumber } from "@/components/shared/CountUpNumber";

describe("KpiStack", () => {
  it("renders six comparison rows in stable order with expected titles", () => {
    render(
      <MotionConfig reducedMotion="always">
        <KpiStack {...MOCK_KPI_STACK_PROPS} />
      </MotionConfig>,
    );

    expect(screen.getByTestId("kpi-stack")).toBeInTheDocument();
    for (const row of KPI_STACK_ROW_DEFS) {
      expect(screen.getByRole("heading", { name: row.title })).toBeInTheDocument();
    }
  });

  it("shows a winner badge with path label when winnerByKpi has an entry", () => {
    render(
      <MotionConfig reducedMotion="always">
        <KpiStack {...MOCK_KPI_STACK_PROPS} />
      </MotionConfig>,
    );

    expect(MOCK_KPI_STACK_PROPS.comparison.winnerByKpi.revenueImpact).toBe("A");
    expect(
      screen.getAllByText(new RegExp(MOCK_KPI_STACK_PROPS.pathLabels.A.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/favors this outcome/i).length).toBeGreaterThan(0);
  });

  it("renders narrative opportunity row with both path texts (no numeric percent in narrative body)", () => {
    render(
      <MotionConfig reducedMotion="always">
        <KpiStack {...MOCK_KPI_STACK_PROPS} />
      </MotionConfig>,
    );

    const narrativeBlock = screen.getByText(/Delays brand evolution into evening market/i);
    expect(narrativeBlock).toBeInTheDocument();
    expect(screen.getByText(/Misses Lavapiés first-mover window/i)).toBeInTheDocument();
    const narrativeArticle = screen.getByTestId("kpi-stack").querySelector('[data-kpi-key="opportunityCost"]');
    expect(narrativeArticle).toBeTruthy();
  });

  it("omits winner badge for opportunityCost when winnerByKpi omits that key", () => {
    render(
      <MotionConfig reducedMotion="always">
        <KpiStack {...MOCK_KPI_STACK_PROPS} />
      </MotionConfig>,
    );

    const article = screen.getByTestId("kpi-stack").querySelector('[data-kpi-key="opportunityCost"]');
    expect(article).toBeTruthy();
    const badgesInside = article?.querySelectorAll('[data-testid="winner-badge"]');
    expect(badgesInside?.length ?? 0).toBe(0);
  });
});

describe("CountUpNumber", () => {
  it("reaches the target after the ~1s count-up (requestAnimationFrame path)", async () => {
    render(<CountUpNumber value={37} suffix="%" />);
    await waitFor(() => expect(screen.getByText("37%")).toBeInTheDocument(), { timeout: 2500 });
  });
});
