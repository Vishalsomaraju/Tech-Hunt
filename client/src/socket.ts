// ============================================================================
// TECH HUNT — Singleton Socket.io Client
// Connects manually after auth. Disconnects on logout.
// ============================================================================

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  auth: (cb) => {
    const token = localStorage.getItem("techhunt_token");
    cb({ token: token ?? null });
  },
});
