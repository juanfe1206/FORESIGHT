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

  it("does not show loading on the CTA when validation fails", async () => {
    const user = userEvent.setup();
    render(
      <DecisionForm
        value={emptyDecisionFormState}
        onChange={() => {}}
        onValidSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByTestId("simulate-submit"));

    const submit = screen.getByTestId("simulate-submit");
    expect(submit).not.toHaveAttribute("aria-busy", "true");
    expect(submit).not.toBeDisabled();
  });

  it("shows loading on the CTA when isSubmitting is true", () => {
    render(
      <DecisionForm
        value={{ ...emptyDecisionFormState, decision: "A vs B" }}
        onChange={() => {}}
        onValidSubmit={vi.fn()}
        isSubmitting
      />,
    );

    const submit = screen.getByTestId("simulate-submit");
    expect(submit).toHaveAttribute("aria-busy", "true");
    expect(submit).toBeDisabled();
  });
});
