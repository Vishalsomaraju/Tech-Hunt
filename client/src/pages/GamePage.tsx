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
      <div className="flex items-center justify-center min-h-screen">
        <div className="neon-text text-lg font-mono animate-pulse-glow">
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
    <div className="h-screen flex flex-col">
      <TopBar />

      {/* Disconnect overlay */}
      {state.disconnected && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-panel p-8 max-w-sm text-center space-y-4">
            <div className="text-4xl animate-pulse">📡</div>
            <h2 className="text-lg font-mono neon-text">CONNECTION LOST</h2>
            <p className="text-sm text-[var(--color-text-muted)] font-mono">
              Attempting to reconnect...
            </p>
            <div className="w-8 h-8 border-2 border-[var(--color-neon-cyan)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Countdown overlay */}
        <CountdownOverlay />

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
          {/* Left column: Map + Puzzle */}
          <div className="lg:col-span-2 space-y-4 flex flex-col">
            <BuildingMap />
            <div className="flex-1 min-h-[200px]">
              <PuzzlePanel />
            </div>
          </div>

          {/* Right column: Chat + Notes */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-[200px]">
              <ChatPanel />
            </div>
            <div className="flex-1 min-h-[150px]">
              <NotesPanel />
            </div>
          </div>
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
