/**
 * Canonical top-level UI state for the FORESIGHT shell (Story 1.3).
 * Single source of truth for uiStage / runStatus naming — do not introduce parallel keys.
 */

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
};

export const initialUiShellState: UiShellState = {
  uiStage: "input",
  runStatus: "idle",
};

/** Mock simulation run duration in milliseconds. */
export const RUN_MOCK_MS = 1800;

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
