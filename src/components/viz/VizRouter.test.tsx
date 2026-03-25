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
        setUiStage: () => {},
        setRunStatus: () => {},
      }}
    >
      {node}
    </UiShellContext.Provider>
  );
}

describe("VizRouter", () => {
  it("renders NetworkView when viz_type is network", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter {...MOCK_VIZ_SLOT_PROPS_NETWORK} agentStates={d4} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("network-view")).toBeInTheDocument();
  });

  it("renders map placeholder when viz_type is map", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell("inProgress", <VizRouter {...MOCK_VIZ_SLOT_PROPS_A} agentStates={d4} />)}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-map")).toBeInTheDocument();
  });

  it("renders flow placeholder when viz_type is flow", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter
            {...MOCK_VIZ_SLOT_PROPS_A}
            viz_type="flow"
            agentStates={d4}
          />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("viz-placeholder-flow")).toBeInTheDocument();
  });

  it("renders FallbackViz when viz_type is explicitly fallback", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "inProgress",
          <VizRouter {...MOCK_FALLBACK_VIZ_PROPS_A} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("fallback-viz")).toBeInTheDocument();
    expect(screen.queryByTestId("network-view")).not.toBeInTheDocument();
  });

  it("forces FallbackViz when shell runStatus is fallback", () => {
    render(
      <MotionConfig reducedMotion="always">
        {withShell(
          "fallback",
          <VizRouter {...MOCK_VIZ_SLOT_PROPS_NETWORK} agentStates={d4} />,
        )}
      </MotionConfig>,
    );
    expect(screen.getByTestId("fallback-viz")).toBeInTheDocument();
    expect(screen.queryByTestId("network-view")).not.toBeInTheDocument();
  });
});
