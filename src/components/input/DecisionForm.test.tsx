import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DecisionForm, emptyDecisionFormState } from "./DecisionForm";

describe("DecisionForm", () => {
  it("shows a specific validation message when submit is pressed with an empty decision", async () => {
    const user = userEvent.setup();
    const onValidSubmit = vi.fn();
    render(
      <DecisionForm
        value={emptyDecisionFormState}
        onChange={() => {}}
        onValidSubmit={onValidSubmit}
      />,
    );

    await user.click(screen.getByTestId("simulate-submit"));

    expect(
      await screen.findByTestId("decision-validation-error"),
    ).toHaveTextContent(/either\/or decision/i);
    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit when monthly revenue is non-numeric", async () => {
    const user = userEvent.setup();
    const onValidSubmit = vi.fn();
    render(
      <DecisionForm
        value={{
          ...emptyDecisionFormState,
          decision: "Hire vs outsource",
          monthlyRevenue: "not-a-number",
        }}
        onChange={() => {}}
        onValidSubmit={onValidSubmit}
      />,
    );

    await user.click(screen.getByTestId("simulate-submit"));

    expect(await screen.findByTestId("revenue-validation-error")).toBeInTheDocument();
    expect(onValidSubmit).not.toHaveBeenCalled();
  });
});
