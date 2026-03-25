import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_VIZ_SLOT_PROPS_A } from "@/lib/integration-contracts";
import { MapErrorBoundary, MapHalf } from "./MapHalf";

let matchMediaOriginal: typeof window.matchMedia | null = null;

function stubReducedMotion() {
  const mql = {
    matches: true,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList;

  matchMediaOriginal = window.matchMedia;
  window.matchMedia = (query: string): MediaQueryList => {
    if (query === "(prefers-reduced-motion)" || query === "(prefers-reduced-motion: reduce)") {
      return mql;
    }
    return matchMediaOriginal!(query);
  };
}

function restoreReducedMotion() {
  if (matchMediaOriginal) {
    window.matchMedia = matchMediaOriginal;
    matchMediaOriginal = null;
  }
}

const expectedRevenueImpact = Math.round(MOCK_VIZ_SLOT_PROPS_A.pathData.kpis.revenueImpact);
const expectedTickerSign = expectedRevenueImpact > 0 ? "+" : expectedRevenueImpact < 0 ? "-" : "";
const expectedTickerAbs = Math.abs(expectedRevenueImpact);
const expectedTickerText = `€${expectedTickerSign}${expectedTickerAbs}/mo`;

describe("MapHalf", () => {
  beforeEach(() => {
    stubReducedMotion();
  });

  afterEach(() => {
    restoreReducedMotion();
    vi.unstubAllEnvs();
  });

  it("renders with MOCK_VIZ_SLOT_PROPS_A and mock token without throwing", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test_mock_token");
    render(<MapHalf {...MOCK_VIZ_SLOT_PROPS_A} />);
    expect(await screen.findByTestId("mock-map", {}, { timeout: 8000 })).toBeInTheDocument();
  }, 15000);

  it("renders map even when viz_type is not map (map-only pivot)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test");
    render(<MapHalf {...MOCK_VIZ_SLOT_PROPS_A} viz_type="flow" />);
    expect(await screen.findByTestId("mock-map", {}, { timeout: 8000 })).toBeInTheDocument();
  }, 15000);

  it("threads pathTone prop to MapScene", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test");
    render(<MapHalf {...MOCK_VIZ_SLOT_PROPS_A} pathTone="A" />);
    expect(await screen.findByTestId("mock-map", {}, { timeout: 8000 })).toBeInTheDocument();
  });
});

function ThrowingChild(): never {
  throw new Error("simulated WebGL failure");
}

describe("MapErrorBoundary", () => {
  it("renders MapFallback on child render error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MapErrorBoundary>
        <ThrowingChild />
      </MapErrorBoundary>,
    );
    expect(screen.getByTestId("map-fallback")).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe("CashFlowTicker via MapHalf", () => {
  beforeEach(() => {
    stubReducedMotion();
  });

  afterEach(() => {
    restoreReducedMotion();
    vi.unstubAllEnvs();
  });

  it(
    "shows revenue impact sign and value from pathData.kpis",
    async () => {
      vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test");
      render(<MapHalf {...MOCK_VIZ_SLOT_PROPS_A} />);
      await screen.findByTestId("mock-map", {}, { timeout: 8000 });
      await waitFor(
        () => {
          expect(screen.getByTestId("cash-flow-ticker").textContent).toContain(expectedTickerText);
        },
        { timeout: 12000 },
      );
    },
    15000,
  );
});
