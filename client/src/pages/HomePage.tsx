// ============================================================================
// TECH HUNT Client — Home Page
// Create game (mode + difficulty) and join game (invite code).
// ============================================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { teams, sessions } from "../api/index";

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
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  const displayName = user?.username || guestName || "Agent";

  const handleCreate = async () => {
    setCreateError("");
    setIsCreating(true);
    try {
      // Create a team, then create a session
      const teamName = `${displayName}'s Team`;
      const team = await teams.create(teamName, "MULTIPLAYER");
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
      <header
        className="flex items-center justify-between shrink-0"
        style={{
          height: "54px",
          padding: "0 var(--space-lg)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-panel)",
        }}
      >
        <h1
          className="font-mono glow-text"
          style={{
            fontSize: "18px",
            letterSpacing: "0.15em",
            color: "var(--accent)",
          }}
        >
          TECH-HUNT
        </h1>
        <div className="flex items-center" style={{ gap: "16px" }}>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              color: "var(--text-dim)",
              background: "transparent",
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
            }}
            title="How to Play"
          >
            ?
          </button>
          <Link
            to="/leaderboard"
            className="font-mono transition-colors"
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            LEADERBOARD
          </Link>
          <span
            className="font-mono"
            style={{ fontSize: "13px", color: "var(--text-secondary)" }}
          >
            {displayName}
          </span>
          <button
            onClick={logout}
            className="font-mono transition-colors"
            style={{
              fontSize: "12px",
              color: "rgba(255,0,0,1)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 flex items-center justify-center"
        style={{ padding: "var(--space-xl)" }}
      >
        <div style={{ maxWidth: "520px", width: "100%" }}>
          {/* Tab bar */}
          <div
            className="flex"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "24px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setActiveTab("create")}
              className="flex-1 font-mono"
              style={{
                padding: "11px 0",
                fontSize: "13px",
                letterSpacing: "0.08em",
                cursor: "pointer",
                border: "none",
                borderBottom:
                  activeTab === "create"
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                color:
                  activeTab === "create"
                    ? "var(--text-primary)"
                    : "var(--text-dim)",
                background: "transparent",
              }}
            >
              CREATE GAME
            </button>
            <div
              style={{
                width: "1px",
                background: "var(--border)",
                margin: "8px 0",
              }}
            />
            <button
              onClick={() => setActiveTab("join")}
              className="flex-1 font-mono"
              style={{
                padding: "11px 0",
                fontSize: "13px",
                letterSpacing: "0.08em",
                cursor: "pointer",
                border: "none",
                borderBottom:
                  activeTab === "join"
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                color:
                  activeTab === "join"
                    ? "var(--text-primary)"
                    : "var(--text-dim)",
                background: "transparent",
              }}
            >
              JOIN GAME
            </button>
          </div>

          {/* Single panel — swaps content based on activeTab */}
          <div className="panel border-glow" style={{ padding: "32px" }}>
            {activeTab === "create" && (
              <>
                {/* Mode Selection */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    className="block font-mono"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--text-muted)",
                      marginBottom: "12px",
                    }}
                  >
                    MODE
                  </label>
                  <div className="flex flex-col" style={{ gap: "12px" }}>
                    {MODES.map((m) => (
                      <button
                        key={m.key}
                        disabled={m.disabled}
                        onClick={() => !m.disabled && setMode(m.key)}
                        className="w-full text-left transition-all"
                        style={{
                          padding: "20px",
                          borderRadius: "var(--radius-md)",
                          border: m.disabled
                            ? "1px solid var(--border)"
                            : mode === m.key
                              ? "1px solid var(--accent)"
                              : "1px solid var(--border)",
                          background: m.disabled
                            ? "var(--bg-elevated)"
                            : mode === m.key
                              ? "rgba(34,211,238,0.05)"
                              : "var(--bg-elevated)",
                          boxShadow:
                            !m.disabled && mode === m.key
                              ? "var(--glow-sm)"
                              : "none",
                          opacity: m.disabled ? 0.4 : 1,
                          cursor: m.disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {m.label}
                          </span>
                          {m.disabled && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                background: "rgba(255,165,0,0.12)",
                                color: "#ffb347",
                                padding: "4px 10px",
                                border: "1px solid rgba(255,165,0,0.4)",
                                borderRadius: "999px",
                                letterSpacing: "0.3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                backdropFilter: "blur(4px)",
                                boxShadow: "0 0 8px rgba(255,165,0,0.15)",
                              }}
                            >
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          {m.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    className="block font-mono"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--text-muted)",
                      marginBottom: "12px",
                    }}
                  >
                    DIFFICULTY
                  </label>
                  <div className="grid grid-cols-3" style={{ gap: "12px" }}>
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDifficulty(d.key)}
                        className="text-center transition-all"
                        style={{
                          padding: "20px",
                          borderRadius: "var(--radius-md)",
                          border:
                            difficulty === d.key
                              ? "1px solid var(--accent)"
                              : "1px solid var(--border)",
                          background:
                            difficulty === d.key
                              ? "rgba(34,211,238,0.05)"
                              : "var(--bg-elevated)",
                          boxShadow:
                            difficulty === d.key ? "var(--glow-sm)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          className="font-mono block"
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {d.label}
                        </span>
                        <span
                          className="block"
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          {d.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {createError && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--danger)",
                      marginBottom: "12px",
                    }}
                  >
                    {createError}
                  </p>
                )}

                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="btn-primary font-mono"
                  style={{ marginTop: "4px" }}
                >
                  {isCreating ? "INITIALISING..." : "INITIALISE BUILDING"}
                </button>
              </>
            )}

            {activeTab === "join" && (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginBottom: "34px",
                  }}
                >
                  Enter the 6-character invite code from the host.
                </p>
                <div className="flex flex-col" style={{ gap: "22px" }}>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase().slice(0, 6))
                    }
                    className="input-base"
                    placeholder="ABC123"
                    maxLength={6}
                    style={{
                      fontSize: "20px",
                      textAlign: "center",
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      height: "52px",
                    }}
                  />
                  {joinError && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--danger)",
                        textAlign: "center",
                      }}
                    >
                      {joinError}
                    </p>
                  )}
                  <button
                    onClick={handleJoin}
                    disabled={isJoining || inviteCode.length < 6}
                    className="btn-primary font-mono"
                    style={{ marginTop: "0" }}
                  >
                    {isJoining ? "CONNECTING..." : "JOIN BUILDING"}
                  </button>
                </div>
              </>
            )}
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
