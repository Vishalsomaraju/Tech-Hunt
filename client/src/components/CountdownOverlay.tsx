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

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--color-bg-primary)]/90 backdrop-blur-sm">
      <div className="text-center animate-fade-in">
        <p className="text-xs font-mono text-[var(--color-text-muted)] mb-4 tracking-widest">
          ENTERING ROOM
        </p>

        {/* Circular timer */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-border-default)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: "drop-shadow(0 0 6px rgba(0,240,255,0.5))",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-mono font-bold neon-text">
              {timer.remaining}
            </span>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] font-mono">
          Puzzle activates soon...
        </p>
      </div>
    </div>
  );
}
