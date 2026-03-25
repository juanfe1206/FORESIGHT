import { render, screen } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { describe, expect, it } from "vitest";
import { MOCK_VIZ_SLOT_PROPS_NETWORK } from "@/lib/integration-contracts";
import type { AgentState } from "@/lib/types";
import { NetworkView } from "./NetworkView";

const d4: AgentState[] = ["dormant", "dormant", "dormant", "dormant"];

describe("NetworkView", () => {
  it("renders network region with path label in accessible name", () => {
    render(
      <MotionConfig reducedMotion="always">
        <NetworkView {...MOCK_VIZ_SLOT_PROPS_NETWORK} agentStates={d4} />
      </MotionConfig>,
    );
    expect(screen.getByTestId("network-view")).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Network view for ${MOCK_VIZ_SLOT_PROPS_NETWORK.pathLabel}`),
    ).toBeInTheDocument();
  });
});
