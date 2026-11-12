/**
 * Minimal in-memory rate limiter for abuse-prone actions (login attempts,
 * sign-ups, reports). Suitable for a single Node process; swap for a shared
 * store (e.g. Upstash Redis) when running multiple instances.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterMs: bucket.resetAt - now,
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Best-effort client IP from proxy headers. */
export function clientKey(prefix: string, headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "local";
  return `${prefix}:${ip}`;
}
