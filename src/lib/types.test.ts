import { describe, expect, it } from "vitest";
import { AGENT_ROLES } from "./types";
import type { VizType } from "./types";
import { isVizType } from "./ui-state";

describe("AGENT_ROLES", () => {
  const VIZ_TYPES: VizType[] = ["map", "flow", "network", "fallback"];
  it("has a 4-tuple for every VizType", () => {
    for (const vt of VIZ_TYPES) {
      expect(AGENT_ROLES[vt]).toHaveLength(4);
      expect(AGENT_ROLES[vt].every((r) => typeof r === "string" && r.length > 0)).toBe(true);
    }
  });
});

describe("isVizType", () => {
  it("narrows known viz modes", () => {
    expect(isVizType("network")).toBe(true);
    expect(isVizType("map")).toBe(true);
    expect(isVizType("bogus")).toBe(false);
  });
});
