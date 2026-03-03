// ============================================================================
// TECH HUNT — Puzzle Panel Component
// Displays the active puzzle prompt and answer input. Shows four states:
// idle (no puzzle), countdown (overlay handles this), active (answering),
// solved (✓ badge). Also handles hint requests.
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { useGame } from "../contexts/GameContext";
import { HintLevel, HINT_PENALTIES } from "@techhunt/shared";

export function PuzzlePanel() {
  const { state, submitAnswer, requestHint, clearAnswerResult } = useGame();
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const roomIdx = state.activePuzzleRoomIndex;
  const puzzle = roomIdx !== null ? state.puzzles[roomIdx] : null;
  const currentRoomIdx = state.currentRoomId
    ? state.rooms.findIndex((r) => r.id === state.currentRoomId)
    : -1;
  const currentPuzzle =
    currentRoomIdx >= 0 ? state.puzzles[currentRoomIdx] : null;

  // Clear answer field when puzzle changes
  useEffect(() => {
    setAnswer("");
    setIsSubmitting(false);
  }, [roomIdx]);

  // Auto-clear incorrect result after animation
  useEffect(() => {
    if (state.lastAnswerResult === "incorrect") {
      const t = setTimeout(() => {
        clearAnswerResult();
        setIsSubmitting(false);
      }, 1500);
      return () => clearTimeout(t);
    }
    if (state.lastAnswerResult === "correct") {
      setIsSubmitting(false);
    }
  }, [state.lastAnswerResult, clearAnswerResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzle || !answer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    submitAnswer(puzzle.id, answer.trim());
  };

  const handleHint = (level: HintLevel) => {
    if (!puzzle) return;
    requestHint(puzzle.id, level);
  };

  // ── Solved state (current room is solved) ──
  if (currentPuzzle?.isSolved) {
    return (
      <div
        style={{
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--border)",
          padding: "16px 24px",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid var(--success)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 20px",
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: "13px",
              color: "var(--success)",
              fontWeight: 600,
            }}
          >
            ✓ PUZZLE SOLVED
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Move to the next room on the map.
          </span>
        </div>
      </div>
    );
  }

  // ── Idle state (no active puzzle) ──
  if (!puzzle || roomIdx === null) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: "160px",
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--border)",
          padding: "16px 24px",
        }}
      >
        <p
          className="font-mono"
          style={{ fontSize: "13px", color: "var(--text-dim)" }}
        >
          &gt; navigate to a puzzle room<span className="animate-pulse">_</span>
        </p>
      </div>
    );
  }

  // ── Active state ──
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        padding: "16px 24px",
      }}
    >
      {/* Row 1: badge */}
      <span
        className="font-mono inline-block"
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "3px 10px",
          border: "1px solid var(--accent-dim)",
          color: "var(--accent)",
          borderRadius: "4px",
        }}
      >
        {puzzle.type} — Room {roomIdx + 1}
      </span>

      {/* Row 2: question text */}
      <div
        className="font-mono"
        style={{
          fontSize: "15px",
          color: "var(--text-primary)",
          lineHeight: 1.6,
          margin: "12px 0",
          whiteSpace: "pre-wrap",
        }}
      >
        {puzzle.prompt}
      </div>

      {/* Row 3: answer input + submit */}
      <form
        onSubmit={handleSubmit}
        className="flex"
        style={{ gap: "10px", marginBottom: "12px" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className={`input-base flex-1 font-mono ${
            state.lastAnswerResult === "incorrect" ? "animate-shake" : ""
          }`}
          style={{
            fontSize: "15px",
            height: "44px",
            borderColor:
              state.lastAnswerResult === "incorrect"
                ? "var(--danger)"
                : undefined,
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting || !answer.trim()}
          className="btn-primary font-mono"
          style={{
            width: "auto",
            height: "44px",
            padding: "0 24px",
            whiteSpace: "nowrap",
          }}
        >
          {isSubmitting ? "..." : "SUBMIT"}
        </button>
      </form>

      {/* Answer feedback */}
      {state.lastAnswerResult === "incorrect" && (
        <p
          className="font-mono text-center animate-fade-in"
          style={{
            fontSize: "13px",
            color: "var(--danger)",
            marginBottom: "8px",
          }}
        >
          ✗ INCORRECT — TRY AGAIN
        </p>
      )}
      {state.lastAnswerResult === "correct" && (
        <p
          className="font-mono text-center animate-fade-in"
          style={{
            fontSize: "13px",
            color: "var(--success)",
            marginBottom: "8px",
          }}
        >
          ✓ CORRECT!
        </p>
      )}

      {/* Row 4: hints */}
      <div style={{ marginTop: "4px" }}>
        <div className="flex flex-wrap" style={{ gap: "8px" }}>
          {(
            [HintLevel.SMALL, HintLevel.MEDIUM, HintLevel.LARGE] as HintLevel[]
          ).map((level) => {
            const revealed = state.revealedHints[level];
            return (
              <button
                key={level}
                onClick={() => handleHint(level)}
                disabled={!!revealed}
                className="font-mono transition-colors"
                style={{
                  fontSize: "11px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: revealed
                    ? "1px solid var(--success-dim)"
                    : "1px solid var(--border)",
                  color: revealed ? "var(--success)" : "var(--text-muted)",
                  background: revealed
                    ? "rgba(52,211,153,0.05)"
                    : "transparent",
                  cursor: revealed ? "default" : "pointer",
                }}
              >
                {level} {revealed ? "✓" : `−${HINT_PENALTIES[level]} pts`}
              </button>
            );
          })}
        </div>

        {/* Revealed hint text */}
        {Object.entries(state.revealedHints).map(([level, text]) => (
          <div
            key={level}
            style={{
              background: "var(--bg-elevated)",
              borderLeft: "3px solid var(--warning)",
              padding: "10px 14px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
              marginTop: "8px",
            }}
          >
            <p
              className="font-mono"
              style={{
                fontSize: "10px",
                color: "var(--warning)",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              {level}
            </p>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
