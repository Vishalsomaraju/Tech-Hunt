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
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: "rgba(8, 15, 26, 0.85)",
        backdropFilter: "blur(4px)",
        padding: "var(--space-md)",
      }}
      onClick={onClose}
    >
      <div
        className="panel border-glow animate-fade-in relative"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          ✕
        </button>

        <h2
          className="font-mono glow-text"
          style={{
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: "var(--space-lg)",
          }}
        >
          HOW TO PLAY
        </h2>

        <div className="flex flex-col" style={{ gap: "16px" }}>
          {[
            {
              title: "1. CREATE OR JOIN",
              body: "Start a solo mission or create a multiplayer room. Share the invite code with teammates to join your squad.",
            },
            {
              title: "2. EXPLORE THE BUILDING",
              body: "Navigate through rooms on the building map. Rooms unlock sequentially \u2014 solve one to unlock the next.",
            },
            {
              title: "3. SOLVE PUZZLES",
              body: "Each room contains a coding puzzle \u2014 binary, hex, ASCII, octal, or code challenges. Enter the correct answer to clear the room.",
            },
            {
              title: "4. USE HINTS WISELY",
              body: "Three hint levels are available per puzzle (small \u2192 medium \u2192 large). Each costs score points, so use them strategically.",
            },
            {
              title: "5. COMPETE",
              body: "Faster solves earn more points. Clear all rooms to complete the mission. Compare scores on the Leaderboard.",
            },
          ].map((step, i) => (
            <div key={i}>
              <h3
                className="font-mono"
                style={{
                  fontSize: "11px",
                  color: "var(--accent)",
                  letterSpacing: "0.1em",
                  marginBottom: "4px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-primary font-mono w-full"
          style={{
            marginTop: "var(--space-lg)",
            padding: "12px",
            fontSize: "13px",
          }}
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
