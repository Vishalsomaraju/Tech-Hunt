// ============================================================================
// TECH HUNT Server — Database Migration Script
// Runs additive, idempotent migrations against the database.
// Usage: tsx src/db/migrate.ts
// ============================================================================

import { pool, testConnection } from "./pool.js";
import { validateConfig } from "../config/index.js";

interface Migration {
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    name: "add_completion_time_to_teams",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'teams' AND column_name = 'completion_time'
        ) THEN
          ALTER TABLE teams ADD COLUMN completion_time INTEGER DEFAULT NULL;
        END IF;
      END $$;
    `,
  },
];

async function runMigrations() {
  console.log("🔄 Starting database migrations...");

  try {
    validateConfig();
    await testConnection();

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    for (const migration of migrations) {
      const { rows } = await pool.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [migration.name],
      );
      if (rows.length > 0) {
        console.log(`  ⏭  ${migration.name} (already applied)`);
        continue;
      }

      console.log(`  ▶  ${migration.name}`);
      await pool.query(migration.sql);
      await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [
        migration.name,
      ]);
    }

    console.log("✅ All migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
