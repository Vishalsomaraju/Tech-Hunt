// ============================================================================
// TECH HUNT Client — Protected Route Component
// Wraps routes that require authentication.
// Redirects unauthenticated users to /login.
// ============================================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="neon-text" style={{ fontSize: "1.2rem" }}>
          Loading...
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
