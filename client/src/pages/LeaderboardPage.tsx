// ============================================================================
// TECH HUNT — Leaderboard Page (public)
// Shows top teams from the server. Falls back gracefully if no /api/leaderboard
// endpoint exists — fetches /api/teams as a workaround.
// ============================================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { teams as teamsApi } from "../api/index";
import { usePageTitle } from "../hooks/usePageTitle";

interface LeaderboardEntry {
  id: string;
  name: string;
  teamScore: number;
  players: { userId: string; username: string; individualScore: number }[];
}

export function LeaderboardPage() {
  usePageTitle("Leaderboard");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    teamsApi
      .list()
      .then((teamList) => {
        const mapped: LeaderboardEntry[] = teamList.map((t) => ({
          id: t.id,
          name: t.name,
          teamScore: t.teamScore,
          players: t.players.map((p) => ({
            userId: p.userId,
            username: p.username,
            individualScore: p.individualScore,
          })),
        }));
        mapped.sort((a, b) => b.teamScore - a.teamScore);
        setEntries(mapped);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const rankBorders = [
    "var(--warning)", // gold
    "#94A3B8", // silver
    "#D97706", // bronze
  ];

  return (
    <div
      className="page-container min-h-screen"
      style={{
        paddingTop: "var(--space-2xl)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
      <div className="w-full mx-auto" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "var(--space-xl)" }}
        >
          <h1
            className="font-mono glow-text"
            style={{
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            LEADERBOARD
          </h1>
          <button
            onClick={() => navigate("/")}
            className="btn-secondary font-mono"
            style={{ width: "auto", padding: "8px 16px", fontSize: "12px" }}
          >
            ← BACK
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div
            className="panel border-glow"
            style={{ padding: 0, overflow: "hidden" }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  className="skeleton"
                  style={{ width: "24px", height: "20px", borderRadius: "4px" }}
                />
                <div
                  className="skeleton"
                  style={{
                    width: "120px",
                    height: "16px",
                    borderRadius: "4px",
                  }}
                />
                <div className="flex-1" />
                <div
                  className="skeleton"
                  style={{ width: "48px", height: "16px", borderRadius: "4px" }}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center" style={{ padding: "64px 0" }}>
            <p
              className="font-mono"
              style={{ fontSize: "13px", color: "var(--danger)" }}
            >
              {error}
            </p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center" style={{ padding: "64px 0" }}>
            <p
              className="font-mono"
              style={{ fontSize: "13px", color: "var(--text-muted)" }}
            >
              No teams yet. Be the first!
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div
            className="panel border-glow"
            style={{ padding: 0, overflow: "hidden" }}
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
              <span style={{ width: "48px" }}>#</span>
              <span className="flex-1">TEAM</span>
              <span style={{ width: "80px", textAlign: "right" }}>SCORE</span>
            </div>

            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="stagger"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom:
                    i < entries.length - 1 ? "1px solid var(--border)" : "none",
                  borderLeft:
                    i < 3
                      ? `3px solid ${rankBorders[i]}`
                      : "3px solid transparent",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    width: "48px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: i < 3 ? rankBorders[i] : "var(--text-dim)",
                  }}
                >
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <h3
                    className="font-mono truncate"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {entry.name}
                  </h3>
                  <p
                    className="font-mono"
                    style={{ fontSize: "11px", color: "var(--text-dim)" }}
                  >
                    {entry.players.length} agent
                    {entry.players.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <span
                  className="font-mono"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--accent)",
                    width: "80px",
                    textAlign: "right",
                  }}
                >
                  {entry.teamScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
