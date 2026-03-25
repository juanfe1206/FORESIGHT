import { AppShell } from "@/components/shell/AppShell";

/** Canonical UI shell state contract — re-exported for consumers that read types/initial state from the route module. */
export {
  initialUiShellState,
  isVizType,
  type UiRunStatus,
  type UiStage,
  type VizType,
} from "@/lib/ui-state";

/** Live shell state hook — re-exported for client components that need to read runtime uiStage / runStatus. */
export { useUiShell } from "@/lib/ui-shell-context";

export default function Home() {
  return <AppShell />;
}
