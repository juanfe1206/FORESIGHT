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

/**
 * Default fetch mock: resolves after 200 ms via setTimeout so the "running"
 * stage is visible long enough for assertions before the dashboard transition.
 */
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

  // P5: Assert initial state AND the input shell region (not just data attributes)
  it("initial uiStage is input and runStatus is idle, and input shell is present", () => {
    render(<ThinSliceDemo />);
    const root = screen.getByTestId("thin-slice-root");
    expect(root).toHaveAttribute("data-ui-stage", "input");
    expect(root).toHaveAttribute("data-run-status", "idle");
    expect(screen.getByRole("region", { name: /decision input/i })).toBeInTheDocument();
  });

  // P6: Verify submitting → inProgress ordering before the mock timer fires
  it("submit transitions synchronously to submitting before microtask advances to inProgress", () => {
    render(<ThinSliceDemo />);
    fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
      target: { value: "X vs Y" },
    });
    // Synchronous act: flushes React state from setRunStatus("submitting") but NOT queueMicrotask
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /simulate my decision/i }));
    });
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "submitting");
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
    expect(screen.getByText(/Path B synthesis summary/i)).toBeInTheDocument();
  });

  it("shows running stage with three-panel slots via dev panel", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");

    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: /simulation running/i })).toBeInTheDocument();
    expect(screen.getByText(/simulating/i)).toBeInTheDocument();
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

  // D3: Error/fallback are overlays — stage shell remains visible beneath them
  it("shows error and fallback banners as overlays while stage slots remain visible", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    // Navigate to running state first so the stage has panel slots
    await user.selectOptions(screen.getByLabelText(/dev: uistage/i), "running");
    await waitFor(() => expect(screen.getByTestId("simulation-shell")).toBeInTheDocument());

    // Set error — banner renders, but running stage slots stay visible underneath
    await user.selectOptions(screen.getByTestId("dev-run-status-preview"), "error");
    expect(await screen.findByTestId("error-shell")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "error");
    expect(screen.getAllByTestId("slot-left-panel").length).toBeGreaterThanOrEqual(1);

    // Set fallback — banner renders, running stage slots still visible
    await user.selectOptions(screen.getByTestId("dev-run-status-preview"), "fallback");
    expect(await screen.findByTestId("fallback-shell")).toBeInTheDocument();
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "fallback");
    expect(screen.getAllByTestId("slot-left-panel").length).toBeGreaterThanOrEqual(1);
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
    await user.tab();
    await user.keyboard("{Enter}");

    // Keyboard submit should trigger the API and eventually reach the dashboard
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
