// ============================================================================
// TECH HUNT Client — Home Page
// Create game (mode + difficulty) and join game (invite code).
// ============================================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { teams, sessions } from "../api/index";
import { SessionType } from "@techhunt/shared";
import { usePageTitle } from "../hooks/usePageTitle";
import { HowToPlayModal } from "../components/HowToPlayModal";

type Mode = "cipher" | "programmer" | "hybrid";
type Difficulty = "easy" | "medium" | "hard";

const MODES: { key: Mode; label: string; desc: string; disabled?: boolean }[] =
  [
    {
      key: "cipher",
      label: "CIPHER MODE",
      desc: "No coding required. Binary, hex, ASCII.",
    },
    {
      key: "programmer",
      label: "PROGRAMMER MODE",
      desc: "Debug. Trace. Predict.",
    },
    {
      key: "hybrid",
      label: "HYBRID MODE",
      desc: "Both. For mixed teams.",
      disabled: true,
    },
  ];

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy", label: "EASY", desc: "15–20 rooms · ~20 min" },
  { key: "medium", label: "MEDIUM", desc: "25–30 rooms · ~35 min" },
  { key: "hard", label: "HARD", desc: "35–50 rooms · ~55 min" },
];

export function HomePage() {
  const { user, guestName, logout } = useAuth();
  const navigate = useNavigate();
  usePageTitle("HQ");

  const [mode, setMode] = useState<Mode>("cipher");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [inviteCode, setInviteCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const displayName = user?.username || guestName || "Agent";

  const handleCreate = async () => {
    setCreateError("");
    setIsCreating(true);
    try {
      // Create a team, then create a session
      const teamName = `${displayName}'s Team`;
      const team = await teams.create(teamName, SessionType.MULTIPLAYER);
      const session = await sessions.create(team.id);
      navigate(`/lobby/${session.id}`, {
        state: { teamId: team.id, teamCode: team.code },
      });
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create game",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    setJoinError("");
    if (!inviteCode.trim()) {
      setJoinError("Enter an invite code");
      return;
    }
    setIsJoining(true);
    try {
      const team = await teams.join(inviteCode.trim().toUpperCase());
      // Check for existing session
      const sessionList = await sessions.listByTeam(team.id);
      const activeSession = sessionList.find((s) => s.phase !== "RESULTS");
      if (activeSession) {
        navigate(`/lobby/${activeSession.id}`, {
          state: { teamId: team.id, teamCode: team.code },
        });
      } else {
        // Create new session
        const session = await sessions.create(team.id);
        navigate(`/lobby/${session.id}`, {
          state: { teamId: team.id, teamCode: team.code },
        });
      }
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Invalid invite code");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
        <h1 className="text-xl font-bold neon-text font-mono tracking-wider">
          TECH HUNT
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-7 h-7 rounded-full border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[var(--color-neon-cyan)]/50 transition-colors text-sm font-mono"
            title="How to Play"
          >
            ?
          </button>
          <Link
            to="/leaderboard"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors"
          >
            LEADERBOARD
          </Link>
          <span className="text-sm text-[var(--color-text-secondary)] font-mono">
            {displayName}
          </span>
          <button
            onClick={logout}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT — Create Game */}
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Create Game
            </h2>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-3">
                MODE
              </label>
              <div className="space-y-2">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    disabled={m.disabled}
                    onClick={() => !m.disabled && setMode(m.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      m.disabled
                        ? "opacity-40 cursor-not-allowed border-[var(--color-border-default)]"
                        : mode === m.key
                          ? "border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/5"
                          : "border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">
                        {m.label}
                      </span>
                      {m.disabled && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-3">
                DIFFICULTY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      difficulty === d.key
                        ? "border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/5"
                        : "border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]"
                    }`}
                  >
                    <span className="font-mono text-sm font-semibold block">
                      {d.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] mt-1 block">
                      {d.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p className="text-sm text-[var(--color-error)]">{createError}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="btn-primary font-mono tracking-wider"
            >
              {isCreating ? "INITIALISING..." : "INITIALISE BUILDING"}
            </button>
          </div>

          {/* RIGHT — Join Game */}
          <div className="glass-panel p-6 space-y-6 flex flex-col">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Join Game
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Enter the 6-character invite code from the host.
            </p>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(e.target.value.toUpperCase().slice(0, 6))
                }
                className="input-field font-mono text-center text-2xl tracking-[0.3em] uppercase"
                placeholder="ABC123"
                maxLength={6}
              />
              {joinError && (
                <p className="text-sm text-[var(--color-error)] text-center">
                  {joinError}
                </p>
              )}
              <button
                onClick={handleJoin}
                disabled={isJoining || inviteCode.length < 6}
                className="btn-primary font-mono tracking-wider"
              >
                {isJoining ? "CONNECTING..." : "JOIN BUILDING"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
