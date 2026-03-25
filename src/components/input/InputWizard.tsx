"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SimulationRequest } from "@/lib/types";
import type { NearbyBusiness } from "@/lib/overpass";
import { fetchNearbyCompetitors, geocodeLocation } from "@/lib/overpass";
import { LocationSearchInput, type LocationSelection } from "./LocationSearchInput";
import { GlowButton } from "@/components/shared/GlowButton";
import {
  type ContextFieldStrings,
  buildContextPayload,
  emptyContextFieldStrings,
  parseMonthlyRevenueField,
} from "./ContextFields";
import { CompetitorConfirmStep } from "./CompetitorConfirmStep";
import { SimulationFramingBanner } from "@/components/trust/SimulationFramingBanner";

export type BusinessType = "bakery" | "cafe" | "restaurant" | "retail" | "services" | "other";
const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "bakery", label: "Bakery" },
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export type InputWizardState = {
  decision: string;
  businessType: BusinessType | "";
  employeeCount: string;
  productsOrServices: string;
} & ContextFieldStrings;

export const emptyWizardState: InputWizardState = {
  decision: "",
  businessType: "",
  employeeCount: "",
  productsOrServices: "",
  ...emptyContextFieldStrings,
};

const TOTAL_STEPS = 4;

const inputClassName =
  "rounded-lg border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

const DECISION_PLACEHOLDER =
  "Example: Should I open a second location downtown vs. stay put and upgrade my kitchen? Describe both options in your own words.";

type InputWizardProps = {
  value: InputWizardState;
  onChange: (partial: Partial<InputWizardState>) => void;
  onValidSubmit: (payload: {
    decision: string;
    context: SimulationRequest["context"];
  }) => void;
  isSubmitting?: boolean;
  /** Pre-loaded competitors for demo scenarios. */
  preloadedCompetitors?: NearbyBusiness[] | null;
  /** Callback when step changes (used by parent to track wizard progress). */
  onStepChange?: (step: number) => void;
  /** Force wizard to a specific step (used by demo scenario buttons). */
  initialStep?: number;
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Wizard progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          data-testid={`wizard-step-dot-${i}`}
          className={`size-2.5 rounded-full transition-colors ${
            i === current ? "bg-accent" : i < current ? "bg-accent/50" : "bg-border"
          }`}
          aria-label={`Step ${i + 1}${i === current ? " (current)" : i < current ? " (completed)" : ""}`}
        />
      ))}
    </div>
  );
}

