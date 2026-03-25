import { render, screen } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { describe, expect, it } from "vitest";
import { MOCK_FALLBACK_VIZ_PROPS_A } from "@/lib/integration-contracts";
import { AGENT_ROLES } from "@/lib/types";
import { FallbackViz } from "./FallbackViz";

describe("FallbackViz", () => {
  it("shows simplified view copy and fallback role labels", () => {
    render(
      <MotionConfig reducedMotion="always">
        <FallbackViz {...MOCK_FALLBACK_VIZ_PROPS_A} />
      </MotionConfig>,
    );
    expect(screen.getByText("Simplified view")).toBeInTheDocument();
    for (const role of AGENT_ROLES.fallback) {
      const short = role.slice(0, 14);
      expect(screen.getByText(short)).toBeInTheDocument();
    }
  });

  it("renders reduced motion without throwing", () => {
    render(
      <MotionConfig reducedMotion="always">
        <FallbackViz
          {...MOCK_FALLBACK_VIZ_PROPS_A}
          agentStates={["thinking", "dormant", "dormant", "dormant"]}
        />
      </MotionConfig>,
    );
    expect(screen.getByTestId("fallback-viz")).toBeInTheDocument();
  });
});
