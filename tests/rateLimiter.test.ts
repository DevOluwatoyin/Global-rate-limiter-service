import { checkRateLimit } from "../src/services/rateLimiter";
import redis from "../src/config/redis";

describe("checkRateLimit", () => {
  const testClientId = "test-client-unit";

  beforeEach(async () => {
    // Clean slate before each test
    await redis.del(`ratelimit:${testClientId}`);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("allows requests under the limit", async () => {
    const result = await checkRateLimit(testClientId, 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests once the limit is exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(testClientId, 5, 60);
    }
    const result = await checkRateLimit(testClientId, 5, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("does not allow more than the limit under concurrent requests", async () => {
    const limit = 10;
    const concurrentRequests = 30;

    const promises = Array.from({ length: concurrentRequests }, () =>
      checkRateLimit(testClientId, limit, 60)
    );

    const results = await Promise.all(promises);
    const allowedCount = results.filter((r) => r.allowed).length;

    expect(allowedCount).toBe(limit);
  });
});