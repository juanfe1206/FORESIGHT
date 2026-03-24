import { ThinSliceDemo } from "@/components/shell/ThinSliceDemo";

/** Canonical UI shell state contract — re-exported for consumers that read types/initial state from the route module. */
export { initialUiShellState, type UiRunStatus, type UiStage } from "@/lib/ui-state";

/** Live shell state hook — re-exported for client components that need to read runtime uiStage / runStatus. */
export { useUiShell } from "@/lib/ui-shell-context";

export default function Home() {
  return <ThinSliceDemo />;
}
