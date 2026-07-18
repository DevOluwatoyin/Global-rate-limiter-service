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

  const result = await checkRateLimit(clientId, limit, windowSeconds);
  res.json(result);
});

export default router;