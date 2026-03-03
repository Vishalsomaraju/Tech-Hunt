// ============================================================================
// TECH HUNT — Countdown Overlay Component
// Full-screen overlay displayed during room countdown. Shows seconds,
// circular progress ring, room info.
// ============================================================================

import { useGame } from "../contexts/GameContext";
import { ROOM_COUNTDOWN_SECONDS } from "@techhunt/shared";

export function CountdownOverlay() {
  const { state } = useGame();
  const timer = state.timer;

  if (!timer || timer.remaining <= 0) return null;

  const total = timer.total || ROOM_COUNTDOWN_SECONDS;
  const pct = (timer.remaining / total) * 100;
  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDash = (pct / 100) * circumference;

  const isWarning = timer.remaining <= 20;
  const isDanger = timer.remaining <= 10;
  const timerColor = isDanger
    ? "var(--danger)"
    : isWarning
      ? "var(--warning)"
      : "var(--accent)";

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{
        background: "rgba(8, 15, 26, 0.88)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="text-center animate-fade-in"
        style={{ maxWidth: "400px", width: "100%", padding: "var(--space-xl)" }}
      >
        <p
          className="font-mono"
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "var(--space-lg)",
          }}
        >
          ENTERING ROOM
        </p>

        {/* Circular timer */}
        <div
          className="relative mx-auto"
          style={{
            width: "160px",
            height: "160px",
            marginBottom: "var(--space-lg)",
          }}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={timerColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: `drop-shadow(0 0 8px ${timerColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-mono ${isDanger ? "glow-text" : ""}`}
              style={{
                fontSize: "96px",
                fontWeight: 700,
                color: timerColor,
                lineHeight: 1,
              }}
            >
              {timer.remaining}
            </span>
          </div>
        </div>

        <p
          className="font-mono"
          style={{ fontSize: "13px", color: "var(--text-dim)" }}
        >
          Puzzle activates soon…
        </p>
      </div>
    </div>
  );
}
