import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNearbyCompetitors, geocodeLocation } from "./overpass";

const mockFetch = vi.fn();

describe("fetchNearbyCompetitors", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("returns parsed businesses on success (nodes + ways with center)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          elements: [
            {
              type: "node",
              id: 1,
              lat: 40.418,
              lon: -3.6995,
              tags: { name: "Panadería La Mallorquina", amenity: "bakery" },
            },
            {
              type: "way",
              id: 99,
              center: { lat: 40.4205, lon: -3.7018 },
              tags: { name: "Horno San Onofre", shop: "bakery" },
            },
          ],
        }),
    });

    const result = await fetchNearbyCompetitors("bakery", 40.4167, -3.7004);

    expect(result).toEqual([
      { name: "Panadería La Mallorquina", lat: 40.418, lng: -3.6995 },
      { name: "Horno San Onofre", lat: 40.4205, lng: -3.7018 },
    ]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("overpass-api.de");
    expect(opts.method).toBe("POST");
    const body = opts.body as string;
    expect(body).toContain("bakery");
    expect(body).toContain("nwr");
  });

  it("returns empty array on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await fetchNearbyCompetitors("cafe", 40.4167, -3.7004);
    expect(result).toEqual([]);
  });

  it("returns empty array on network failure / timeout", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const result = await fetchNearbyCompetitors("restaurant", 40.4167, -3.7004);
    expect(result).toEqual([]);
  });

  it("returns empty array when response has no elements", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ elements: [] }),
    });

    const result = await fetchNearbyCompetitors("retail", 40.4167, -3.7004);
    expect(result).toEqual([]);
  });

  it("skips elements without a name tag", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          elements: [
            { type: "node", id: 1, lat: 40.418, lon: -3.6995, tags: {} },
            {
              type: "node",
              id: 2,
              lat: 40.4205,
              lon: -3.7018,
              tags: { name: "Named Shop" },
            },
          ],
        }),
    });

    const result = await fetchNearbyCompetitors("other", 40.4167, -3.7004);
    expect(result).toEqual([{ name: "Named Shop", lat: 40.4205, lng: -3.7018 }]);
  });

  it("uses the correct OSM tags for each business type", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ elements: [] }),
    });

    const types = ["bakery", "cafe", "restaurant", "retail", "services", "other"] as const;
    const expectedTags = ["bakery", "cafe", "restaurant", "convenience", "office", "amenity"];

    for (let i = 0; i < types.length; i++) {
      mockFetch.mockClear();
      await fetchNearbyCompetitors(types[i], 40.4167, -3.7004);
      const body = (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string;
      expect(decodeURIComponent(body)).toContain(expectedTags[i]);
    }
  });
});

describe("geocodeLocation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("returns lat/lng from Nominatim response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            lat: "40.4290",
            lon: "-3.7012",
            display_name: "Calle Bretón de los Herreros, Madrid, Spain",
          },
        ]),
    });

    const result = await geocodeLocation("calle breton de los herreros 54, Madrid");

    expect(result).toEqual({
      lat: 40.429,
      lng: -3.7012,
      displayName: "Calle Bretón de los Herreros, Madrid, Spain",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("nominatim.openstreetmap.org");
    expect(url).toContain("breton");
  });

  it("returns null for empty query", async () => {
    const result = await geocodeLocation("   ");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null on HTTP error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const result = await geocodeLocation("Madrid");
    expect(result).toBeNull();
  });

  it("returns null when no results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const result = await geocodeLocation("xyznonexistent12345");
    expect(result).toBeNull();
  });

  it("returns null on network failure / timeout", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const result = await geocodeLocation("Berlin");
    expect(result).toBeNull();
  });

  it("returns null when lat/lon are non-numeric", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([{ lat: "not-a-number", lon: "also-not", display_name: "Bad" }]),
    });
    const result = await geocodeLocation("somewhere");
    expect(result).toBeNull();
  });
});
