/**
 * Simple in-memory rate limiter.
 * Per IP: max `maxReqs` requests per `windowMs` milliseconds.
 * Uses Vercel's x-forwarded-for / x-real-ip headers.
 */

interface Record { count: number; resetAt: number; }
const store = new Map<string, Record>();

// Cleanup old entries every 10 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (rec.resetAt < now) store.delete(key);
  }
}, 10 * 60 * 1000);

export function getIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export function rateLimit(
  ip: string,
  key: string,           // namespace, e.g. "search" | "payment"
  maxReqs: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const storeKey = `${key}:${ip}`;
  const rec = store.get(storeKey);

  if (!rec || rec.resetAt < now) {
    // New window
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxReqs - 1, resetInMs: windowMs };
  }

  rec.count += 1;
  store.set(storeKey, rec);

  const remaining = Math.max(0, maxReqs - rec.count);
  const resetInMs = rec.resetAt - now;

  return {
    allowed: rec.count <= maxReqs,
    remaining,
    resetInMs,
  };
}
