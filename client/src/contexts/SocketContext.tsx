// ============================================================================
// TECH HUNT Client — Socket Context
// Manages the Socket.io connection lifecycle.
// Auto-connects when authenticated, disconnects on logout.
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocketContextType {
  /** The active Socket.io client instance (null if not connected) */
  socket: Socket | null;
  /** Whether the socket is currently connected to the server */
  isConnected: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// The server URL — in dev, Vite proxy handles this; in prod, use env var
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// ─── Provider ────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Don't connect unless we have a valid auth token
    if (!token) {
      // If we had a socket, disconnect it
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create a new socket connection with JWT auth
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // ── Connection lifecycle handlers ──

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("🔌 Socket connection error:", err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount or token change
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Access the Socket.io client and connection status from any component.
 * Must be used within <SocketProvider>.
 */
export function useSocket(): SocketContextType {
  return useContext(SocketContext);
}
