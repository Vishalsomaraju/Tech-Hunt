// ============================================================================
// TECH HUNT Server — Auth Routes
// Handles user registration, login, and current-user retrieval.
// REST only — no Socket.io here.
// ============================================================================

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../config/index.js";
import { authenticate } from "../middleware/auth.js";
import {
  JWT_EXPIRY,
  MIN_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
} from "@techhunt/shared";

const router = Router();

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // --- Validation ---
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "Username, email, and password are required",
      });
      return;
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`,
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }

    // --- Check for existing user ---
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "A user with that email or username already exists",
      });
      return;
    }

    // --- Create user ---
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword],
    );

    const user = result.rows[0];

    // --- Generate JWT ---
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: JWT_EXPIRY },
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        },
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to register user",
    });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "Email and password are required",
      });
      return;
    }

    // --- Find user ---
    const result = await pool.query(
      "SELECT id, username, email, password, created_at FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
      return;
    }

    const user = result.rows[0];

    // --- Verify password ---
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
      return;
    }

    // --- Generate JWT ---
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: JWT_EXPIRY },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to log in",
    });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [req.user!.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User not found",
      });
      return;
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to fetch user",
    });
  }
});

export default router;