export function InputWizard({
  value,
  onChange,
  onValidSubmit,
  isSubmitting = false,
  preloadedCompetitors = null,
  onStepChange,
  initialStep = 0,
}: InputWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    setDirection(initialStep > step ? 1 : -1);
    setStep(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);

  const decisionErrorId = useId();
  const revenueErrorId = useId();
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [competitors, setCompetitors] = useState<NearbyBusiness[]>(preloadedCompetitors ?? []);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState(false);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const selectedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const fetchedForRef = useRef<string>("");

  useEffect(() => {
    if (preloadedCompetitors) {
      setCompetitors(preloadedCompetitors);
    }
  }, [preloadedCompetitors]);

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setStep(next);
      onStepChange?.(next);
    },
    [step, onStepChange],
  );

  const goNext = useCallback(() => goTo(step + 1), [goTo, step]);
  const goBack = useCallback(() => goTo(step - 1), [goTo, step]);

  const handleStep1Next = useCallback(() => {
    const trimmed = value.decision.trim();
    if (!trimmed || trimmed.length > 2000) {
      setDecisionError(
        !trimmed
          ? "Enter your either/or decision so we can simulate both paths."
          : "Decision must be 2000 characters or fewer.",
      );
      return;
    }
    setDecisionError(null);
    goNext();
  }, [value.decision, goNext]);

  const handleStep2Next = useCallback(() => {
    const revenue = parseMonthlyRevenueField(value.monthlyRevenue);
    if (revenue === null) {
      setRevenueError("Enter a valid monthly revenue (zero or positive number), or leave this field blank.");
      return;
    }
    setRevenueError(null);
    goNext();
  }, [value.monthlyRevenue, goNext]);

  const handleLocationSelect = useCallback(
    (selection: LocationSelection) => {
      selectedCoordsRef.current = { lat: selection.lat, lng: selection.lng };
      setResolvedCoords({ lat: selection.lat, lng: selection.lng });
    },
    [],
  );

  const handleConfirmLocation = useCallback(() => {
    goNext();

    const locationKey = `${value.businessType}|${value.location}`;
    if (fetchedForRef.current === locationKey || preloadedCompetitors) return;

    fetchedForRef.current = locationKey;
    setCompetitorLoading(true);
    setCompetitorError(false);
    setCompetitors([]);

    const bizType = value.businessType || "other";
    const picked = selectedCoordsRef.current;

    if (picked) {
      setResolvedCoords(picked);
      fetchNearbyCompetitors(bizType, picked.lat, picked.lng).then(
        (results) => { setCompetitors(results); setCompetitorLoading(false); },
        () => { setCompetitorError(true); setCompetitorLoading(false); },
      );
    } else {
      geocodeLocation(value.location).then(
        (geo) => {
          const lat = geo?.lat ?? 40.4167;
          const lng = geo?.lng ?? -3.7004;
          if (geo) setResolvedCoords({ lat, lng });
          fetchNearbyCompetitors(bizType, lat, lng).then(
            (results) => { setCompetitors(results); setCompetitorLoading(false); },
            () => { setCompetitorError(true); setCompetitorLoading(false); },
          );
        },
        () => { setCompetitorError(true); setCompetitorLoading(false); },
      );
    }
  }, [goNext, value.businessType, value.location, preloadedCompetitors]);

  const handleSubmit = useCallback(() => {
    const contextBase = buildContextPayload(value);
    const employeeCountNum = value.employeeCount.trim()
      ? Number(value.employeeCount.trim())
      : undefined;

    const context: SimulationRequest["context"] = {
      ...contextBase,
      ...(value.businessType ? { businessType: value.businessType } : {}),
      ...(employeeCountNum !== undefined && Number.isFinite(employeeCountNum) && employeeCountNum >= 0
        ? { employeeCount: employeeCountNum }
        : {}),
      ...(value.productsOrServices.trim()
        ? { productsOrServices: value.productsOrServices.trim() }
        : {}),
      ...(competitors.length > 0 ? { confirmedCompetitors: competitors } : {}),
      ...(resolvedCoords ? { confirmedLocation: resolvedCoords } : {}),
    };

    onValidSubmit({ decision: value.decision.trim(), context });
  }, [value, competitors, resolvedCoords, onValidSubmit]);

  const slideVariants = {
    enter: (d: number) => ({
      x: reduceMotion ? 0 : d > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({
      x: reduceMotion ? 0 : d > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  const slideTransition = reduceMotion
    ? { duration: 0.05 }
    : { type: "spring" as const, stiffness: 300, damping: 30 };

  return (
    <div className="flex flex-col gap-6" data-testid="input-wizard">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      <AnimatePresence mode="wait" custom={direction}>
        {step === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            data-testid="wizard-step-0"
          >
            <Step1Decision
              value={value.decision}
              onChange={(decision) => {
                onChange({ decision });
                if (decisionError) setDecisionError(null);
              }}
              error={decisionError}
              errorId={decisionErrorId}
              onNext={handleStep1Next}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            data-testid="wizard-step-1"
          >
            <Step2BusinessDetails
              value={value}
              onChange={(partial) => {
                onChange(partial);
                if (partial.monthlyRevenue !== undefined && revenueError) setRevenueError(null);
              }}
              revenueError={revenueError}
              revenueErrorId={revenueErrorId}
              onNext={handleStep2Next}
              onBack={goBack}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            data-testid="wizard-step-2"
          >
            <Step3ConfirmLocation
              location={value.location}
              onLocationChange={(location) => {
                onChange({ location });
                selectedCoordsRef.current = null;
              }}
              onLocationSelect={handleLocationSelect}
              onConfirm={handleConfirmLocation}
              onBack={goBack}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            data-testid="wizard-step-3"
          >
            <CompetitorConfirmStep
              competitors={competitors}
              loading={competitorLoading}
              error={competitorError}
              onSubmit={handleSubmit}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {step === 0 && <SimulationFramingBanner />}
    </div>
  );
}

function Step1Decision({
  value,
  onChange,
  error,
  errorId,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  errorId: string;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="input-decision" className="text-caption font-medium text-text">
          Decision
        </label>
        <textarea
          id="input-decision"
          data-testid="input-decision"
          name="decision"
          rows={5}
          maxLength={2000}
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && !ev.shiftKey) {
              ev.preventDefault();
              onNext();
            }
          }}
          placeholder={DECISION_PLACEHOLDER}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-[8rem] resize-y ${inputClassName}`}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            data-testid="decision-validation-error"
            className="text-caption text-red-400"
          >
            {error}
          </p>
        )}
      </div>
      <GlowButton type="button" data-testid="wizard-next-0" onClick={onNext}>
        Next
      </GlowButton>
    </div>
  );
}

function Step2BusinessDetails({
  value,
  onChange,
  revenueError,
  revenueErrorId,
  onNext,
  onBack,
}: {
  value: InputWizardState;
  onChange: (partial: Partial<InputWizardState>) => void;
  revenueError: string | null;
  revenueErrorId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="wizard-business-type" className="text-caption font-medium text-text">
          Business type
        </label>
        <select
          id="wizard-business-type"
          data-testid="wizard-business-type"
          value={value.businessType}
          onChange={(ev) => onChange({ businessType: ev.target.value as BusinessType | "" })}
          className={inputClassName}
        >
          <option value="">Select…</option>
          {BUSINESS_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="wizard-employee-count" className="text-caption font-medium text-text">
          Employee count
        </label>
        <input
          id="wizard-employee-count"
          data-testid="wizard-employee-count"
          type="number"
          min={0}
          value={value.employeeCount}
          onChange={(ev) => onChange({ employeeCount: ev.target.value })}
          placeholder="e.g. 4"
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="wizard-products" className="text-caption font-medium text-text">
          Products or services
        </label>
        <input
          id="wizard-products"
          data-testid="wizard-products"
          type="text"
          maxLength={500}
          value={value.productsOrServices}
          onChange={(ev) => onChange({ productsOrServices: ev.target.value })}
          placeholder="e.g. Artisan bread, pastries, coffee"
          className={inputClassName}
        />
      </div>

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
          value={value.industry}
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
          value={value.monthlyRevenue}
          onChange={(ev) => onChange({ monthlyRevenue: ev.target.value })}
          placeholder="e.g. 8500 or leave blank"
          className={inputClassName}
        />
        {revenueError && (
          <p id={revenueErrorId} role="alert" data-testid="revenue-validation-error" className="text-caption text-red-400">
            {revenueError}
          </p>
        )}
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
          value={value.location}
          onChange={(ev) => onChange({ location: ev.target.value })}
          placeholder="e.g. Madrid, Spain"
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
          value={value.customerBase}
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
          value={value.details}
          onChange={(ev) => onChange({ details: ev.target.value })}
          placeholder="Constraints, seasonality, anything else that matters…"
          className={`min-h-[5rem] resize-y ${inputClassName}`}
        />
      </div>

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent"
        >
          Back
        </button>
        <GlowButton type="button" data-testid="wizard-next-1" onClick={onNext}>
          Next
        </GlowButton>
      </div>
    </div>
  );
}

function Step3ConfirmLocation({
  location,
  onLocationChange,
  onLocationSelect,
  onConfirm,
  onBack,
}: {
  location: string;
  onLocationChange: (v: string) => void;
  onLocationSelect: (selection: LocationSelection) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-surface p-6" data-testid="location-confirm-card">
        <p className="text-caption font-medium text-text-dim">Your location</p>
        <p className="mt-1 text-caption text-text-dim/70">
          Start typing to search for your address
        </p>
        <LocationSearchInput
          value={location}
          onChange={onLocationChange}
          onSelect={onLocationSelect}
          data-testid="wizard-location-confirm"
          className={`mt-2 w-full ${inputClassName}`}
          placeholder="e.g. Calle Bretón de los Herreros 54, Madrid"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent"
        >
          Back
        </button>
        <GlowButton type="button" data-testid="wizard-confirm-location" onClick={onConfirm}>
          Confirm location
        </GlowButton>
      </div>
    </div>
  );
}
