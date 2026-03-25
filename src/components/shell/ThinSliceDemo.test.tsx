import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThinSliceDemo } from "./ThinSliceDemo";

const mockFetch = vi.fn();

const makeSuccessResponse = (pathA = "Path A", pathB = "Path B") => ({
  ok: true,
  json: () =>
    Promise.resolve({
      path_labels: { A: pathA, B: pathB },
      viz_type: "flow",
      paths: {
        A: {
          agents: [{ role: "Analyst", insight: "A insight", confidence: 0.7, grounding: "mixed" }],
          synthesis: { summary: "Path A synthesis summary.", timeline: [] },
          kpis: { revenueImpact: 10, risk: 30, customerImpact: 40, operatingCosts: 200, competitiveExposure: 25, opportunityCost: "A opportunity cost.", overallScore: 70 },
        },
        B: {
          agents: [{ role: "Analyst", insight: "B insight", confidence: 0.8, grounding: "supplied" }],
          synthesis: { summary: "Path B synthesis summary.", timeline: [] },
          kpis: { revenueImpact: 15, risk: 20, customerImpact: 50, operatingCosts: 150, competitiveExposure: 18, opportunityCost: "B opportunity cost.", overallScore: 80 },
        },
      },
      comparison: { overallWinner: "B", winnerByKpi: { revenueImpact: "B", risk: "B", customerImpact: "B", overallScore: "B" } },
      meta: { latencyMs: 1234, llmCalls: 11, estimatedCostEur: 0.14, fallbackUsed: false, cachedReplay: false, generatedAt: "2026-03-25T00:00:00Z" },
    }),
});

const delayedFetch = (response = makeSuccessResponse(), delayMs = 200) =>
  new Promise((resolve) => window.setTimeout(() => resolve(response), delayMs));

