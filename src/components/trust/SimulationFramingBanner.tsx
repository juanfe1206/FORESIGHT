"use client";

/**
 * FR29 — always-visible simulation / non-advice framing.
 * When `isReplay` is true the copy reflects that the view shows a saved simulation
 * rather than a freshly derived run, so both banners read naturally together (AC6).
 */
export const SIMULATION_FRAMING_BANNER_TEST_ID = "simulation-framing-banner";

export const SIMULATION_FRAMING_PRIMARY =
  "Outputs shown are simulated consequences from your inputs. They are not guaranteed forecasts, personalized professional advice, or promises of outcomes.";

export const SIMULATION_FRAMING_REPLAY =
  "Outputs shown are simulated consequences from a saved simulation. They are not guaranteed forecasts, personalized professional advice, or promises of outcomes.";

type SimulationFramingBannerProps = {
  /** Extra classes for layout (e.g. margin). */
  className?: string;
  id?: string;
  /**
   * When true, copy reads "from a saved simulation" instead of "from your inputs"
   * to stay consistent with the cached-replay / fallback banner (AC6).
   */
  isReplay?: boolean;
};

export function SimulationFramingBanner({ className = "", id, isReplay = false }: SimulationFramingBannerProps) {
  const copy = isReplay ? SIMULATION_FRAMING_REPLAY : SIMULATION_FRAMING_PRIMARY;
  return (
    <aside
      id={id}
      data-testid={SIMULATION_FRAMING_BANNER_TEST_ID}
      className={`rounded-lg border border-border bg-surface/60 px-3 py-2 text-caption leading-snug text-text-dim ${className}`}
    >
      <p className="flex gap-2 text-text-dim">
        <span aria-hidden="true" className="shrink-0 select-none text-text">
          ℹ
        </span>
        <span className="min-w-0">{copy}</span>
      </p>
    </aside>
  );
}
