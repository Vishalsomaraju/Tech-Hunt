// ============================================================================
// TECH HUNT — Game Page
// The main gameplay view. Wraps everything in GameProvider.
// Layout: TopBar (fixed top), then a grid with BuildingMap + PuzzlePanel
// on left, ChatPanel + NotesPanel on right.
// CountdownOverlay renders on top during countdown.
// ResultsScreen replaces everything when phase === RESULTS.
// ============================================================================

import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { GameProvider, useGame } from "../contexts/GameContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { TopBar } from "../components/TopBar";
import { BuildingMap } from "../components/BuildingMap";
import { PuzzlePanel } from "../components/PuzzlePanel";
import { CountdownOverlay } from "../components/CountdownOverlay";
import { ChatPanel } from "../components/ChatPanel";
import { NotesPanel } from "../components/NotesPanel";
import { ResultsScreen } from "../components/ResultsScreen";
import { GamePhase } from "@techhunt/shared";

function GameLayout() {
  const { state } = useGame();
  usePageTitle("Mission");

  // Warn before navigating away during active game
  useEffect(() => {
    if (state.session?.phase === GamePhase.RESULTS || !state.loaded) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.session?.phase, state.loaded]);

  if (!state.loaded) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="font-mono glow-text animate-pulse-glow"
          style={{ fontSize: "16px", color: "var(--accent)" }}
        >
          SYNCING GAME STATE...
        </div>
      </div>
    );
  }

  // Results phase → full-screen results
  if (state.session?.phase === GamePhase.RESULTS || state.gameEndData) {
    return <ResultsScreen />;
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      <TopBar />

      {/* Disconnect overlay */}
      {state.disconnected && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            background: "rgba(8,15,26,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="panel border-glow text-center"
            style={{ padding: "32px", maxWidth: "360px" }}
          >
            <div
              style={{ fontSize: "40px", marginBottom: "16px" }}
              className="animate-pulse"
            >
              📡
            </div>
            <h2
              className="font-mono glow-text"
              style={{
                fontSize: "16px",
                color: "var(--accent)",
                marginBottom: "8px",
              }}
            >
              CONNECTION LOST
            </h2>
            <p
              className="font-mono"
              style={{
                fontSize: "13px",
                color: "var(--text-dim)",
                marginBottom: "16px",
              }}
            >
              Attempting to reconnect...
            </p>
            <div
              style={{
                width: "28px",
                height: "28px",
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                margin: "0 auto",
              }}
              className="animate-spin"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Countdown overlay */}
        <CountdownOverlay />

        {/* Side panel: Chat + Notes */}
        <div
          className="flex flex-col shrink-0 hidden lg:flex"
          style={{
            width: "260px",
            background: "var(--bg-panel)",
            borderRight: "1px solid var(--border)",
          }}
        >
          <div className="flex-1 min-h-0">
            <ChatPanel />
          </div>
          <div
            style={{ height: "200px", borderTop: "1px solid var(--border)" }}
          >
            <NotesPanel />
          </div>
        </div>

        {/* Main content: Map + Puzzle */}
        <div
          className="flex-1 flex flex-col overflow-y-auto"
          style={{ gap: "0" }}
        >
          <div className="flex-1 min-h-[300px]">
            <BuildingMap />
          </div>
          <div>
            <PuzzlePanel />
          </div>
        </div>
      </div>

      {/* Mobile: Chat + Notes below on small screens */}
      <div
        className="lg:hidden flex flex-col"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div style={{ height: "250px" }}>
          <ChatPanel />
        </div>
        <div style={{ height: "150px", borderTop: "1px solid var(--border)" }}>
          <NotesPanel />
        </div>
      </div>
    </div>
  );
}

export function GamePage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--color-error)] font-mono">
          Missing session ID
        </p>
      </div>
    );
  }

  return (
    <GameProvider sessionId={id}>
      <GameLayout />
    </GameProvider>
  );
}
