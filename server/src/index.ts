// ============================================================================
// TECH HUNT Server — Entry Point
// Creates the Express app, attaches Socket.io, registers routes, and starts
// listening. This file wires everything together.
// ============================================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { config, validateConfig } from "./config/index.js";
import { testConnection } from "./db/pool.js";
import { initSocketHandlers } from "./socket/index.js";
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
  app.use(helmet({ contentSecurityPolicy: false })); // CSP handled by client meta tag
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Rate limiting — 100 requests per 15 min per IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "RATE_LIMIT",
      message: "Too many requests — slow down",
    },
  });
  app.use("/api/", apiLimiter);

  // Stricter limiter for auth endpoints — 20 per 15 min
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "RATE_LIMIT",
      message: "Too many auth attempts",
    },
  });
  app.use("/api/auth", authLimiter);

  // ── REST routes ──
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/sessions", sessionsRouter);

  // ── Global error handler ──
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: config.isProduction ? "Internal server error" : err.message,
      });
    },
  );

  // 4. Create HTTP server (shared between Express and Socket.io)
  const httpServer = createServer(app);

  // 5. Create Socket.io instance and attach event handlers
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
    },
  });
  initSocketHandlers(io);
  console.log("🔌 Socket.io attached");

  // 6. Start listening
  httpServer.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║           🏗️  TECH HUNT Server               ║
║──────────────────────────────────────────────║
║  HTTP   → https://techhunt-server.onrender.com       ║
║  Socket → wss://techhunt-server.onrender.com         ║
║  CORS   → ${config.corsOrigin}                       ║
╚══════════════════════════════════════════════╝
    `);
  });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("💥 Server failed to start:", err);
  process.exit(1);
});
