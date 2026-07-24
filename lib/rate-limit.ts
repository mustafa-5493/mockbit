/**
 * Rate Limiting Module for Mockbit
 * Uses Upstash Redis REST API if credentials are set,
 * with an in-memory fallback for local dev / unconfigured environments.
 */

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkDailyRateLimit(
  identifier: string,
  prefix: string = "ratelimit:ai",
  limit: number = 5,
  windowSeconds: number = 86400
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `${prefix}:${identifier}:${today}`;

  // 1. Upstash Redis REST Mode (Production-grade persistent rate limiting across serverless cold starts)
  if (redisUrl && redisToken) {
    try {
      // Execute pipeline INCR and EXPIRE
      const incrRes = await fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const incrData = await incrRes.json();
      const current = typeof incrData.result === "number" ? incrData.result : 1;

      if (current === 1) {
        // Set key expiration for 24 hours
        await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        });
      }

      const allowed = current <= limit;
      return {
        allowed,
        current,
        limit,
        remaining: Math.max(0, limit - current),
      };
    } catch (err) {
      console.warn("[mockbit/ratelimit] Upstash Redis request failed, using fallback:", err);
    }
  }

  // 2. Fallback In-Memory Rate Limiting
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, current: 1, limit, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, current: entry.count, limit, remaining: 0 };
  }

  entry.count += 1;
  return {
    allowed: true,
    current: entry.count,
    limit,
    remaining: limit - entry.count,
  };
}
