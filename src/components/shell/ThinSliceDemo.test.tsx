import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RUN_MOCK_MS } from "@/lib/ui-state";
import { ThinSliceDemo } from "./ThinSliceDemo";

describe("ThinSliceDemo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
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

  it("flows input → running → dashboard without API calls", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);

    const decisionField = screen.getByRole("textbox", { name: "Decision" });
    await act(async () => {
      fireEvent.change(decisionField, {
        target: { value: "Expand west vs deepen existing market" },
      });
    });
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

    expect(await screen.findByRole("region", { name: /simulation running/i })).toBeInTheDocument();
    expect(screen.getByText(/simulating/i)).toBeInTheDocument();

    await waitFor(
      () => {
        const root = screen.getByTestId("thin-slice-root");
        expect(root).toHaveAttribute("data-ui-stage", "running");
        expect(["submitting", "inProgress"]).toContain(root.getAttribute("data-run-status"));
      },
      { timeout: 2000 },
    );

    await waitFor(
      () =>
        expect(
          screen.getByRole("region", { name: /mock comparison dashboard/i }),
        ).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "dashboard");
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "completed");
    expect(screen.getByText(/mock outcome/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.24M/)).toBeInTheDocument();
  });

  it("exposes three-panel slots when running", async () => {
    const user = userEvent.setup();
    render(<ThinSliceDemo />);
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
        target: { value: "A vs B" },
      });
    });
    await user.click(screen.getByRole("button", { name: /simulate my decision/i }));

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
        expect(screen.getByRole("region", { name: /mock comparison dashboard/i })).toBeInTheDocument(),
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
    // Tab order: decision → five context fields → submit
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
    }
    await user.keyboard("{Enter}");

    await waitFor(
      () => expect(screen.getByRole("region", { name: /simulation running/i })).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  // P8: Use RUN_MOCK_MS constant instead of hardcoded 1800
  it("advances runStatus through mock completion with fake timers", async () => {
    vi.useFakeTimers();
    render(<ThinSliceDemo />);

    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: /decision/i }), {
        target: { value: "X vs Y" },
      });
      fireEvent.click(screen.getByRole("button", { name: /simulate my decision/i }));
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("thin-slice-root").getAttribute("data-run-status")).toBe("inProgress");

    await act(async () => {
      vi.advanceTimersByTime(RUN_MOCK_MS);
    });

    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-ui-stage", "dashboard");
    expect(screen.getByTestId("thin-slice-root")).toHaveAttribute("data-run-status", "completed");
  });
});
