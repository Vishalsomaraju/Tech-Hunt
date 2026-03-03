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
      <div className="flex items-center justify-center min-h-screen">
        <div className="neon-text text-lg font-mono">AUTHENTICATING...</div>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-mono neon-text">
            REGISTERED AGENTS ONLY
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            The leaderboard is available to registered users. Create an account
            to track your scores and compete with other teams.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/auth"
              state={{ from: location.pathname }}
              className="btn-primary font-mono text-sm"
            >
              LOGIN / REGISTER
            </Link>
            <Link to="/" className="btn-secondary font-mono text-sm">
              BACK TO HQ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
