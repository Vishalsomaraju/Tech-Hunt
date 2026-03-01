// ============================================================================
// TECH HUNT Server — Database Initialization Script
// Runs the schema.sql file against the database.
// Usage: tsx src/db/init.ts
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, testConnection } from "./pool.js";
import { validateConfig } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log("🔄 Starting database initialization...");

  try {
    // Ensure config is valid before attempting connection
    validateConfig();
    await testConnection();

    const schemaPath = path.join(__dirname, "schema.sql");
    console.log(`📄 Reading schema from ${schemaPath}`);

    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("⚡ Executing schema SQL...");
    await pool.query(schemaSql);

    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize database schema:");
    console.error(error);
    process.exit(1);
  } finally {
    // End the pool so the script can exit
    await pool.end();
  }
}

initializeDatabase();
