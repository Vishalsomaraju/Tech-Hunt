// ============================================================================
// TECH HUNT Client — Auth Context
// Manages JWT token, guest identity, and socket connect/disconnect lifecycle.
// ============================================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { auth as authApi, type AuthUser } from "../api/index";
import { socket } from "../socket";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  guestName: string | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  isGuest: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  loginAsGuest: (name: string) => void;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "techhunt_token";
const USER_KEY = "techhunt_user";
const GUEST_KEY = "techhunt_guest";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    guestName: null,
    token: null,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedGuest = localStorage.getItem(GUEST_KEY);

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as AuthUser;
        setState({
          user,
          guestName: null,
          token: savedToken,
          isLoading: false,
        });

        // Verify token is still valid
        authApi.me().catch(() => {
          // Token expired — clear
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({
            user: null,
            guestName: null,
            token: null,
            isLoading: false,
          });
        });

        // Connect socket
        if (!socket.connected) socket.connect();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (savedGuest) {
      setState({
        user: null,
        guestName: savedGuest,
        token: null,
        isLoading: false,
      });
      if (!socket.connected) socket.connect();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const saveAuth = useCallback((data: { token: string; user: AuthUser }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem(GUEST_KEY);
    setState({
      user: data.user,
      guestName: null,
      token: data.token,
      isLoading: false,
    });
    if (!socket.connected) socket.connect();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      saveAuth(data);
    },
    [saveAuth],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await authApi.register(username, email, password);
      saveAuth(data);
    },
    [saveAuth],
  );

  const loginAsGuest = useCallback((name: string) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(GUEST_KEY, name);
    setState({ user: null, guestName: name, token: null, isLoading: false });
    if (!socket.connected) socket.connect();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GUEST_KEY);
    setState({ user: null, guestName: null, token: null, isLoading: false });
    if (socket.connected) socket.disconnect();
  }, []);

  const isGuest = !state.user && !!state.guestName;
  const isAuthenticated = !!state.user || !!state.guestName;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isGuest,
        isAuthenticated,
        login,
        register,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
