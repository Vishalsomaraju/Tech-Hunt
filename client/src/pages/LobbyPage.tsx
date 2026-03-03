// ============================================================================
// TECH HUNT Client — Lobby Page
// Pre-game waiting room. Shows invite code, player list, host launch button.
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { socket } from "../socket";
import { sessions, teams as teamsApi } from "../api/index";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  JOIN_SESSION,
  PLAYER_JOIN,
  PLAYER_LEAVE,
  TEAM_UPDATE,
  GAME_START,
  GamePhase,
  PlayerRole,
  MAX_TEAM_SIZE,
} from "@techhunt/shared";

interface LobbyPlayer {
  id: string;
  username: string;
  role: string;
  individualScore: number;
}

export function LobbyPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locState = location.state as {
    teamId?: string;
    teamCode?: string;
  } | null;

  const [, setTeamId] = useState(locState?.teamId || "");
  const [teamCode, setTeamCode] = useState(locState?.teamCode || "");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  usePageTitle("Lobby");

  const myId = user?.id || "";

  // Load session + team data
  useEffect(() => {
    if (!sessionId) return;

    sessions
      .get(sessionId)
      .then((sess) => {
        setTeamId(sess.teamId);

        teamsApi.get(sess.teamId).then((team) => {
          setTeamCode(team.code);
          const mapped = team.players.map((p) => ({
            id: p.userId,
            username: p.username,
            role: p.role,
            individualScore: p.individualScore,
          }));
          setPlayers(mapped);
          const me = mapped.find((p) => p.id === myId);
          setIsHost(me?.role === PlayerRole.LEADER);
        });

        // If game already started, go straight to game
        if (
          sess.phase === GamePhase.EXPLORING ||
          sess.phase === GamePhase.PUZZLE
        ) {
          navigate(`/game/${sessionId}`, { replace: true });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load session");
      });
  }, [sessionId, myId, navigate]);

  // Socket: join session + listen for player updates
  useEffect(() => {
    if (!sessionId) return;

    // Emit join
    socket.emit(JOIN_SESSION, { sessionId });

    const handlePlayerJoin = (data: { playerId: string; username: string }) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === data.playerId)) return prev;
        return [
          ...prev,
          {
            id: data.playerId,
            username: data.username,
            role: PlayerRole.MEMBER,
            individualScore: 0,
          },
        ];
      });
    };

    const handlePlayerLeave = (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    };

    const handleTeamUpdate = (data: {
      players?: LobbyPlayer[];
      newHostId?: string;
    }) => {
      if (data.players) {
        setPlayers(data.players);
      }
      if (data.newHostId) {
        setIsHost(data.newHostId === myId);
      }
    };

    const handleGameStart = () => {
      navigate(`/game/${sessionId}`, { replace: true });
    };

    socket.on(PLAYER_JOIN, handlePlayerJoin);
    socket.on(PLAYER_LEAVE, handlePlayerLeave);
    socket.on(TEAM_UPDATE, handleTeamUpdate);
    socket.on(GAME_START, handleGameStart);

    return () => {
      socket.off(PLAYER_JOIN, handlePlayerJoin);
      socket.off(PLAYER_LEAVE, handlePlayerLeave);
      socket.off(TEAM_UPDATE, handleTeamUpdate);
      socket.off(GAME_START, handleGameStart);
    };
  }, [sessionId, myId, navigate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(teamCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [teamCode]);

  const handleLaunch = async () => {
    if (!sessionId) return;
    setIsLaunching(true);
    try {
      await sessions.updatePhase(sessionId, GamePhase.EXPLORING);
      navigate(`/game/${sessionId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch");
      setIsLaunching(false);
    }
  };

  const emptySlots = Math.max(0, MAX_TEAM_SIZE - players.length);

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        paddingTop: "64px",
        padding: "64px var(--space-lg) var(--space-xl)",
      }}
    >
      <div className="w-full" style={{ maxWidth: "680px" }}>
        {/* Invite code block */}
        <div className="text-center" style={{ marginBottom: "40px" }}>
          <p
            className="font-mono"
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "var(--text-muted)",
              marginBottom: "10px",
            }}
          >
            MISSION CODE
          </p>
          <div
            className="flex items-center justify-center"
            style={{ gap: "12px" }}
          >
            <span
              className="font-mono glow-text"
              style={{
                fontSize: "40px",
                fontWeight: 700,
                letterSpacing: "0.4em",
                color: "var(--accent)",
              }}
            >
              {teamCode || "------"}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="font-mono transition-colors"
            style={{
              fontSize: "12px",
              color: copied ? "var(--success)" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            {copied ? "✓ Copied!" : "Copy code"}
          </button>
        </div>

        {/* Mode + difficulty badges */}
        <div
          className="flex justify-center flex-wrap"
          style={{ gap: "8px", marginBottom: "40px" }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: "1px solid var(--border-accent)",
              color: "var(--text-secondary)",
              padding: "4px 14px",
              borderRadius: "99px",
            }}
          >
            MULTIPLAYER
          </span>
        </div>

        {/* Player List */}
        <div
          className="panel border-glow"
          style={{ padding: "0", marginBottom: "32px" }}
        >
          {/* Header */}
          <div
            className="font-mono"
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            AGENTS ({players.length}/{MAX_TEAM_SIZE})
          </div>

          {/* Player rows */}
          <div>
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center"
                style={{ padding: "14px 20px", gap: "14px" }}
              >
                {/* Avatar */}
                <div
                  className="flex items-center justify-center font-mono shrink-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-accent)",
                    fontSize: "14px",
                    color: "var(--accent)",
                  }}
                >
                  {p.username[0]?.toUpperCase()}
                </div>
                {/* Name */}
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    flex: 1,
                  }}
                >
                  {p.username}
                  {p.id === myId && (
                    <span
                      style={{ color: "var(--text-dim)", marginLeft: "4px" }}
                    >
                      (you)
                    </span>
                  )}
                </span>
                {/* Role badge */}
                {p.role === PlayerRole.LEADER && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-dim)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      marginLeft: "auto",
                    }}
                  >
                    LEADER
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center"
                style={{
                  margin: "4px 20px",
                  padding: "14px",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-sm)",
                  opacity: 0.4,
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1px dashed var(--border)",
                  }}
                />
                <span
                  className="font-mono"
                  style={{ fontSize: "13px", color: "var(--text-dim)" }}
                >
                  Waiting...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--danger)",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            {error}
          </p>
        )}

        {/* Launch / Waiting */}
        {isHost ? (
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="btn-primary font-mono"
            style={{ padding: "16px", fontSize: "14px" }}
          >
            {isLaunching ? "LAUNCHING..." : "LAUNCH MISSION"}
          </button>
        ) : (
          <p
            className="text-center font-mono"
            style={{ fontSize: "13px", color: "var(--text-dim)" }}
          >
            Waiting for mission leader to launch...
          </p>
        )}
      </div>
    </div>
  );
}
