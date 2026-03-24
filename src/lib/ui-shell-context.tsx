"use client";

import { createContext, useContext } from "react";
import { initialUiShellState, type UiRunStatus, type UiStage } from "./ui-state";

export type UiShellContextValue = {
  uiStage: UiStage;
  runStatus: UiRunStatus;
  /** Transition uiStage; prefer dispatching through the state machine rather than calling directly. */
  setUiStage: (stage: UiStage) => void;
  /** Transition runStatus; prefer dispatching through the state machine rather than calling directly. */
  setRunStatus: (status: UiRunStatus) => void;
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
});

export function useUiShell(): UiShellContextValue {
  return useContext(UiShellContext);
}
