import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThinSliceDemo } from "./ThinSliceDemo";

describe("ThinSliceDemo", () => {
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
      () =>
        expect(
          screen.getByRole("region", { name: /mock comparison dashboard/i }),
        ).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByText(/mock outcome/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.24M/)).toBeInTheDocument();
  });
});
