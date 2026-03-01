// ============================================================================
// TECH HUNT Client — Login Page
// Dark-themed login form with neon accents and smooth animations.
// ============================================================================

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-grid" style={styles.container}>
      {/* Floating ambient light effects */}
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />

      <div className="animate-fade-in" style={styles.formWrapper}>
        {/* Logo / Title */}
        <div style={styles.header}>
          <h1 className="gradient-text" style={styles.title}>
            TECH HUNT
          </h1>
          <p style={styles.subtitle}>Enter the digital labyrinth</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBanner}>{error}</div>}

          <div style={styles.fieldGroup}>
            <label htmlFor="login-email" style={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="agent@techhunt.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="login-password" style={styles.label}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating..." : "Access Terminal"}
          </button>
        </form>

        {/* Register link */}
        <p style={styles.footerText}>
          New agent?{" "}
          <Link to="/register" style={styles.link}>
            Create Access Credentials
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Inline Styles (for non-Tailwind layout) ────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  ambientOrb1: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ambientOrb2: {
    position: "absolute",
    bottom: "-15%",
    left: "-10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(17, 24, 39, 0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(30, 41, 59, 0.8)",
    borderRadius: "20px",
    padding: "2.5rem",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 900,
    letterSpacing: "0.15em",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "var(--color-text-secondary)",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#f87171",
    fontSize: "0.9rem",
    textAlign: "center" as const,
  },
  footerText: {
    textAlign: "center" as const,
    marginTop: "1.5rem",
    fontSize: "0.9rem",
    color: "var(--color-text-secondary)",
  },
  link: {
    color: "var(--color-neon-cyan)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
