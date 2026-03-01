// ============================================================================
// TECH HUNT Server — Entry Point
// Creates the Express app, attaches Socket.io, registers routes, and starts
// listening. This file wires everything together.
// ============================================================================

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { config, validateConfig } from "./config/index.js";
import { testConnection } from "./db/pool.js";
import { initializeSocket } from "./socket/index.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import teamsRouter from "./routes/teams.js";
import sessionsRouter from "./routes/sessions.js";

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Validate environment
  validateConfig();

  // 2. Test database connection
  await testConnection();

  // 3. Create Express app
  const app = express();

  // ── Global middleware ──
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());

  // ── REST routes ──
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/sessions", sessionsRouter);

  // 4. Create HTTP server (shared between Express and Socket.io)
  const httpServer = createServer(app);

  // 5. Attach Socket.io
  const io = initializeSocket(httpServer);
  console.log("🔌 Socket.io attached");

  // 6. Start listening
  httpServer.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║           🏗️  TECH HUNT Server               ║
║──────────────────────────────────────────────║
║  HTTP   → http://localhost:${config.port}             ║
║  Socket → ws://localhost:${config.port}               ║
║  CORS   → ${config.corsOrigin}        ║
╚══════════════════════════════════════════════╝
    `);
  });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("💥 Server failed to start:", err);
  process.exit(1);
});
