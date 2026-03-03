// ============================================================================
// TECH HUNT Server — Socket.io Setup
// Handles real-time connection management and event routing.
// JWT is parsed on connection (optional — guests are allowed with user=null).
// ============================================================================

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { CONNECTED } from "@techhunt/shared";
import type { JwtPayload } from "@techhunt/shared";
import { registerGameEvents, handleDisconnect } from "./gameSocket.js";

/**
 * Attaches connection handling and game-event registration to the given
 * Socket.io server instance.
 *
 * Authentication is **optional** — if a valid JWT is provided via
 * `socket.handshake.auth.token`, the decoded payload is stored on
 * `socket.data.user`. Otherwise `socket.data.user` is set to `null`
 * (guest mode).
 */
export function initSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    // ── Optional JWT Authentication ───────────────────────────────────────

    const token = socket.handshake.auth?.token as string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        socket.data.user = decoded;
      } catch {
        // Token present but invalid — treat as guest
        socket.data.user = null;
        console.warn(
          `[socket] Invalid JWT on connect (${socket.id}) — treating as guest`,
        );
      }
    } else {
      socket.data.user = null;
    }

    const username = socket.data.user?.username ?? "guest";
    console.log(`🔌 Socket connected: ${username} (${socket.id})`);

    // Confirm connection to the client
    socket.emit(CONNECTED, {
      message: `Welcome, ${username}!`,
      socketId: socket.id,
    });

    // ── Register game event handlers ──────────────────────────────────────

    registerGameEvents(io, socket);

    // ── Disconnect ────────────────────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${username} (${reason})`);
      handleDisconnect(io, socket).catch((err) =>
        console.error("[socket] handleDisconnect error:", err),
      );
    });
  });
}
