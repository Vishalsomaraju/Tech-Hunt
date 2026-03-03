// ============================================================================
// TECH HUNT Client — Auth Page
// Three-tab interface: Login | Register | Play as Guest
// ============================================================================

import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

type Tab = "login" | "register" | "guest";

export function AuthPage() {
  const { login, register, loginAsGuest, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle("Login");
  const from = (location.state as { from?: string })?.from || "/";

  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Guest field
  const [guestName, setGuestName] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (regUsername.length < 3 || regUsername.length > 32) {
      setError("Username must be 3–32 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) {
      setError("Username: letters, numbers, and underscores only");
      return;
    }
    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(regUsername, regEmail, regPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = guestName.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Callsign must be 2–20 characters");
      return;
    }
    loginAsGuest(trimmed);
    navigate(from, { replace: true });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "login", label: "Login" },
    { key: "register", label: "Register" },
    { key: "guest", label: "Play as Guest" },
  ];

  return (
    <div className="bg-grid flex items-center justify-center min-h-screen p-4">
      <div className="w-full" style={{ maxWidth: "440px" }}>
        {/* Card */}
        <div className="panel border-glow" style={{ padding: "40px" }}>
          {/* Logo */}
          <div className="text-center" style={{ marginBottom: "6px" }}>
            <h1
              className="font-mono glow-text"
              style={{
                fontSize: "36px",
                letterSpacing: "0.2em",
                color: "var(--accent)",
              }}
            >
              TECH HUNT
            </h1>
          </div>
          <p
            className="text-center"
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "32px",
            }}
          >
            The building is waiting.
          </p>

          {/* Tabs */}
          <div
            className="flex"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
              marginBottom: "24px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setError("");
                }}
                className="flex-1 transition-colors"
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.05em",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  color:
                    activeTab === tab.key
                      ? "var(--text-primary)"
                      : "var(--text-dim)",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--danger)",
                marginBottom: "16px",
                padding: "10px 14px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid var(--danger-dim)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {error}
            </div>
          )}

          {/* Login Tab */}
          {activeTab === "login" && (
            <form
              onSubmit={handleLogin}
              className="flex flex-col"
              style={{ gap: "20px" }}
            >
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-base"
                  placeholder="agent@techhunt.io"
                />
              </div>
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: "14px", fontSize: "13px", marginTop: "8px" }}
              >
                {isSubmitting ? "Authenticating..." : "Access System"}
              </button>
            </form>
          )}

          {/* Register Tab */}
          {activeTab === "register" && (
            <form
              onSubmit={handleRegister}
              className="flex flex-col"
              style={{ gap: "20px" }}
            >
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="input-base"
                  placeholder="agent_smith"
                  minLength={3}
                  maxLength={32}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "4px",
                  }}
                >
                  3–32 chars, alphanumeric + underscore
                </p>
              </div>
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="input-base"
                  placeholder="agent@techhunt.io"
                />
              </div>
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: "14px", fontSize: "13px", marginTop: "8px" }}
              >
                {isSubmitting ? "Creating Profile..." : "Create Agent Profile"}
              </button>
            </form>
          )}

          {/* Guest Tab */}
          {activeTab === "guest" && (
            <form
              onSubmit={handleGuest}
              className="flex flex-col"
              style={{ gap: "20px" }}
            >
              <div>
                <label
                  className="block font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Enter callsign
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-base"
                  placeholder="GHOST_42"
                  minLength={2}
                  maxLength={20}
                />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Guests cannot appear on the leaderboard or resume sessions.
              </p>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "14px", fontSize: "13px", marginTop: "8px" }}
              >
                Enter as Guest
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
