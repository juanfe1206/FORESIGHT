import { render, screen } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  MOCK_FALLBACK_VIZ_PROPS_A,
  MOCK_VIZ_SLOT_PROPS_A,
  MOCK_VIZ_SLOT_PROPS_NETWORK,
} from "@/lib/integration-contracts";
import { UiShellContext, type UiShellContextValue } from "@/lib/ui-shell-context";
import type { AgentState } from "@/lib/types";
import { VizRouter } from "./VizRouter";

const d4: AgentState[] = ["dormant", "dormant", "dormant", "dormant"];

function withShell(runStatus: UiShellContextValue["runStatus"], node: ReactNode) {
  return (
    <UiShellContext.Provider
      value={{
        uiStage: "running",
        runStatus,
        vizType: "map",
        setUiStage: () => {},
        setRunStatus: () => {},
        setVizType: () => {},
      }}
    >
      {node}
    </UiShellContext.Provider>
  );
}

describe("VizRouter (map-only pivot)", () => {
  it("always renders map placeholder regardless of viz_type", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter {...MOCK_VIZ_SLOT_PROPS_A} viz_type="flow" agentStates={d4} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });

  it("renders map placeholder for network viz_type", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter {...MOCK_VIZ_SLOT_PROPS_NETWORK} agentStates={d4} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });

  it("renders map placeholder when viz_type is map", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell("inProgress", <VizRouter {...MOCK_VIZ_SLOT_PROPS_A} agentStates={d4} />)}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });

  it("renders map placeholder for fallback viz_type", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter {...MOCK_FALLBACK_VIZ_PROPS_A} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });

  it("renders map placeholder even when shell runStatus is fallback", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "fallback",
          <VizRouter {...MOCK_VIZ_SLOT_PROPS_NETWORK} agentStates={d4} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });
});
