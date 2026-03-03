// ============================================================================
// TECH HUNT Client — Auth Page
// Three-tab interface: Login | Register | Play as Guest
// ============================================================================

import { useState, type FormEvent } from "react";
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
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

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
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-text font-mono tracking-widest">
            TECH HUNT
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-sm">
            The building is waiting.
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6">
          {/* Tabs */}
          <div className="flex border-b border-[var(--color-border-default)] mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setError("");
                }}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-[var(--color-neon-cyan)] border-b-2 border-[var(--color-neon-cyan)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)] text-sm">
              {error}
            </div>
          )}

          {/* Login Tab */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field font-mono"
                  placeholder="agent@techhunt.io"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field font-mono"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Authenticating..." : "Access System"}
              </button>
            </form>
          )}

          {/* Register Tab */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="input-field font-mono"
                  placeholder="agent_smith"
                  minLength={3}
                  maxLength={32}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  3–32 chars, alphanumeric + underscore
                </p>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="input-field font-mono"
                  placeholder="agent@techhunt.io"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-field font-mono"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="input-field font-mono"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Creating Profile..." : "Create Agent Profile"}
              </button>
            </form>
          )}

          {/* Guest Tab */}
          {activeTab === "guest" && (
            <form onSubmit={handleGuest} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Enter callsign
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-field font-mono"
                  placeholder="GHOST_42"
                  minLength={2}
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Guests cannot appear on the leaderboard or resume sessions.
              </p>
              <button type="submit" className="btn-primary">
                Enter as Guest
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
