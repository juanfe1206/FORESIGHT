export interface NearbyBusiness {
  name: string;
  lat: number;
  lng: number;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Union of OSM tag filters per business type. Each entry produces one or more
 * `nwr[tag](around:...)` clauses combined in an Overpass union `(...)`.
 */
const BUSINESS_TYPE_FILTERS: Record<string, string[]> = {
  bakery: ['["amenity"="bakery"]', '["shop"="bakery"]'],
  cafe: ['["amenity"="cafe"]', '["shop"="coffee"]'],
  restaurant: ['["amenity"="restaurant"]'],
  retail: ['["shop"="convenience"]', '["shop"="supermarket"]', '["shop"="general"]'],
  services: ['["office"]'],
  other: ['["amenity"]'],
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_RADIUS_M = 2000;
const TIMEOUT_MS = 8000;
const RAW_LIMIT = 15;
const NAMED_LIMIT = 5;

/**
 * Geocode a free-text location string to coordinates via OSM Nominatim.
 * Returns the top result, or null on failure / no results.
 */
export async function geocodeLocation(query: string): Promise<GeocodedLocation | null> {
  if (!query.trim()) return null;

  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    limit: "1",
  });
  const url = `${NOMINATIM_ENDPOINT}?${params}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "FORESIGHT-demo/1.0" },
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const top = data[0] as { lat?: string; lon?: string; display_name?: string };
    const lat = Number(top.lat);
    const lng = Number(top.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      lat,
      lng,
      displayName: typeof top.display_name === "string" ? top.display_name : query.trim(),
    };
  } catch {
    return null;
  }
}

export async function fetchNearbyCompetitors(
  businessType: string,
  lat: number,
  lng: number,
  radiusM: number = DEFAULT_RADIUS_M,
): Promise<NearbyBusiness[]> {
  const filters = BUSINESS_TYPE_FILTERS[businessType] ?? BUSINESS_TYPE_FILTERS.other;
  const around = `(around:${radiusM},${lat},${lng})`;
  const union = filters.map((tag) => `nwr${tag}${around};`).join("");
  const query = `[out:json];(${union});out center ${RAW_LIMIT};`;

  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data: unknown = await res.json();
    return parseOverpassResponse(data);
  } catch {
    return [];
  }
}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: { name?: string };
}

function parseOverpassResponse(data: unknown): NearbyBusiness[] {
  if (typeof data !== "object" || data === null) return [];
  const obj = data as { elements?: unknown[] };
  if (!Array.isArray(obj.elements)) return [];

  const results: NearbyBusiness[] = [];
  for (const el of obj.elements as OverpassElement[]) {
    const name = el.tags?.name;
    if (typeof name !== "string") continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") continue;

    results.push({ name, lat, lng: lon });
    if (results.length >= NAMED_LIMIT) break;
  }
  return results;
}
