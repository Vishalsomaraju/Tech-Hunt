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
  SocketEvents,
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
    socket.emit(SocketEvents.JOIN_SESSION, { sessionId });

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

    socket.on(SocketEvents.PLAYER_JOIN, handlePlayerJoin);
    socket.on(SocketEvents.PLAYER_LEAVE, handlePlayerLeave);
    socket.on(SocketEvents.TEAM_UPDATE, handleTeamUpdate);
    socket.on(SocketEvents.GAME_START, handleGameStart);

    return () => {
      socket.off(SocketEvents.PLAYER_JOIN, handlePlayerJoin);
      socket.off(SocketEvents.PLAYER_LEAVE, handlePlayerLeave);
      socket.off(SocketEvents.TEAM_UPDATE, handleTeamUpdate);
      socket.off(SocketEvents.GAME_START, handleGameStart);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Title */}
        <h1 className="text-2xl font-bold neon-text font-mono tracking-wider text-center mb-8">
          MISSION BRIEFING
        </h1>

        <div className="glass-panel p-8 space-y-6">
          {/* Invite Code */}
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              INVITE CODE
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-bold tracking-[0.4em] text-[var(--color-neon-cyan)]">
                {teamCode || "------"}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-neon-cyan)] transition-colors text-sm"
                title="Copy invite code"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>

          {/* Player List */}
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              AGENTS ({players.length}/{MAX_TEAM_SIZE})
            </p>
            <div className="space-y-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center text-sm font-bold text-[var(--color-bg-primary)]">
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 font-mono text-sm">
                    {p.username}
                    {p.id === myId && (
                      <span className="text-[var(--color-text-muted)] ml-1">
                        (you)
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${
                      p.role === PlayerRole.LEADER
                        ? "bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)]"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {p.role}
                  </span>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[var(--color-border-default)] opacity-30"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-[var(--color-text-muted)]" />
                  <span className="font-mono text-sm text-[var(--color-text-muted)]">
                    Waiting...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--color-error)] text-center">
              {error}
            </p>
          )}

          {/* Launch / Waiting */}
          {isHost ? (
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="btn-primary font-mono tracking-wider"
            >
              {isLaunching ? "LAUNCHING..." : "LAUNCH MISSION"}
            </button>
          ) : (
            <p className="text-center text-sm text-[var(--color-text-muted)] font-mono">
              Waiting for mission leader to launch...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
