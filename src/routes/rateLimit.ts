import { Router } from "express";
import { checkRateLimit } from "../services/rateLimiter";

const router = Router();

router.post("/check", async (req, res) => {
  const { clientId, limit, windowSeconds } = req.body;

  if (!clientId || !limit || !windowSeconds) {
    return res.status(400).json({
      error: "clientId, limit, and windowSeconds are required",
    });
  }

  try {
    const result = await checkRateLimit(clientId, limit, windowSeconds);
    res.json(result);
  } catch (err) {
    // Fail-safe placeholder — we'll improve this in a later step
    res.json({ allowed: true, remaining: -1, note: "fail-open (redis error)" });
  }
});

export default router;