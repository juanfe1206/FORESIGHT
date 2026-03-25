"use client";

import type { NearbyBusiness } from "@/lib/overpass";
import { GlowButton } from "@/components/shared/GlowButton";

type CompetitorConfirmStepProps = {
  competitors: NearbyBusiness[];
  loading: boolean;
  error: boolean;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
};

export function CompetitorConfirmStep({
  competitors,
  loading,
  error,
  onSubmit,
  onBack,
  isSubmitting = false,
}: CompetitorConfirmStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 text-text">Nearby competitors</h2>
        <p className="mt-1 text-caption text-text-dim">
          We searched OpenStreetMap for businesses near your location.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {loading && (
          <p className="text-body text-text-dim" data-testid="competitor-loading">
            Finding nearby competitors…
          </p>
        )}

        {!loading && competitors.length === 0 && (
          <p className="text-body text-text-dim" data-testid="competitor-empty">
            {error
              ? "Could not fetch competitor data — the simulation will proceed without it."
              : "No competitors found nearby — the simulation will proceed without competitor data."}
          </p>
        )}

        {!loading && competitors.length > 0 && (
          <ul className="flex flex-col gap-2" data-testid="competitor-list">
            {competitors.map((c, i) => (
              <li
                key={`${c.name}-${c.lat}-${c.lng}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                data-testid={`competitor-item-${i}`}
              >
                <div className="size-3 shrink-0 rotate-45 bg-red" />
                <span className="text-body text-text">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent"
        >
          Back
        </button>
        <GlowButton
          type="button"
          data-testid="wizard-submit"
          loading={isSubmitting}
          onClick={onSubmit}
        >
          Run Simulation
        </GlowButton>
      </div>
    </div>
  );
}
