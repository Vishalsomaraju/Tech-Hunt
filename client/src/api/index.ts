// ============================================================================
// TECH HUNT — API Client
// Typed wrappers for every REST endpoint. Uses fetch with JWT interceptor.
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "techhunt_token";

// ─── Fetch Wrapper ───────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json();

  if (!res.ok) {
    // On 401, clear stored auth and redirect to /auth
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("techhunt_user");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    throw new Error(
      body.message || body.error || `Request failed (${res.status})`,
    );
  }

  return body.data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthData {
  token: string;
  user: AuthUser;
}

export const auth = {
  register: (username: string, email: string, password: string) =>
    request<AuthData>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthData>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<AuthUser>("/auth/me"),
};

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamData {
  id: string;
  name: string;
  code: string;
  sessionType: string;
  teamScore: number;
  createdAt: string;
  players: {
    userId: string;
    username: string;
    role: string;
    individualScore: number;
    joinedAt: string;
  }[];
}

export const teams = {
  create: (name: string, sessionType?: string) =>
    request<TeamData>("/teams", {
      method: "POST",
      body: JSON.stringify({ name, sessionType }),
    }),

  join: (code: string) =>
    request<TeamData>("/teams/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  list: () => request<TeamData[]>("/teams"),

  get: (id: string) => request<TeamData>(`/teams/${id}`),

  leave: (id: string) =>
    request<{ message: string }>(`/teams/${id}/leave`, { method: "DELETE" }),
};

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface SessionData {
  id: string;
  teamId: string;
  buildingSeed: number;
  phase: string;
  startedAt: string;
  endedAt?: string;
  notes: string;
  isResumable: boolean;
  resumed?: boolean;
}

export interface SessionDetails extends SessionData {
  attempts: {
    id: string;
    playerId: string;
    username: string;
    roomIndex: number;
    puzzleSeed: number;
    answer: string;
    correct: boolean;
    attemptedAt: string;
  }[];
  hints: {
    id: string;
    roomIndex: number;
    hintLevel: string;
    penalty: number;
    usedAt: string;
  }[];
}

export const sessions = {
  create: (teamId: string) =>
    request<SessionData>("/sessions", {
      method: "POST",
      body: JSON.stringify({ teamId }),
    }),

  get: (id: string) => request<SessionDetails>(`/sessions/${id}`),

  updatePhase: (id: string, phase: string) =>
    request<{ id: string; phase: string; endedAt?: string }>(
      `/sessions/${id}/phase`,
      {
        method: "PATCH",
        body: JSON.stringify({ phase }),
      },
    ),

  updateNotes: (id: string, notes: string) =>
    request<{ id: string; notes: string }>(`/sessions/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),

  listByTeam: (teamId: string) =>
    request<SessionData[]>(`/sessions/team/${teamId}`),
};

// ─── Health ──────────────────────────────────────────────────────────────────

export const health = {
  check: () =>
    request<{ status: string; timestamp: string; uptime: number }>("/health"),
};