describe("ThinSliceDemo", () => {
  beforeEach(() => {
    mockFetch.mockImplementation(() => delayedFetch());
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    mockFetch.mockReset();
  });

  it("initial uiStage is input and runStatus is idle, and input shell is present", () => {
    render(<ThinSliceDemo />);
    const root = screen.getByTestId("thin-slice-root");
    expect(root).toHaveAttribute("data-ui-stage", "input");
    expect(root).toHaveAttribute("data-run-status", "idle");
    expect(screen.getByRole("region", { name: /decision input/i })).toBeInTheDocument();
  });

  it("submit transitions synchronously to submitting before microtask advances to inProgress", () => {
    render(<ThinSliceDemo />);
    fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
      target: { value: "X vs Y" },
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /simulate my decision/i }));
    });
    const root = screen.getByTestId("thin-slice-root");
    expect(root).toHaveAttribute("data-run-status", "submitting");
    expect(root).toHaveAttribute("data-ui-stage", "input");
    expect(screen.getByTestId("simulate-submit")).toHaveAttribute("aria-busy", "true");
  });

  it("flows input → dashboard after API response", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    const decisionField = screen.getByRole("textbox", { name: "Decision" });
    await act(async () => {
      fireEvent.change(decisionField, {
        target: { value: "Expand west vs deepen existing market" },
      });
    });
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(
      () =>
        expect(
          screen.getByRole("region", { name: /comparison dashboard/i }),
        ).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "dashboard");
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "completed");
    expect(screen.getByText(/overall winner/i)).toBeInTheDocument();
  });

  it("shows running stage with three-panel slots via dev panel", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");

    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: /simulation running/i })).toBeInTheDocument();
    expect(screen.getByTestId("slot-left-panel")).toBeInTheDocument();
    expect(screen.getByTestId("slot-center-panel")).toBeInTheDocument();
    expect(screen.getByTestId("slot-right-panel")).toBeInTheDocument();
  });

  it("exposes three-panel slots when running", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");

    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());
    expect(screen.getByTestId("slot-left-panel")).toBeInTheDocument();
    expect(screen.getByTestId("slot-center-panel")).toBeInTheDocument();
    expect(screen.getByTestId("slot-right-panel")).toBeInTheDocument();
  });

  it("shows mode badge and map canvas regions in map mode when running", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /simulation running/i })).toBeInTheDocument();
    });

    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-viz-type", "map");
    expect(screen.getByTestId("mode-badge-label")).toHaveTextContent("Map");
    expect(screen.getByTestId("viz-orientation-band")).toBeInTheDocument();
    expect(screen.getByTestId("map-canvas-region-left")).toBeInTheDocument();
    expect(screen.getByTestId("map-canvas-region-right")).toBeInTheDocument();
  });

  it("hides map canvas wrappers when vizType is not map", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /simulation running/i })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByTestId("dev-viz-type-preview"), "flow");

    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-viz-type", "flow");
    expect(screen.getByTestId("mode-badge-label")).toHaveTextContent("Flow");
    expect(screen.queryByTestId("map-canvas-region-left")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-canvas-region-right")).not.toBeInTheDocument();
  });

  it("shows user-derived path labels in running panel headings for pipe-separated decisions", async () => {
    mockFetch.mockImplementation(() => delayedFetch(makeSuccessResponse(), 5000));
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByTestId("dev-viz-type-preview"), "flow");

    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
        target: { value: "Bake more bread | Focus on catering" },
      });
    });
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /^Bake more bread$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Focus on catering$/ })).toBeInTheDocument();
    expect(screen.queryByText(/scenario\s*a/i)).not.toBeInTheDocument();
  });

  it("renders dashboard stage with KPI slots", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
        target: { value: "Plan A vs Plan B" },
      });
    });
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(
      () =>
        expect(screen.getByRole("region", { name: /comparison dashboard/i })).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getAllByTestId("slot-left-panel").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("slot-center-panel").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("slot-right-panel").length).toBeGreaterThanOrEqual(1);
  });

  it("renders deep dive shell with compressed side strips", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "deepDive");

    expect(await screen.findByTestId("deep-dive-shell")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "deepDive");
  });

  it("Read Full Story opens deep dive and Back returns to dashboard", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "dashboard");
    await waitFor(() => {
      expect(screen.getByTestId("read-full-story-btn")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("read-full-story-btn"));
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "deepDive");
    expect(screen.getByTestId("deep-dive-shell")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Path A/i })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByTestId("back-to-dashboard-btn"));
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "dashboard");
    expect(
      screen.getByRole("region", { name: /comparison dashboard/i }),
    ).toBeInTheDocument();
  });

  it("shows error and fallback banners as overlays while stage slots remain visible", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");
    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());

    await user.selectOptions(screen.getByTestId("dev-run-status-preview"), "error");
    expect(await screen.findByTestId("error-shell")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "error");
    expect(screen.getAllByTestId("slot-left-panel").length).toBeGreaterThanOrEqual(1);

    await user.selectOptions(screen.getByTestId("dev-run-status-preview"), "fallback");
    expect(await screen.findByTestId("fallback-shell")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "fallback");
    expect(screen.getAllByTestId("slot-left-panel").length).toBeGreaterThanOrEqual(1);
  });

  it("does not leave input when decision is empty on submit", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await user.click(screen.getByTestId("simulate-submit"));
    expect(await screen.findByTestId("decision-validation-error")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "input");
  });

  it("omits dev preview controls when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<ThinSliceDemo />);
    expect(screen.queryByTestId("dev-ui-stage-preview")).not.toBeInTheDocument();
  });

  it("supports keyboard activation of the primary submit control", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    const decisionField = screen.getByRole("textbox", { name: /decision/i });
    await user.type(decisionField, "Option one vs option two");
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
    }
    await user.keyboard("{Enter}");

    await waitFor(
      () =>
        expect(screen.getByTestId("thin-slice-root")).toHaveAttribute(
          "data-ui-stage",
          "dashboard",
        ),
      { timeout: 4000 },
    );
  });

  it("advances runStatus to completed via API response after submit", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.type(screen.getByRole("textbox", { name: /decision/i }), "X vs Y");
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(
      () =>
        expect(screen.getByTestId("thin-slice-root")).toHaveAttribute(
          "data-ui-stage",
          "dashboard",
        ),
      { timeout: 4000 },
    );
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "completed");
  });

  it("reflects real path labels from API in the dashboard", async () => {
    mockFetch.mockImplementation(() =>
      delayedFetch(makeSuccessResponse("Open Berlin office", "Expand remote team")),
    );
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.type(
      screen.getByRole("textbox", { name: /decision/i }),
      "Open Berlin office vs expand remote team",
    );
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(
      () => expect(screen.getAllByText("Open Berlin office").length).toBeGreaterThan(0),
      { timeout: 4000 },
    );
    expect(screen.getAllByText("Expand remote team").length).toBeGreaterThan(0);
  });

  it("shows error banner and falls back to estimated results when API fails", async () => {
    mockFetch.mockRejectedValue(new TypeError("Network error"));
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.type(
      screen.getByRole("textbox", { name: /decision/i }),
      "Expand west vs deepen existing",
    );
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    await waitFor(
      () => expect(screen.getByTestId("error-shell")).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByText(/simulation unavailable/i)).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "dashboard");
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "error");
  });
});
