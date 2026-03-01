// ============================================================================
// TECH HUNT Server — Health Check Route
// Simple endpoint for monitoring and deployment verification.
// ============================================================================

import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";

const router = Router();

/**
 * GET /api/health
 * Returns server status and checks database connectivity.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    // Quick DB ping
    await pool.query("SELECT 1");

    res.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: "SERVICE_UNAVAILABLE",
      message: "Database connection failed",
    });
  }
});

export default router;
