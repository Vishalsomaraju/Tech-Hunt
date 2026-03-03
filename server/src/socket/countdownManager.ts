// ============================================================================
// TECH HUNT — Countdown Manager
// Manages per-room countdown timers. When a player enters a puzzle room the
// countdown starts ticking; when it expires the puzzle officially begins
// (puzzle_activated_at is set, full puzzle content is broadcast).
//
// ▸ All timers are keyed by `${sessionId}:${roomIndex}`.
// ▸ Duplicate-start guard: if a timer already exists the call is a no-op.
// ▸ Every second a TIMER_SYNC event is emitted to the session room.
// ▸ NO database calls here — the expire callback handles persistence.
// ============================================================================

import { Server } from "socket.io";
import { SocketEvents, ROOM_COUNTDOWN_SECONDS } from "@techhunt/shared";

// ─── Internal State ──────────────────────────────────────────────────────────

interface CountdownEntry {
  /** The per-second tick interval */
  intervalId: NodeJS.Timeout;
  /** The final-expiry timeout */
  timeoutId: NodeJS.Timeout;
  /** Seconds remaining (decremented every tick) */
  remaining: number;
}

const timers = new Map<string, CountdownEntry>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function key(sessionId: string, roomIndex: number): string {
  return `${sessionId}:${roomIndex}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Starts a countdown for the given room.
 *
 * If a countdown is already running for this room the call is silently
 * ignored (dedup guard).
 *
 * @param io          — Socket.io server instance (for emitting TIMER_SYNC).
 * @param sessionId   — The game session ID (also the socket.io room name).
 * @param roomIndex   — 0-based room index within the building.
 * @param durationSec — Countdown length in seconds (defaults to the shared
 *                       constant ROOM_COUNTDOWN_SECONDS).
 * @param onExpire    — Async callback invoked exactly once when the countdown
 *                       reaches 0. Receives the sessionId and roomIndex so the
 *                       caller can set puzzle_activated_at and broadcast the
 *                       puzzle content.
 */
export function startCountdown(
  io: Server,
  sessionId: string,
  roomIndex: number,
  onExpire: (sessionId: string, roomIndex: number) => Promise<void>,
  durationSec: number = ROOM_COUNTDOWN_SECONDS,
): void {
  const k = key(sessionId, roomIndex);

  // ── Dedup guard ──
  if (timers.has(k)) return;

  let remaining = durationSec;

  // Emit the initial tick immediately so clients know the timer started
  io.to(sessionId).emit(SocketEvents.TIMER_SYNC, {
    roomIndex,
    remaining,
    total: durationSec,
  });

  // ── Per-second tick ──
  const intervalId = setInterval(() => {
    remaining -= 1;
    if (remaining < 0) remaining = 0;

    io.to(sessionId).emit(SocketEvents.TIMER_SYNC, {
      roomIndex,
      remaining,
      total: durationSec,
    });
  }, 1_000);

  // ── Final expiry ──
  const timeoutId = setTimeout(async () => {
    clearInterval(intervalId);
    timers.delete(k);

    try {
      await onExpire(sessionId, roomIndex);
    } catch (err) {
      console.error(
        `[countdown] onExpire error session=${sessionId} room=${roomIndex}:`,
        err,
      );
    }
  }, durationSec * 1_000);

  timers.set(k, { intervalId, timeoutId, remaining });
}

/**
 * Cancels a running countdown (e.g. when the puzzle is answered before it
 * expires). No-op if the timer does not exist.
 */
export function cancelCountdown(sessionId: string, roomIndex: number): void {
  const k = key(sessionId, roomIndex);
  const entry = timers.get(k);
  if (!entry) return;

  clearInterval(entry.intervalId);
  clearTimeout(entry.timeoutId);
  timers.delete(k);
}

/**
 * Returns `true` when a countdown is currently active for the given room.
 */
export function isCountdownActive(
  sessionId: string,
  roomIndex: number,
): boolean {
  return timers.has(key(sessionId, roomIndex));
}

/**
 * Cancels **all** countdowns for a session (e.g. on game end / disconnect
 * with no remaining players).
 */
export function clearAllForSession(sessionId: string): void {
  for (const [k, entry] of timers) {
    if (k.startsWith(`${sessionId}:`)) {
      clearInterval(entry.intervalId);
      clearTimeout(entry.timeoutId);
      timers.delete(k);
    }
  }
}
