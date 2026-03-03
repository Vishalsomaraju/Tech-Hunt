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
    <header
      className="flex items-center justify-between shrink-0"
      style={{
        height: "52px",
        background: "var(--bg-panel)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        gap: "20px",
      }}
    >
      {/* Left: TH monogram */}
      <div className="flex items-center" style={{ gap: "16px" }}>
        <span
          className="font-mono glow-text cursor-pointer"
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.1em",
          }}
          onClick={() => navigate("/")}
        >
          TH
        </span>
        {state.session && (
          <span
            className="font-mono"
            style={{ fontSize: "13px", color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--accent)", marginRight: "4px" }}>
              &gt;
            </span>
            {phaseLabel[state.session.phase] ?? state.session.phase}
          </span>
        )}
      </div>

      {/* Right: Score + Player avatars */}
      <div className="flex items-center" style={{ gap: "20px" }}>
        {/* Score */}
        <span
          className="font-mono"
          style={{ fontSize: "13px", color: "var(--accent)" }}
        >
          ⬡ {state.teamScore}
        </span>

        {/* Player avatar stack */}
        <div className="flex" style={{ marginLeft: "4px" }}>
          {state.players.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-center font-mono"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background:
                  p.id === user?.id
                    ? "rgba(34,211,238,0.15)"
                    : "var(--bg-elevated)",
                border:
                  p.id === user?.id
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-accent)",
                fontSize: "11px",
                color:
                  p.id === user?.id ? "var(--accent)" : "var(--text-secondary)",
                marginLeft: i > 0 ? "-8px" : "0",
                zIndex: 5 - i,
                position: "relative",
              }}
              title={p.username}
            >
              {p.username[0]?.toUpperCase()}
            </div>
          ))}
        </div>
        <span
          className="font-mono"
          style={{ fontSize: "11px", color: "var(--text-dim)" }}
        >
          {state.players.length}P
        </span>
      </div>
    </header>
  );
}
