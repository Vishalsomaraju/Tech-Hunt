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

  const medalColors = ["text-yellow-400", "text-gray-300", "text-orange-400"];

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-mono neon-text tracking-wider">
            LEADERBOARD
          </h1>
          <button
            onClick={() => navigate("/")}
            className="btn-secondary !w-auto !px-4 text-sm font-mono"
          >
            ← BACK
          </button>
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="neon-text font-mono animate-pulse-glow">LOADING...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-[var(--color-error)] font-mono text-sm">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-muted)] font-mono text-sm">
              No teams yet. Be the first!
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`glass-panel p-4 flex items-center gap-4 ${
                  i < 3 ? "neon-border" : ""
                }`}
              >
                {/* Rank */}
                <span
                  className={`text-2xl font-mono font-bold w-10 text-center ${
                    medalColors[i] ?? "text-[var(--color-text-muted)]"
                  }`}
                >
                  {i + 1}
                </span>

                {/* Team info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono font-bold text-[var(--color-text-primary)] truncate">
                    {entry.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    {entry.players.length} agent
                    {entry.players.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Score */}
                <span className="text-xl font-mono font-bold text-[var(--color-neon-cyan)]">
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
