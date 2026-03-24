import type { ReactNode } from "react";
import { CenterPanelSlot, LeftPanelSlot, RightPanelSlot } from "./PanelSlots";

type SimulationShellProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  /** Accessible labels for the three mirrored columns (Path A / intelligence / Path B). */
  leftAriaLabel: string;
  centerAriaLabel: string;
  rightAriaLabel: string;
};

/**
 * Three-panel running layout: Path A (left), center intelligence column, Path B (right).
 */
export function SimulationShell({
  left,
  center,
  right,
  leftAriaLabel,
  centerAriaLabel,
  rightAriaLabel,
}: SimulationShellProps) {
  return (
    <div
      data-testid="simulation-shell"
      className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6"
    >
      {/* P4: sr-only fallback ensures empty slots remain accessible */}
      <LeftPanelSlot aria-label={leftAriaLabel} className="order-1 flex min-h-48 flex-col lg:order-1">
        {left ?? <span className="sr-only">Empty slot</span>}
      </LeftPanelSlot>
      <CenterPanelSlot
        aria-label={centerAriaLabel}
        className="order-2 flex min-h-48 flex-col lg:order-2"
      >
        {center ?? <span className="sr-only">Empty slot</span>}
      </CenterPanelSlot>
      <RightPanelSlot aria-label={rightAriaLabel} className="order-3 flex min-h-48 flex-col lg:order-3">
        {right ?? <span className="sr-only">Empty slot</span>}
      </RightPanelSlot>
    </div>
  );
}
