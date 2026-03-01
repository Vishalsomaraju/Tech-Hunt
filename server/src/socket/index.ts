// ============================================================================
// TECH HUNT Server — Socket.io Setup
// Handles real-time connection management and event routing.
// Auth is verified on handshake via JWT.
// ============================================================================

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { JwtPayload, SocketEvents } from "@techhunt/shared";

/** Extended socket with authenticated user data */
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

/**
 * Initializes Socket.io on the given HTTP server.
 * - Authenticates clients via JWT on handshake
 * - Registers core event handlers
 * - Returns the io instance for use elsewhere
 */
export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  // ─── JWT Authentication Middleware ───────────────────────────────────────

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ─── Connection Handler ─────────────────────────────────────────────────

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`🔌 Socket connected: ${user.username} (${socket.id})`);

    // Confirm connection to the client
    socket.emit(SocketEvents.CONNECTED, {
      message: `Welcome, ${user.username}!`,
      socketId: socket.id,
    });

    // ── Player Join ─────────────────────────────────────────────────────

    socket.on(SocketEvents.PLAYER_JOIN, (data: { teamId: string }) => {
      const { teamId } = data;

      // Join the Socket.io room for this team
      socket.join(`team:${teamId}`);
      console.log(`👥 ${user.username} joined team room: ${teamId}`);

      // Notify other team members
      socket.to(`team:${teamId}`).emit(SocketEvents.TEAM_UPDATE, {
        type: "PLAYER_JOINED",
        player: { userId: user.userId, username: user.username },
      });
    });

    // ── Player Leave ────────────────────────────────────────────────────

    socket.on(SocketEvents.PLAYER_LEAVE, (data: { teamId: string }) => {
      const { teamId } = data;

      socket.leave(`team:${teamId}`);
      console.log(`👋 ${user.username} left team room: ${teamId}`);

      socket.to(`team:${teamId}`).emit(SocketEvents.TEAM_UPDATE, {
        type: "PLAYER_LEFT",
        player: { userId: user.userId, username: user.username },
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${user.username} (${reason})`);
    });
  });

  return io;
}
