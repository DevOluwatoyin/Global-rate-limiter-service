import { Router } from "express";
import { checkRateLimit } from "../services/rateLimiter";
import { logRequest } from "../config/postgres";

const router = Router();

router.post("/check", async (req, res) => {
  const { clientId, limit, windowSeconds } = req.body;

  if (!clientId || !limit || !windowSeconds) {
    return res.status(400).json({
      error: "clientId, limit, and windowSeconds are required",
    });
  }

  const start = Date.now();
  const result = await checkRateLimit(clientId, limit, windowSeconds);
  const responseTimeMs = Date.now() - start;

  res.json(result);

  // Fire-and-forget — doesn't block or delay the response above.
  logRequest(clientId, result.allowed, responseTimeMs);
});

export default router;