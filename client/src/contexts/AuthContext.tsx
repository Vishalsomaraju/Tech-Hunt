// ============================================================================
// TECH HUNT Client — Auth Context
// Manages JWT token storage, user state, and auth API calls.
// Provides login/register/logout to the entire component tree.
// ============================================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, AuthResponse } from "@techhunt/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "techhunt_token";
const USER_KEY = "techhunt_user";
const API_BASE = "/api/auth";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setState({ user, token: savedToken, isLoading: false });
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Saves auth data to state and localStorage.
   */
  const saveAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isLoading: false });
  }, []);

  /**
   * Registers a new user account and logs them in.
   */
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || "Registration failed");
      }

      saveAuth(body.data);
    },
    [saveAuth],
  );

  /**
   * Logs in with email and password.
   */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || "Login failed");
      }

      saveAuth(body.data);
    },
    [saveAuth],
  );

  /**
   * Logs out: clears token and user data.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Access auth state and actions from any component.
 * Must be used within <AuthProvider>.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
