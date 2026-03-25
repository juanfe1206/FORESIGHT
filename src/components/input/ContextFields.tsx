"use client";

import type { SimulationRequest } from "@/lib/types";

/** Raw form strings for the five `SimulationRequest.context` fields (revenue parsed on submit). */
export type ContextFieldStrings = {
  industry: string;
  monthlyRevenue: string;
  location: string;
  customerBase: string;
  details: string;
};

export const emptyContextFieldStrings: ContextFieldStrings = {
  industry: "",
  monthlyRevenue: "",
  location: "",
  customerBase: "",
  details: "",
};

export function buildContextPayload(strings: ContextFieldStrings): SimulationRequest["context"] {
  const industry = strings.industry.trim();
  const location = strings.location.trim();
  const customerBase = strings.customerBase.trim();
  const details = strings.details.trim();
  const revenueParsed = parseMonthlyRevenueField(strings.monthlyRevenue);
  const context: SimulationRequest["context"] = {};
  if (industry) context.industry = industry;
  if (revenueParsed !== undefined && revenueParsed !== null) context.monthlyRevenue = revenueParsed;
  if (location) context.location = location;
  if (customerBase) context.customerBase = customerBase;
  if (details) context.details = details;
  return context;
}

/** Returns `undefined` when empty/optional; otherwise a finite number ≥ 0, or null if invalid. */
export function parseMonthlyRevenueField(raw: string): number | undefined | null {
  const t = raw.trim();
  if (!t) return undefined;
  const normalized = t.replace(/,/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

const inputClassName =
  "rounded-lg border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

type ContextFieldsProps = {
  values: ContextFieldStrings;
  onChange: (partial: Partial<ContextFieldStrings>) => void;
  revenueErrorId?: string;
  revenueError?: string | null;
};

export function ContextFields({ values, onChange, revenueErrorId, revenueError }: ContextFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="context-industry" className="text-caption font-medium text-text">
          Industry
        </label>
        <input
          id="context-industry"
          data-testid="context-industry"
          type="text"
          autoComplete="off"
          maxLength={256}
          value={values.industry}
          onChange={(ev) => onChange({ industry: ev.target.value })}
          placeholder="e.g. Neighborhood bakery"
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="context-monthly-revenue" className="text-caption font-medium text-text">
          Monthly revenue
        </label>
        <input
          id="context-monthly-revenue"
          data-testid="context-monthly-revenue"
          type="text"
          inputMode="decimal"
          aria-invalid={Boolean(revenueError)}
          aria-describedby={revenueError ? revenueErrorId : undefined}
          maxLength={32}
          value={values.monthlyRevenue}
          onChange={(ev) => onChange({ monthlyRevenue: ev.target.value })}
          placeholder="e.g. 8500 or leave blank"
          className={inputClassName}
        />
        {revenueError ? (
          <p id={revenueErrorId} role="alert" data-testid="revenue-validation-error" className="text-caption text-red-400">
            {revenueError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="context-location" className="text-caption font-medium text-text">
          Location
        </label>
        <input
          id="context-location"
          data-testid="context-location"
          type="text"
          autoComplete="off"
          maxLength={256}
          value={values.location}
          onChange={(ev) => onChange({ location: ev.target.value })}
          placeholder="e.g. North Austin, TX"
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="context-customer-base" className="text-caption font-medium text-text">
          Customer base
        </label>
        <input
          id="context-customer-base"
          data-testid="context-customer-base"
          type="text"
          maxLength={256}
          value={values.customerBase}
          onChange={(ev) => onChange({ customerBase: ev.target.value })}
          placeholder="e.g. ~120 regulars, weekend tourists"
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="context-details" className="text-caption font-medium text-text">
          Additional details
        </label>
        <textarea
          id="context-details"
          data-testid="context-details"
          rows={3}
          maxLength={1200}
          value={values.details}
          onChange={(ev) => onChange({ details: ev.target.value })}
          placeholder="Constraints, seasonality, anything else that matters…"
          className={`min-h-[5rem] resize-y ${inputClassName}`}
        />
      </div>
    </div>
  );
}
