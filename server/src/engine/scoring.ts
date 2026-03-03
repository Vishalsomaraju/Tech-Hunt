// ============================================================================
// TECH HUNT — Scoring Engine
// Handles base points, time bonuses, hint penalties, and answer validation.
// All constants come from @techhunt/shared so they stay in sync.
// ============================================================================

import {
  PUZZLE_BASE_SCORE,
  MIN_TIME_BONUS,
  MAX_TIME_BONUS,
  HINT_PENALTIES,
  ROOM_COUNTDOWN_SECONDS,
  HintLevel,
} from "@techhunt/shared";

// ─── Hint Penalties ────────────────────────────────────────────────────────

/** Returns the point penalty for a single hint level. */
export function calculateHintPenalty(hintLevel: HintLevel): number {
  return HINT_PENALTIES[hintLevel];
}

/** Returns the total penalty for all hints used. */
export function calculateTotalHintPenalty(hintsUsed: HintLevel[]): number {
  return hintsUsed.reduce((sum, level) => sum + calculateHintPenalty(level), 0);
}

// ─── Time Bonus ────────────────────────────────────────────────────────────

/**
 * Calculates the time bonus based on how fast the puzzle was solved.
 *
 * The bonus scales **linearly** from `MAX_TIME_BONUS` (instant solve) down to
 * `MIN_TIME_BONUS` (solved at or after the countdown expires).
 *
 * @param solveTimeSeconds — wall-clock seconds between puzzle_activated_at and
 *                           the moment the correct answer was received.
 */
export function calculateTimeBonus(solveTimeSeconds: number): number {
  if (solveTimeSeconds <= 0) return MAX_TIME_BONUS;
  if (solveTimeSeconds >= ROOM_COUNTDOWN_SECONDS) return MIN_TIME_BONUS;

  const ratio = 1 - solveTimeSeconds / ROOM_COUNTDOWN_SECONDS;
  return Math.round(MIN_TIME_BONUS + (MAX_TIME_BONUS - MIN_TIME_BONUS) * ratio);
}

// ─── Final Score ───────────────────────────────────────────────────────────

/**
 * Calculates the final score for a single puzzle solve.
 *
 *   score = PUZZLE_BASE_SCORE + timeBonus − totalHintPenalty
 *
 * The result is floored at **0** — scores never go negative.
 */
export function calculateScore(
  solveTimeSeconds: number,
  hintsUsed: HintLevel[],
): number {
  const timeBonus = calculateTimeBonus(solveTimeSeconds);
  const penalty = calculateTotalHintPenalty(hintsUsed);
  return Math.max(0, PUZZLE_BASE_SCORE + timeBonus - penalty);
}

// ─── Answer Validation ─────────────────────────────────────────────────────

/**
 * Validates a player's answer against the expected answer.
 * Comparison is **case-insensitive** and **whitespace-trimmed**.
 */
export function validateAnswer(
  playerAnswer: string,
  correctAnswer: string,
): boolean {
  return (
    playerAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  );
}
