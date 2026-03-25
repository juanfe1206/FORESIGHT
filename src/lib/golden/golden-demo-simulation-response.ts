import { MOCK_SIMULATION_RESPONSE } from "@/lib/mock-fixture";
import type { SimulationResponse } from "@/lib/types";

/** Bundled golden payload for offline / CI demos (no prior live run required). */
export const GOLDEN_DEMO_SIMULATION_RESPONSE: SimulationResponse = {
  ...MOCK_SIMULATION_RESPONSE,
  meta: {
    ...MOCK_SIMULATION_RESPONSE.meta,
    cachedReplay: true,
  },
};
