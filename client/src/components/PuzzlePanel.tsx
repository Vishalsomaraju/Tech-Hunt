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
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
        <span className="text-5xl mb-3">✓</span>
        <h3 className="text-lg font-mono font-bold text-[var(--color-neon-green)]">
          ROOM CLEARED
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Move to the next room on the map.
        </p>
      </div>
    );
  }

  // ── Idle state (no active puzzle) ──
  if (!puzzle || roomIdx === null) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
        <span className="text-4xl mb-3 opacity-40">🔍</span>
        <h3 className="text-sm font-mono text-[var(--color-text-muted)]">
          SELECT A ROOM TO BEGIN
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Navigate the building map and enter an unlocked room.
        </p>
      </div>
    );
  }

  // ── Active state ──
  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Puzzle header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-[var(--color-neon-cyan)] tracking-wider">
          PUZZLE — ROOM {roomIdx + 1}
        </h3>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
          {puzzle.type}
        </span>
      </div>

      {/* Prompt */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
        <p className="font-mono text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
          {puzzle.prompt}
        </p>
      </div>

      {/* Hints */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          HINTS
        </p>
        <div className="flex gap-2">
          {(
            [HintLevel.SMALL, HintLevel.MEDIUM, HintLevel.LARGE] as HintLevel[]
          ).map((level) => {
            const revealed = state.revealedHints[level];
            return (
              <button
                key={level}
                onClick={() => handleHint(level)}
                disabled={!!revealed}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                  revealed
                    ? "border-[var(--color-neon-green)]/30 text-[var(--color-neon-green)] bg-[var(--color-neon-green)]/5"
                    : "border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-orange)] hover:text-[var(--color-neon-orange)]"
                }`}
                title={`-${HINT_PENALTIES[level]} pts`}
              >
                {level} {revealed ? "✓" : `(-${HINT_PENALTIES[level]})`}
              </button>
            );
          })}
        </div>
        {/* Revealed hint text */}
        {Object.entries(state.revealedHints).map(([level, text]) => (
          <div
            key={level}
            className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-neon-orange)]/20"
          >
            <p className="text-xs font-mono text-[var(--color-neon-orange)] mb-0.5">
              {level}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">{text}</p>
          </div>
        ))}
      </div>

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className={`input-field flex-1 font-mono ${
            state.lastAnswerResult === "incorrect"
              ? "border-[var(--color-error)] animate-shake"
              : ""
          }`}
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting || !answer.trim()}
          className="btn-primary !w-auto !px-6 font-mono text-sm"
        >
          {isSubmitting ? "..." : "SUBMIT"}
        </button>
      </form>

      {/* Answer feedback */}
      {state.lastAnswerResult === "incorrect" && (
        <p className="text-sm text-[var(--color-error)] font-mono text-center animate-fade-in">
          ✗ INCORRECT — TRY AGAIN
        </p>
      )}
      {state.lastAnswerResult === "correct" && (
        <p className="text-sm text-[var(--color-neon-green)] font-mono text-center animate-fade-in">
          ✓ CORRECT!
        </p>
      )}
    </div>
  );
}
