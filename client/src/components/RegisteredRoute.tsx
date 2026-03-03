// ============================================================================
// TECH HUNT — Registered Route Component
// Like ProtectedRoute, but requires a *registered* user (not a guest).
// Guests see a soft gate panel with Login / Register buttons.
// ============================================================================

import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RegisteredRouteProps {
  children: React.ReactNode;
}

export function RegisteredRoute({ children }: RegisteredRouteProps) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="glow-text font-mono animate-pulse-glow"
          style={{ fontSize: "16px" }}
        >
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  // Not logged in at all → redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Logged in as guest → show soft gate
  if (isGuest) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)", padding: "var(--space-md)" }}
      >
        <div
          className="panel border-glow text-center"
          style={{ maxWidth: "440px", width: "100%", padding: "32px" }}
        >
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
          <h2
            className="font-mono glow-text"
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              marginBottom: "12px",
            }}
          >
            REGISTERED AGENTS ONLY
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "24px",
              lineHeight: 1.6,
              fontFamily: "var(--font-sans)",
            }}
          >
            The leaderboard is available to registered users. Create an account
            to track your scores and compete with other teams.
          </p>
          <div className="flex justify-center" style={{ gap: "12px" }}>
            <Link
              to="/auth"
              state={{ from: location.pathname }}
              className="btn-primary font-mono"
              style={{
                width: "auto",
                padding: "10px 20px",
                fontSize: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              LOGIN / REGISTER
            </Link>
            <Link
              to="/"
              className="btn-secondary font-mono"
              style={{
                width: "auto",
                padding: "10px 20px",
                fontSize: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              BACK TO HQ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
