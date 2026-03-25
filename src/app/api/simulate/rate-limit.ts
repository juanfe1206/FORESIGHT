const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const store = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const recentTimestamps = (store.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentTimestamps.length >= MAX_REQUESTS) {
    store.set(ip, recentTimestamps);
    return { allowed: false };
  }

  recentTimestamps.push(now);
  store.set(ip, recentTimestamps);
  return { allowed: true };
}
