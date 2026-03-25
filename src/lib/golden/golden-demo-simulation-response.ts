import { MOCK_SIMULATION_RESPONSE } from "@/lib/mock-fixture";
import type { SimulationResponse } from "@/lib/types";

function deepCloneJson<T>(value: T): T {
  // The golden fixture is JSON-shaped (numbers/strings/arrays/objects), so
  // JSON cloning is safe and prevents shared nested references.
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Bundled golden payload for offline / CI demos (no prior live run required). */
const base = deepCloneJson(MOCK_SIMULATION_RESPONSE);

export const GOLDEN_DEMO_SIMULATION_RESPONSE: SimulationResponse = {
  ...base,
  meta: {
    ...base.meta,
    cachedReplay: true,
  },
};
