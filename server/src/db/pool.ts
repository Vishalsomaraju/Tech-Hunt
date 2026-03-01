// ============================================================================
// TECH HUNT Server — Database Pool
// Creates and exports a PostgreSQL connection pool.
// ============================================================================

import pg from "pg";
import { config } from "../config/index.js";

const { Pool } = pg;

/**
 * Shared PostgreSQL connection pool.
 * Uses the DATABASE_URL from environment configuration.
 * All database queries in the app should use this pool.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Use SSL in production (required by Neon)
  ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
  // Pool configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors so they don't crash the process silently
pool.on("error", (err) => {
  console.error("💥 Unexpected database pool error:", err);
});

/**
 * Tests the database connection at startup.
 * Throws if the connection fails.
 */
export async function testConnection(): Promise<void> {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log(`✅ Database connected at ${result.rows[0].now}`);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
}
