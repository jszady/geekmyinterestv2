"server only";

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_HITS = 5;
const MAX_STORE_SIZE = 10_000; // evict all when this is exceeded to prevent unbounded growth

// Module-level store: IP -> array of hit timestamps within the current window.
// On Vercel each serverless instance has its own in-memory state, so this acts
// as a per-instance limit (good enough to stop unsophisticated bots without
// external infrastructure).
const store = new Map<string, number[]>();

/**
 * Returns true if the IP is allowed to submit, false if rate-limited.
 * Always mutates the store on a passing call (records the hit).
 */
export function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();

  // Evict store if it grows too large (many unique IPs in one instance lifetime).
  if (store.size > MAX_STORE_SIZE) {
    store.clear();
  }

  const existing = store.get(ip) ?? [];
  const recent = existing.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_HITS) {
    store.set(ip, recent);
    return false;
  }

  recent.push(now);
  store.set(ip, recent);
  return true;
}
