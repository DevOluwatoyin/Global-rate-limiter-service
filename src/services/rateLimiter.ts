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

export async function checkRateLimit(
  clientId: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${clientId}`;

  const current = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    key,
    windowSeconds
  )) as number;

  const allowed = current <= limit;
  const remaining = Math.max(limit - current, 0);

  return { allowed, remaining };
}