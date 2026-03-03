// ============================================================================
// TECH HUNT — How To Play Modal
// Explains the game's mechanics in a themed overlay.
// ============================================================================

import { useEffect } from "react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel p-6 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-mono neon-text">HOW TO PLAY</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
          <section>
            <h3 className="font-mono text-[var(--color-neon-cyan)] text-xs mb-1 tracking-wider">
              1. CREATE OR JOIN
            </h3>
            <p>
              Start a solo mission or create a multiplayer room. Share the
              invite code with teammates to join your squad.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-[var(--color-neon-cyan)] text-xs mb-1 tracking-wider">
              2. EXPLORE THE BUILDING
            </h3>
            <p>
              Navigate through rooms on the building map. Rooms unlock
              sequentially — solve one to unlock the next.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-[var(--color-neon-cyan)] text-xs mb-1 tracking-wider">
              3. SOLVE PUZZLES
            </h3>
            <p>
              Each room contains a coding puzzle — binary, hex, ASCII, octal, or
              code challenges. Enter the correct answer to clear the room.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-[var(--color-neon-cyan)] text-xs mb-1 tracking-wider">
              4. USE HINTS WISELY
            </h3>
            <p>
              Three hint levels are available per puzzle (small → medium →
              large). Each costs score points, so use them strategically.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-[var(--color-neon-cyan)] text-xs mb-1 tracking-wider">
              5. COMPETE
            </h3>
            <p>
              Faster solves earn more points. Clear all rooms to complete the
              mission. Compare scores on the Leaderboard.
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full font-mono text-sm"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
