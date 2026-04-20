// In-memory sliding-window rate limiter. Single-instance safe (EC2 t3.micro).
const buckets = new Map<string, number[]>();

// Returns true = allowed, false = rate-limited.
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= maxRequests) return false;
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

// Prune stale entries every 5 min to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < 15 * 60 * 1000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 5 * 60 * 1000);
