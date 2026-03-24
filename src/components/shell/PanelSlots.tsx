import type { ReactNode } from "react";

type PanelSlotProps = {
  children?: ReactNode;
  /** Accessible name for the slot region (varies by uiStage in the parent). */
  "aria-label": string;
  className?: string;
};

/**
 * Stable slot boundaries for parallel teams (Epic 3–5). Mount feature UI inside these wrappers.
 */
export function LeftPanelSlot({ children, "aria-label": ariaLabel, className = "" }: PanelSlotProps) {
  return (
    <div
      data-testid="slot-left-panel"
      data-slot="leftPanel"
      role="region"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}

export function CenterPanelSlot({ children, "aria-label": ariaLabel, className = "" }: PanelSlotProps) {
  return (
    <div
      data-testid="slot-center-panel"
      data-slot="centerPanel"
      role="region"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}

export function RightPanelSlot({ children, "aria-label": ariaLabel, className = "" }: PanelSlotProps) {
  return (
    <div
      data-testid="slot-right-panel"
      data-slot="rightPanel"
      role="region"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}
