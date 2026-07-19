import express from "express";
import redis from "./config/redis";
import { initDb } from "./config/postgres";
import rateLimitRoutes from "./routes/rateLimit";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/", rateLimitRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Rate limiter service is alive" });
});

app.get("/redis-check", async (req, res) => {
  await redis.set("test-key", "hello from redis");
  const value = await redis.get("test-key");
  res.json({ value });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });