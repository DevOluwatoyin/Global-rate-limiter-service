import { Pool } from "pg";

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || "rluser",
  password: process.env.POSTGRES_PASSWORD || "rlpassword",
  database: process.env.POSTGRES_DB || "ratelimiter",
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres error:", err);
});

export async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL,
        allowed BOOLEAN NOT NULL,
        response_time_ms INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Postgres table ready");
  } catch (err: any) {
    if (err.code === "23505") {
      // Harmless race: another instance created the table at the same time.
      console.log("Postgres table already being created by another instance — continuing");
    } else {
      throw err;
    }
  }
}

export async function logRequest(
  clientId: string,
  allowed: boolean,
  responseTimeMs: number
) {
  try {
    await pool.query(
      `INSERT INTO request_logs (client_id, allowed, response_time_ms) VALUES ($1, $2, $3)`,
      [clientId, allowed, responseTimeMs]
    );
  } catch (err) {
    // Logging must never break the actual rate-limit response.
    console.error("Failed to log request:", err);
  }
}

export default pool;