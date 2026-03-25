import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_VIZ_SLOT_PROPS_A } from "@/lib/integration-contracts";
import { MapErrorBoundary, MapHalf } from "./MapHalf";

describe("MapHalf", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders with MOCK_VIZ_SLOT_PROPS_A and mock token without throwing", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test_mock_token");
    render(<MapHalf {...MOCK_VIZ_SLOT_PROPS_A} />);
    expect(await screen.findByTestId("mock-map", {}, { timeout: 8000 })).toBeInTheDocument();
  });

  it("returns null when viz_type is not map", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test");
    const { container } = render(
      <MapHalf
        {...MOCK_VIZ_SLOT_PROPS_A}
        viz_type="flow"
      />,
    );
    expect(container.firstChild).toBeNull();
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
  afterEach(() => {
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
          expect(screen.getByTestId("cash-flow-ticker").textContent).toMatch(/€\+12\/mo/);
        },
        { timeout: 12000 },
      );
    },
    15000,
  );
});
