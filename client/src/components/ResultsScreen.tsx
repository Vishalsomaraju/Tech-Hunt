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

  const medalColors = [
    "text-yellow-400", // 1st
    "text-gray-300", // 2nd
    "text-orange-400", // 3rd
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold font-mono neon-text text-center mb-2">
          MISSION COMPLETE
        </h1>
        <p className="text-center text-[var(--color-text-muted)] text-sm font-mono mb-8">
          All rooms cleared!
        </p>

        {/* Team Score */}
        <div className="glass-panel p-6 text-center mb-6 neon-border">
          <p className="text-xs font-mono text-[var(--color-text-muted)] mb-1">
            TOTAL TEAM SCORE
          </p>
          <p className="text-5xl font-mono font-bold gradient-text">
            {data.teamScore}
          </p>
        </div>

        {/* Player Rankings */}
        <div className="glass-panel p-4 space-y-2 mb-6">
          <h3 className="text-xs font-mono text-[var(--color-text-muted)] mb-2 tracking-wider">
            AGENT RANKINGS
          </h3>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]"
            >
              <span
                className={`text-lg font-bold font-mono w-6 text-center ${
                  medalColors[i] ?? "text-[var(--color-text-muted)]"
                }`}
              >
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center text-sm font-bold text-[var(--color-bg-primary)]">
                {p.username[0]?.toUpperCase()}
              </div>
              <span className="flex-1 font-mono text-sm">{p.username}</span>
              <span className="font-mono text-sm text-[var(--color-neon-cyan)]">
                {p.individualScore} pts
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="btn-primary font-mono tracking-wider"
          >
            NEW MISSION
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="btn-secondary font-mono tracking-wider"
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
