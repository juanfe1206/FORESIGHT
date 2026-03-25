import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS, DEMO_SCENARIO_ORDER } from "@/lib/demo-scenarios";

describe("demo scenarios fixture pack", () => {
  it("exports exactly three stable scenario IDs in the intended order", () => {
    const keys = Object.keys(DEMO_SCENARIOS).sort();
    expect(keys).toEqual([...DEMO_SCENARIO_ORDER].sort());
    expect(DEMO_SCENARIO_ORDER).toHaveLength(3);
    expect(keys).toHaveLength(3);
  });
});

describe("demo scenarios shape", () => {
  for (const id of DEMO_SCENARIO_ORDER) {
    it(`scenario ${id} has deterministic non-empty decision and typed context`, () => {
      const s = DEMO_SCENARIOS[id];
      expect(s).toBeDefined();
      expect(s.id).toBe(id);
      expect(typeof s.decision).toBe("string");
      expect(s.decision.trim().length).toBeGreaterThan(10);
      expect(typeof s.expectedVizType).toBe("string");

      // context is typed; this is a runtime sanity check for demo repeatability.
      expect(s.context).toBeDefined();
      if (s.context.monthlyRevenue !== undefined) {
        expect(typeof s.context.monthlyRevenue).toBe("number");
        expect(s.context.monthlyRevenue).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

