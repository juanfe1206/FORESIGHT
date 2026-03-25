import type { SimulationResponse } from "@/lib/types";
import { validateSimulationResponse } from "@/lib/validate-simulation-response";

/** Namespace prefix for all FORESIGHT client storage keys. */
export const FORESIGHT_STORAGE_PREFIX = "foresight:" as const;

const STORAGE_KEY = `${FORESIGHT_STORAGE_PREFIX}sim-response-cache:v1`;

const MAX_ENTRIES = 3;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BUCKET_BYTES = 512_000;

/** Must match `MOCK_SIMULATION_RESPONSE.meta.schemaVersion` when `schemaVersion` is present on payloads. */
const TRUSTED_SCHEMA_VERSION = "1.0.0";

type CacheEntry = {
  storedAt: number;
  source: "live";
  payload: SimulationResponse;
};

type CacheFile = {
  v: 1;
  entries: CacheEntry[];
};

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage;
    if (
      !s ||
      typeof s.getItem !== "function" ||
      typeof s.setItem !== "function" ||
      typeof s.removeItem !== "function"
    ) {
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function isTrustedSchemaVersion(res: SimulationResponse): boolean {
  if (res.meta.schemaVersion === undefined) return true;
  return res.meta.schemaVersion === TRUSTED_SCHEMA_VERSION;
}

function parseCacheFile(raw: string | null): CacheFile | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const file = parsed as Partial<CacheFile>;
    if (file.v !== 1 || !Array.isArray(file.entries)) return null;
    const safeEntries = file.entries.filter(
      (e): e is CacheEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Partial<CacheEntry>).storedAt === "number" &&
        (e as Partial<CacheEntry>).source === "live" &&
        typeof (e as Partial<CacheEntry>).payload === "object" &&
        (e as Partial<CacheEntry>).payload !== null,
    );
    return { v: 1, entries: safeEntries };
  } catch {
    return null;
  }
}

function freshEntries(entries: CacheEntry[]): CacheEntry[] {
  const now = Date.now();
  return entries.filter((e) => now - e.storedAt <= TTL_MS);
}

function bucketByteLength(file: CacheFile): number {
  return new TextEncoder().encode(JSON.stringify(file)).length;
}

function trimForSize(file: CacheFile): CacheFile {
  let next = file;
  while (bucketByteLength(next) > MAX_BUCKET_BYTES && next.entries.length > 1) {
    next = { v: 1, entries: next.entries.slice(0, -1) };
  }
  return next;
}

export function readLatestValid(): SimulationResponse | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  const file = parseCacheFile(storage.getItem(STORAGE_KEY));
  if (!file) return null;

  const entries = freshEntries(file.entries);
  for (const entry of entries) {
    if (!validateSimulationResponse(entry.payload)) continue;
    if (!isTrustedSchemaVersion(entry.payload)) continue;
    return entry.payload;
  }
  return null;
}

export function writeSuccess(response: SimulationResponse): void {
  if (!validateSimulationResponse(response)) return;
  if (!isTrustedSchemaVersion(response)) return;

  const persist = (): void => {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      const prev = parseCacheFile(storage.getItem(STORAGE_KEY));
      const priorEntries = freshEntries(prev?.entries ?? []);
      const nextEntry: CacheEntry = {
        storedAt: Date.now(),
        source: "live",
        payload: response,
      };
      let file: CacheFile = {
        v: 1,
        entries: [nextEntry, ...priorEntries].slice(0, MAX_ENTRIES),
      };
      file = trimForSize(file);
      storage.setItem(STORAGE_KEY, JSON.stringify(file));
    } catch {
      /* quota / private mode */
    }
  };

  queueMicrotask(persist);
}

/** @internal exposed for tests */
export const __simulationCacheTestUtils = {
  STORAGE_KEY,
  TRUSTED_SCHEMA_VERSION,
};
