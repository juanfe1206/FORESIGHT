/**
 * Canonical top-level UI state for the FORESIGHT shell (Story 1.3).
 * Single source of truth for uiStage / runStatus naming — do not introduce parallel keys.
 */

import type { VizType } from "./types";

export type { VizType } from "./types";

export type UiStage = "input" | "running" | "dashboard" | "deepDive";

export type UiRunStatus =
  | "idle"
  | "submitting"
  | "inProgress"
  | "completed"
  | "fallback"
  | "error";

export type UiShellState = {
  uiStage: UiStage;
  runStatus: UiRunStatus;
  /** Visualization mode from simulation result — aligned with `MOCK_BAKERY_MAP_FIXTURE.viz_type` default. */
  vizType: VizType;
};

/** Default matches `src/lib/mock-fixture.ts` `MOCK_BAKERY_MAP_FIXTURE.viz_type`. */
const DEFAULT_VIZ_TYPE: VizType = "map";

export const initialUiShellState: UiShellState = {
  uiStage: "input",
  runStatus: "idle",
  vizType: DEFAULT_VIZ_TYPE,
};

const VIZ_TYPES: readonly VizType[] = ["map", "flow", "network", "fallback"];

export function isVizType(v: string): v is VizType {
  return (VIZ_TYPES as readonly string[]).includes(v);
}

/**
 * Mock simulation run duration in milliseconds.
 * Last agent completes at ~2660 ms; this adds ~840 ms of settled "complete" view before dashboard.
 */
export const RUN_MOCK_MS = 3500;

const UI_STAGES: readonly UiStage[] = ["input", "running", "dashboard", "deepDive"];
const UI_RUN_STATUSES: readonly UiRunStatus[] = [
  "idle",
  "submitting",
  "inProgress",
  "completed",
  "fallback",
  "error",
];

export function isUiStage(v: string): v is UiStage {
  return (UI_STAGES as readonly string[]).includes(v);
}

export function isUiRunStatus(v: string): v is UiRunStatus {
  return (UI_RUN_STATUSES as readonly string[]).includes(v);
}
