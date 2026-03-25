"use client";

import { createContext, useContext } from "react";
import { initialUiShellState, type UiRunStatus, type UiStage, type VizType } from "./ui-state";

export type UiShellContextValue = {
  uiStage: UiStage;
  runStatus: UiRunStatus;
  vizType: VizType;
  /** Transition uiStage; prefer dispatching through the state machine rather than calling directly. */
  setUiStage: (stage: UiStage) => void;
  /** Transition runStatus; prefer dispatching through the state machine rather than calling directly. */
  setRunStatus: (status: UiRunStatus) => void;
  /** Set visualization mode (mirrors simulation `viz_type`). */
  setVizType: (viz: VizType) => void;
};

/**
 * Provides live uiStage and runStatus to any client subtree.
 * Satisfies AC1: consumers outside ThinSliceDemo can read (and in dev, drive) shell state
 * without prop-drilling into ThinSliceDemo's internals.
 */
export const UiShellContext = createContext<UiShellContextValue>({
  ...initialUiShellState,
  setUiStage: () => {},
  setRunStatus: () => {},
  setVizType: () => {},
});

export function useUiShell(): UiShellContextValue {
  return useContext(UiShellContext);
}
