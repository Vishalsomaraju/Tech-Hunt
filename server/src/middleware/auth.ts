// ============================================================================
// TECH HUNT Server — JWT Authentication Middleware
// Extracts and verifies the JWT from the Authorization header.
// Attaches the decoded user payload to req.user for downstream handlers.
// ============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { JwtPayload } from "@techhunt/shared";

/**
 * Extend Express Request to include our JWT payload.
 * This lets downstream route handlers access req.user safely.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: Verifies the JWT in the Authorization header.
 * Responds with 401 if token is missing or invalid.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Missing or malformed authorization header",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}
