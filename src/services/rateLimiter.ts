import redis from "../config/redis";

// Lua script: atomically increment a counter and set expiry only on first request.
// This runs as ONE atomic operation inside Redis — no race conditions between instances.
const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current
`;

let redisDownSince: number | null = null;
const FAIL_OPEN_GRACE_MS = 5000; // allow traffic for 5s after Redis starts failing

export async function checkRateLimit(
  clientId: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; note?: string }> {
  const key = `ratelimit:${clientId}`;

  try {
    const current = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      windowSeconds
    )) as number;

    redisDownSince = null; // Redis is healthy again
    const allowed = current <= limit;
    const remaining = Math.max(limit - current, 0);
    return { allowed, remaining };

  } catch (err) {
    const now = Date.now();
    if (redisDownSince === null) redisDownSince = now;

    const withinGrace = now - redisDownSince < FAIL_OPEN_GRACE_MS;

    return {
      allowed: withinGrace,
      remaining: -1,
      note: withinGrace ? "fail-open (grace period)" : "fail-closed (redis down too long)",
    };
  }
}