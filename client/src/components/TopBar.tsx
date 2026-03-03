// ============================================================================
// TECH HUNT — Top Bar Component
// Shows team score, player avatars, phase indicator, and session info.
// ============================================================================

import { useGame } from "../contexts/GameContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GamePhase } from "@techhunt/shared";

export function TopBar() {
  const { state } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();

  const phaseLabel: Record<string, string> = {
    [GamePhase.LOBBY]: "LOBBY",
    [GamePhase.EXPLORING]: "EXPLORING",
    [GamePhase.PUZZLE]: "PUZZLE",
    [GamePhase.RESULTS]: "RESULTS",
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)] shrink-0">
      {/* Left: Logo + Phase */}
      <div className="flex items-center gap-4">
        <h1
          className="text-lg font-bold font-mono neon-text cursor-pointer"
          onClick={() => navigate("/")}
        >
          TECH HUNT
        </h1>
        {state.session && (
          <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--color-neon-cyan)]/10 text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan)]/30">
            {phaseLabel[state.session.phase] ?? state.session.phase}
          </span>
        )}
      </div>

      {/* Center: Team Score */}
      <div className="text-center">
        <p className="text-xs text-[var(--color-text-muted)] font-mono">
          TEAM SCORE
        </p>
        <p className="text-xl font-bold font-mono text-[var(--color-neon-cyan)]">
          {state.teamScore}
        </p>
      </div>

      {/* Right: Player avatars */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {state.players.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                p.id === user?.id
                  ? "border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]"
              }`}
              title={p.username}
            >
              {p.username[0]?.toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-xs text-[var(--color-text-muted)] font-mono ml-1">
          {state.players.length}P
        </span>
      </div>
    </header>
  );
}
