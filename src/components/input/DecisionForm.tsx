"use client";

import { type FormEvent, type ReactNode, useCallback, useId, useState } from "react";
import type { SimulationRequest } from "@/lib/types";
import { GlowButton } from "@/components/shared/GlowButton";
import {
  type ContextFieldStrings,
  buildContextPayload,
  emptyContextFieldStrings,
  parseMonthlyRevenueField,
  ContextFields,
} from "./ContextFields";

export type DecisionFormInputState = {
  decision: string;
} & ContextFieldStrings;

export const emptyDecisionFormState: DecisionFormInputState = {
  decision: "",
  ...emptyContextFieldStrings,
};

const DECISION_PLACEHOLDER =
  "Example: Should I open a second location downtown vs. stay put and upgrade my kitchen? Describe both options in your own words.";

const inputClassName =
  "rounded-lg border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

type DecisionFormProps = {
  value: DecisionFormInputState;
  onChange: (partial: Partial<DecisionFormInputState>) => void;
  onValidSubmit: (payload: { decision: string; context: SimulationRequest["context"] }) => void;
  /** When true, CTA shows loading and is disabled (valid submit path only). */
  isSubmitting?: boolean;
  /** Optional trust / simulation copy after the submit control (e.g. FR29 banner). */
  formFooter?: ReactNode;
};

export function DecisionForm({
  value,
  onChange,
  onValidSubmit,
  isSubmitting = false,
  formFooter,
}: DecisionFormProps) {
  const decisionErrorId = useId();
  const revenueErrorId = useId();
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = value.decision.trim();
      if (!trimmed) {
        setDecisionError("Enter your either/or decision so we can simulate both paths.");
        setRevenueError(null);
        return;
      }
      setDecisionError(null);

      const revenue = parseMonthlyRevenueField(value.monthlyRevenue);
      if (revenue === null) {
        setRevenueError("Enter a valid monthly revenue (zero or positive number), or leave this field blank.");
        return;
      }
      setRevenueError(null);

      const context = buildContextPayload(value);

      onValidSubmit({ decision: trimmed, context });
    },
    [onValidSubmit, value],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="input-decision" className="text-caption font-medium text-text">
          Decision
        </label>
        <textarea
          id="input-decision"
          data-testid="input-decision"
          name="decision"
          rows={5}
          maxLength={4000}
          value={value.decision}
          onChange={(ev) => {
            onChange({ decision: ev.target.value });
            if (decisionError) setDecisionError(null);
          }}
          placeholder={DECISION_PLACEHOLDER}
          aria-invalid={decisionError ? true : undefined}
          aria-describedby={decisionError ? decisionErrorId : undefined}
          className={`min-h-[8rem] resize-y ${inputClassName}`}
        />
        {decisionError ? (
          <p
            id={decisionErrorId}
            role="alert"
            data-testid="decision-validation-error"
            className="text-caption text-red-400"
          >
            {decisionError}
          </p>
        ) : null}
      </div>

      <ContextFields
        values={{
          industry: value.industry,
          monthlyRevenue: value.monthlyRevenue,
          location: value.location,
          customerBase: value.customerBase,
          details: value.details,
        }}
        onChange={(partial) => {
          onChange(partial);
          if (partial.monthlyRevenue !== undefined && revenueError) setRevenueError(null);
        }}
        revenueErrorId={revenueErrorId}
        revenueError={revenueError}
      />

      <GlowButton
        type="submit"
        data-testid="simulate-submit"
        loading={isSubmitting}
      >
        Simulate My Decision
      </GlowButton>
      {formFooter != null ? <div className="mt-4">{formFooter}</div> : null}
    </form>
  );
}
