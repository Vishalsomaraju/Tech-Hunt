// ============================================================================
// TECH HUNT — Results Screen Component
// Shown when GamePhase === RESULTS. Displays team score, individual
// player rankings, and options to return home or view leaderboard.
// ============================================================================

import { useGame } from "../contexts/GameContext";
import { useNavigate } from "react-router-dom";

export function ResultsScreen() {
  const { state } = useGame();
  const navigate = useNavigate();

  const data = state.gameEndData;
  if (!data) return null;

  const sorted = [...data.players].sort(
    (a, b) => b.individualScore - a.individualScore,
  );

  const rankBorders = [
    "var(--warning)", // 1st — gold
    "#94A3B8", // 2nd — silver
    "#D97706", // 3rd — bronze
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-base)", padding: "var(--space-xl)" }}
    >
      <div className="w-full animate-fade-in" style={{ maxWidth: "600px" }}>
        {/* Title */}
        <h1
          className="font-mono glow-text text-center"
          style={{
            fontSize: "48px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: "8px",
          }}
        >
          VAULT BREACHED
        </h1>
        <p
          className="text-center font-mono"
          style={{
            fontSize: "13px",
            color: "var(--text-dim)",
            marginBottom: "var(--space-2xl)",
          }}
        >
          All rooms cleared
        </p>

        {/* Team Score */}
        <div
          className="panel border-glow text-center"
          style={{
            padding: "var(--space-xl)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <p
            className="font-mono"
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            TEAM SCORE
          </p>
          <p
            className="font-mono gradient-text"
            style={{ fontSize: "56px", fontWeight: 700 }}
          >
            {data.teamScore}
          </p>
        </div>

        {/* Player Rankings */}
        <div
          className="panel border-glow"
          style={{
            padding: 0,
            marginBottom: "var(--space-lg)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            className="font-mono"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              background: "var(--bg-elevated)",
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ width: "32px" }}>#</span>
            <span className="flex-1">AGENT</span>
            <span>SCORE</span>
          </div>

          {/* Rows */}
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className="stagger"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  i < sorted.length - 1 ? "1px solid var(--border)" : "none",
                borderLeft:
                  i < 3
                    ? `3px solid ${rankBorders[i]}`
                    : "3px solid transparent",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <span
                className="font-mono"
                style={{
                  width: "32px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: i < 3 ? rankBorders[i] : "var(--text-dim)",
                }}
              >
                {i + 1}
              </span>

              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "10px",
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  {p.username[0]?.toUpperCase()}
                </span>
              </div>

              <span
                className="flex-1 font-mono"
                style={{ fontSize: "13px", color: "var(--text-primary)" }}
              >
                {p.username}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: "13px", color: "var(--accent)" }}
              >
                {p.individualScore}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col" style={{ gap: "var(--space-sm)" }}>
          <button
            onClick={() => navigate("/")}
            className="btn-primary font-mono"
            style={{
              padding: "14px",
              fontSize: "13px",
              letterSpacing: "0.15em",
            }}
          >
            NEW MISSION
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="btn-secondary font-mono"
            style={{
              padding: "14px",
              fontSize: "13px",
              letterSpacing: "0.15em",
            }}
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
