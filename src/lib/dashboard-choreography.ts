/**
 * Dashboard results choreography — keep in sync with KpiStack row stagger,
 * CountUpNumber default duration (~1s), and WinnerBadge motion delay (1s).
 *
 * Score rings are the "second act" after the KPI stack wave (UX-DR15).
 */

/** Per-row entrance stagger in KpiStack — must match `KpiStack` delays. */
export const KPI_STACK_ROW_STAGGER_S = 0.15;

export const KPI_STACK_ROW_COUNT = 6;

/** Matches `CountUpNumber` default `durationMs`. */
export const KPI_COUNT_UP_DURATION_S = 1;

/** Matches `WinnerBadge` spring `delay` when reduced motion is off. */
export const WINNER_BADGE_DELAY_S = 1;

/**
 * Seconds after dashboard mount before score rings begin their entrance
 * (after last row stagger + count-up + winner-badge delay).
 * = (6-1) * 0.15 + 1 + 1 = 2.75s
 */
export const SCORE_RING_ENTRANCE_DELAY_S =
  (KPI_STACK_ROW_COUNT - 1) * KPI_STACK_ROW_STAGGER_S +
  KPI_COUNT_UP_DURATION_S +
  WINNER_BADGE_DELAY_S;

/**
 * "Read full story" fades in after rings AND their inner count-up (~1s) finish.
 * = 2.75 + 1 + 0.05 = 3.8s (accepted deviation from ~2.5s nominal budget — choreography review 2026-03-25).
 */
export const READ_FULL_STORY_DELAY_S =
  SCORE_RING_ENTRANCE_DELAY_S + KPI_COUNT_UP_DURATION_S + 0.05;
