import { describe, expect, it } from "vitest";
import { MADRID_DISTRITOS, type DistritoProperties } from "./madrid-distritos";

const REQUIRED_PROPERTIES: (keyof DistritoProperties)[] = [
  "name",
  "population",
  "avgIncome",
  "commercialDensity",
  "area_km2",
];

describe("MADRID_DISTRITOS fixture", () => {
  it("contains exactly 21 distrito features", () => {
    expect(MADRID_DISTRITOS.features).toHaveLength(21);
  });

  it("every feature has all required properties with correct types", () => {
    for (const feature of MADRID_DISTRITOS.features) {
      expect(feature.type).toBe("Feature");
      expect(feature.geometry.type).toBe("MultiPolygon");

      for (const key of REQUIRED_PROPERTIES) {
        expect(feature.properties).toHaveProperty(key);
      }

      expect(typeof feature.properties.name).toBe("string");
      expect(feature.properties.name.length).toBeGreaterThan(0);
      expect(typeof feature.properties.population).toBe("number");
      expect(feature.properties.population).toBeGreaterThan(0);
      expect(typeof feature.properties.avgIncome).toBe("number");
      expect(feature.properties.avgIncome).toBeGreaterThan(0);
      expect(typeof feature.properties.commercialDensity).toBe("number");
      expect(feature.properties.commercialDensity).toBeGreaterThan(0);
      expect(typeof feature.properties.area_km2).toBe("number");
      expect(feature.properties.area_km2).toBeGreaterThan(0);
    }
  });

  it("has unique distrito names", () => {
    const names = MADRID_DISTRITOS.features.map((f) => f.properties.name);
    expect(new Set(names).size).toBe(21);
  });

  it("includes Centro distrito", () => {
    const centro = MADRID_DISTRITOS.features.find((f) => f.properties.name === "Centro");
    expect(centro).toBeDefined();
  });
});
