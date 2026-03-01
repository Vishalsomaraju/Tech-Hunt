// ============================================================================
// TECH HUNT Server — Configuration
// Reads and validates all environment variables in one place.
// ============================================================================

import dotenv from "dotenv";

dotenv.config();

/** Validated server configuration */
export const config = {
  /** Port the HTTP server listens on */
  port: parseInt(process.env.PORT || "3001", 10),

  /** PostgreSQL connection string */
  databaseUrl: process.env.DATABASE_URL || "",

  /** Secret key used to sign JWTs */
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",

  /** Allowed CORS origin (client URL) */
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  /** Whether we're running in production */
  isProduction: process.env.NODE_ENV === "production",
};

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validates that all required environment variables are set.
 * Call this at startup before any other initialization.
 */
export function validateConfig(): void {
  const missing: string[] = [];

  if (!config.databaseUrl) missing.push("DATABASE_URL");
  if (config.jwtSecret === "dev-secret-change-me" && config.isProduction) {
    missing.push("JWT_SECRET (must be set in production)");
  }

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
    console.error(`\nCopy .env.example to .env and fill in your values.`);
    process.exit(1);
  }
}
