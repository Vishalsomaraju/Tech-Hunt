// ============================================================================
// TECH HUNT Client — Home Page
// Protected landing page showing user info, socket status, and game entry.
// ============================================================================

import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

export function HomePage() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <div style={styles.container}>
      <div className="bg-grid" style={styles.grid} />
      {/* Ambient glow */}
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />

      <div style={styles.content}>
        {/* Header Bar */}
        <header style={styles.header}>
          <h1 className="gradient-text" style={styles.logo}>
            TECH HUNT
          </h1>
          <div style={styles.headerRight}>
            {/* Connection indicator */}
            <div style={styles.statusBadge}>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor: isConnected
                    ? "var(--color-success)"
                    : "var(--color-error)",
                  boxShadow: isConnected
                    ? "0 0 8px rgba(34, 197, 94, 0.6)"
                    : "0 0 8px rgba(239, 68, 68, 0.6)",
                }}
              />
              <span style={styles.statusText}>
                {isConnected ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <button
              id="logout-btn"
              className="btn-secondary"
              onClick={logout}
              style={styles.logoutBtn}
            >
              Disconnect
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="animate-fade-in" style={styles.welcomeSection}>
          <div className="glass-panel" style={styles.welcomeCard}>
            <div style={styles.welcomeHeader}>
              <div style={styles.avatarCircle}>
                <span style={styles.avatarText}>
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <h2 style={styles.welcomeTitle}>
                  Welcome back,{" "}
                  <span className="neon-text">{user?.username}</span>
                </h2>
                <p style={styles.welcomeSubtext}>
                  Ready to infiltrate the digital labyrinth?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section
          className="animate-fade-in"
          style={{ ...styles.actionsGrid, animationDelay: "0.15s" }}
        >
          <div
            className="glass-panel"
            style={styles.actionCard}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-neon-cyan)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "var(--shadow-neon-cyan)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-border-default)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={styles.actionIcon}>🏗️</div>
            <h3 style={styles.actionTitle}>Solo Run</h3>
            <p style={styles.actionDesc}>
              Explore a procedurally generated building at your own pace. Resume
              anytime.
            </p>
            <button className="btn-primary" style={styles.actionBtn} disabled>
              Coming Soon
            </button>
          </div>

          <div
            className="glass-panel"
            style={styles.actionCard}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-neon-purple)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "var(--shadow-neon-purple)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-border-default)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={styles.actionIcon}>👥</div>
            <h3 style={styles.actionTitle}>Team Hunt</h3>
            <p style={styles.actionDesc}>
              Create or join a team. Solve puzzles together in real-time.
            </p>
            <button className="btn-primary" style={styles.actionBtn} disabled>
              Coming Soon
            </button>
          </div>

          <div
            className="glass-panel"
            style={styles.actionCard}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-neon-green)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 0 20px rgba(34,197,94,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-border-default)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={styles.actionIcon}>🏆</div>
            <h3 style={styles.actionTitle}>Leaderboard</h3>
            <p style={styles.actionDesc}>
              See the top teams and individual performers globally.
            </p>
            <button className="btn-primary" style={styles.actionBtn} disabled>
              Coming Soon
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Inline Styles ───────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "var(--color-bg-primary)",
  },
  ambientOrb1: {
    position: "fixed",
    top: "-10%",
    right: "-5%",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ambientOrb2: {
    position: "fixed",
    bottom: "-10%",
    left: "-5%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "1.5rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid var(--color-border-default)",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 900,
    letterSpacing: "0.15em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-border-default)",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },
  statusText: {
    color: "var(--color-text-secondary)",
    fontFamily: "var(--font-mono)",
  },
  logoutBtn: {
    width: "auto",
    padding: "0.35rem 1rem",
    fontSize: "0.85rem",
  },
  welcomeSection: {
    marginBottom: "2rem",
  },
  welcomeCard: {
    padding: "2rem",
  },
  welcomeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  avatarCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--color-bg-primary)",
  },
  welcomeTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
  },
  welcomeSubtext: {
    color: "var(--color-text-secondary)",
    fontSize: "0.95rem",
    marginTop: "0.25rem",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.25rem",
  },
  actionCard: {
    padding: "1.75rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  actionIcon: {
    fontSize: "2rem",
    marginBottom: "0.25rem",
  },
  actionTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
  },
  actionDesc: {
    color: "var(--color-text-secondary)",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    flex: 1,
  },
  actionBtn: {
    marginTop: "0.5rem",
  },
  grid: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
  },
};
