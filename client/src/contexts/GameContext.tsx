// ============================================================================
// TECH HUNT Client — Game Context
// Central game state. All socket event listeners are registered here.
// Components read from this context — they never talk to the socket directly.
// ============================================================================

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { socket } from "../socket";
import {
  JOIN_SESSION,
  GAME_STATE,
  ROOM_ENTER,
  PLAYER_JOIN,
  PLAYER_LEAVE,
  PLAYER_MOVED,
  ROOM_UNLOCK,
  PUZZLE_START,
  PUZZLE_ANSWER,
  REQUEST_HINT,
  ANSWER_INCORRECT,
  PUZZLE_HINT,
  PUZZLE_SOLVED,
  GAME_END,
  TIMER_SYNC,
  TEAM_UPDATE,
  SCORE_UPDATE,
  SEND_CHAT,
  CHAT_MESSAGE,
  UPDATE_NOTES,
  NOTES_UPDATED,
  PLAYER_READY,
  SKIP_COUNTDOWN,
  ERROR,
  GamePhase,
  RoomStatus,
  HintLevel,
} from "@techhunt/shared";
import type { PuzzlePublic } from "@techhunt/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GamePlayer {
  id: string;
  username: string;
  individualScore: number;
  isHost: boolean;
  currentRoomId: string | null;
}

export interface GameRoom {
  id: string;
  buildingId: string;
  floor: number;
  position: number;
  status: RoomStatus;
  puzzleType: string;
  seed: number;
}

export interface GamePuzzle extends PuzzlePublic {
  isSolved: boolean;
  solvedByPlayerId: string | null;
}

export interface ChatMessage {
  senderId: string | null;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface TimerState {
  roomIndex: number;
  remaining: number;
  total: number;
}

interface GameSession {
  id: string;
  teamId: string;
  phase: GamePhase;
  startedAt: string;
  notes: string;
}

export interface GameState {
  /** Whether initial GAME_STATE has been received */
  loaded: boolean;
  /** Whether the socket is currently disconnected */
  disconnected: boolean;
  session: GameSession | null;
  players: GamePlayer[];
  rooms: GameRoom[];
  puzzles: GamePuzzle[];
  currentRoomId: string | null;
  timer: TimerState | null;
  activePuzzleRoomIndex: number | null;
  chat: ChatMessage[];
  notes: string;
  teamScore: number;
  lastAnswerResult: "correct" | "incorrect" | null;
  /** Hint texts revealed so far keyed by hintLevel */
  revealedHints: Record<string, string>;
  gameEndData: {
    teamScore: number;
    players: {
      id: string;
      username: string;
      individualScore: number;
      role: string;
    }[];
  } | null;
  error: string | null;
  /** How many players have voted/arrived to skip the countdown */
  skipVotes: number;
  /** Total players in the session (for skip vote tracker) */
  totalPlayers: number;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type GameAction =
  | {
      type: "GAME_STATE_RECEIVED";
      payload: {
        session: GameSession;
        players: GamePlayer[];
        rooms: GameRoom[];
        puzzles: GamePuzzle[];
      };
    }
  | { type: "PLAYER_JOIN"; payload: { playerId: string; username: string } }
  | { type: "PLAYER_LEAVE"; payload: { playerId: string } }
  | { type: "PLAYER_MOVED"; payload: { playerId: string; roomId: string } }
  | { type: "TIMER_SYNC"; payload: TimerState }
  | {
      type: "PUZZLE_START";
      payload: { roomIndex: number; roomId: string; puzzle: PuzzlePublic };
    }
  | {
      type: "PUZZLE_SOLVED";
      payload: {
        roomIndex: number;
        roomId: string;
        solvedByPlayerId: string;
        scoreEarned: number;
      };
    }
  | { type: "ANSWER_INCORRECT"; payload: { puzzleId: string; message: string } }
  | {
      type: "PUZZLE_HINT";
      payload: {
        puzzleId: string;
        hintLevel: string;
        hintText: string;
        scoreDeducted: number;
      };
    }
  | { type: "ROOM_UNLOCK"; payload: { roomIndex: number; roomId: string } }
  | {
      type: "SCORE_UPDATE";
      payload: {
        teamScore: number;
        playerScores: { playerId: string; score: number }[];
      };
    }
  | { type: "CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "NOTES_UPDATED"; payload: { notes: string } }
  | { type: "SET_NOTES_LOCAL"; payload: string }
  | { type: "SET_CURRENT_ROOM"; payload: string }
  | {
      type: "TEAM_UPDATE";
      payload: { players: GamePlayer[]; newHostId?: string };
    }
  | { type: "GAME_END"; payload: GameState["gameEndData"] }
  | { type: "CLEAR_ANSWER_RESULT" }
  | { type: "SOCKET_DISCONNECTED" }
  | { type: "SOCKET_RECONNECTED" }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_SKIP_VOTES"; skipVotes: number; totalPlayers: number }
  | { type: "SET_COUNTDOWN"; seconds: null };

const initialState: GameState = {
  loaded: false,
  disconnected: false,
  session: null,
  players: [],
  rooms: [],
  puzzles: [],
  currentRoomId: null,
  timer: null,
  activePuzzleRoomIndex: null,
  chat: [],
  notes: "",
  teamScore: 0,
  lastAnswerResult: null,
  revealedHints: {},
  gameEndData: null,
  error: null,
  skipVotes: 0,
  totalPlayers: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "GAME_STATE_RECEIVED":
      return {
        ...state,
        loaded: true,
        session: action.payload.session,
        players: action.payload.players,
        rooms: action.payload.rooms,
        puzzles: action.payload.puzzles,
        notes: action.payload.session.notes || "",
        teamScore: 0,
        error: null,
      };

    case "PLAYER_JOIN": {
      if (state.players.some((p) => p.id === action.payload.playerId))
        return state;
      return {
        ...state,
        players: [
          ...state.players,
          {
            id: action.payload.playerId,
            username: action.payload.username,
            individualScore: 0,
            isHost: false,
            currentRoomId: state.rooms[0]?.id ?? null,
          },
        ],
        chat: [
          ...state.chat,
          {
            senderId: null,
            senderName: "SYSTEM",
            message: `${action.payload.username} joined the mission`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case "PLAYER_LEAVE":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.payload.playerId),
        chat: [
          ...state.chat,
          {
            senderId: null,
            senderName: "SYSTEM",
            message: `${state.players.find((p) => p.id === action.payload.playerId)?.username ?? "A player"} left the mission`,
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case "PLAYER_MOVED":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, currentRoomId: action.payload.roomId }
            : p,
        ),
      };

    case "TIMER_SYNC":
      return {
        ...state,
        timer: action.payload,
        skipVotes: state.skipVotes,
        totalPlayers: state.totalPlayers,
      };

    case "PUZZLE_START":
      return {
        ...state,
        activePuzzleRoomIndex: action.payload.roomIndex,
        timer: null,
        revealedHints: {},
        skipVotes: 0,
        totalPlayers: 0,
        puzzles: state.puzzles.map((p, i) =>
          i === action.payload.roomIndex
            ? {
                ...p,
                ...action.payload.puzzle,
                isSolved: false,
                solvedByPlayerId: null,
              }
            : p,
        ),
      };

    case "PUZZLE_SOLVED": {
      const solver = state.players.find(
        (p) => p.id === action.payload.solvedByPlayerId,
      );
      return {
        ...state,
        activePuzzleRoomIndex: null,
        lastAnswerResult: "correct",
        timer: null,
        revealedHints: {},
        puzzles: state.puzzles.map((p, i) =>
          i === action.payload.roomIndex
            ? {
                ...p,
                isSolved: true,
                solvedByPlayerId: action.payload.solvedByPlayerId,
              }
            : p,
        ),
        rooms: state.rooms.map((r, i) =>
          i === action.payload.roomIndex
            ? { ...r, status: RoomStatus.COMPLETED }
            : r,
        ),
        chat: [
          ...state.chat,
          {
            senderId: null,
            senderName: "SYSTEM",
            message: `🎉 ${solver?.username ?? "Someone"} solved Room ${action.payload.roomIndex + 1}! (+${action.payload.scoreEarned} pts)`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case "ANSWER_INCORRECT":
      return { ...state, lastAnswerResult: "incorrect" };

    case "PUZZLE_HINT":
      return {
        ...state,
        revealedHints: {
          ...state.revealedHints,
          [action.payload.hintLevel]: action.payload.hintText,
        },
      };

    case "ROOM_UNLOCK":
      return {
        ...state,
        rooms: state.rooms.map((r, i) =>
          i === action.payload.roomIndex
            ? { ...r, status: RoomStatus.UNLOCKED }
            : r,
        ),
      };

    case "SCORE_UPDATE":
      return {
        ...state,
        teamScore: action.payload.teamScore,
        players: state.players.map((p) => {
          const ps = action.payload.playerScores.find(
            (s) => s.playerId === p.id,
          );
          return ps ? { ...p, individualScore: ps.score } : p;
        }),
      };

    case "CHAT_MESSAGE": {
      const newChat = [...state.chat, action.payload];
      // Cap at 300 messages to prevent memory bloat
      return {
        ...state,
        chat: newChat.length > 300 ? newChat.slice(-200) : newChat,
      };
    }

    case "NOTES_UPDATED":
      return { ...state, notes: action.payload.notes };

    case "SET_NOTES_LOCAL":
      return { ...state, notes: action.payload };

    case "SET_CURRENT_ROOM":
      return { ...state, currentRoomId: action.payload };

    case "TEAM_UPDATE":
      return {
        ...state,
        players: action.payload.players.map((p) => ({
          ...p,
          isHost: action.payload.newHostId
            ? p.id === action.payload.newHostId
            : p.isHost,
          currentRoomId:
            state.players.find((sp) => sp.id === p.id)?.currentRoomId ??
            state.rooms[0]?.id ??
            null,
        })),
      };

    case "GAME_END":
      return {
        ...state,
        gameEndData: action.payload,
        session: state.session
          ? { ...state.session, phase: GamePhase.RESULTS }
          : null,
      };

    case "CLEAR_ANSWER_RESULT":
      return { ...state, lastAnswerResult: null };

    case "SOCKET_DISCONNECTED":
      return { ...state, disconnected: true };

    case "SOCKET_RECONNECTED":
      return { ...state, disconnected: false };

    case "ERROR":
      return { ...state, error: action.payload };

    case "RESET":
      return initialState;

    case "SET_SKIP_VOTES":
      return {
        ...state,
        skipVotes: action.skipVotes,
        totalPlayers: action.totalPlayers,
      };

    case "SET_COUNTDOWN":
      return { ...state, timer: null, skipVotes: 0, totalPlayers: 0 };

    default:
      return state;
  }
}

// ─── Context Shape ───────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;

  /** Move to a room */
  moveToRoom: (roomId: string) => void;
  /** Submit a puzzle answer */
  submitAnswer: (puzzleId: string, answer: string) => void;
  /** Request a hint */
  requestHint: (puzzleId: string, hintLevel: HintLevel) => void;
  /** Send a chat message */
  sendChat: (message: string) => void;
  /** Update shared notes */
  updateNotes: (notes: string) => void;
  /** Clear the answer result indicator */
  clearAnswerResult: () => void;
  /** Signal ready to skip countdown */
  signalReady: (roomIndex: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface GameProviderProps {
  sessionId: string;
  children: ReactNode;
}

export function GameProvider({ sessionId, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Join session & register listeners ──
  useEffect(() => {
    socket.emit(JOIN_SESSION, { sessionId });

    const onGameState = (data: {
      session: GameSession;
      players: GamePlayer[];
      rooms: GameRoom[];
      puzzles: GamePuzzle[];
    }) => {
      dispatch({ type: "GAME_STATE_RECEIVED", payload: data });
    };

    const onPlayerJoin = (data: { playerId: string; username: string }) =>
      dispatch({ type: "PLAYER_JOIN", payload: data });

    const onPlayerLeave = (data: { playerId: string }) =>
      dispatch({ type: "PLAYER_LEAVE", payload: data });

    const onPlayerMoved = (data: { playerId: string; roomId: string }) =>
      dispatch({ type: "PLAYER_MOVED", payload: data });

    const onTimerSync = (data: TimerState) =>
      dispatch({ type: "TIMER_SYNC", payload: data });

    const onPuzzleStart = (data: {
      roomIndex: number;
      roomId: string;
      puzzle: PuzzlePublic;
    }) => dispatch({ type: "PUZZLE_START", payload: data });

    const onPuzzleSolved = (data: {
      roomIndex: number;
      roomId: string;
      solvedByPlayerId: string;
      scoreEarned: number;
    }) => dispatch({ type: "PUZZLE_SOLVED", payload: data });

    const onAnswerIncorrect = (data: { puzzleId: string; message: string }) =>
      dispatch({ type: "ANSWER_INCORRECT", payload: data });

    const onPuzzleHint = (data: {
      puzzleId: string;
      hintLevel: string;
      hintText: string;
      scoreDeducted: number;
    }) => dispatch({ type: "PUZZLE_HINT", payload: data });

    const onRoomUnlock = (data: { roomIndex: number; roomId: string }) =>
      dispatch({ type: "ROOM_UNLOCK", payload: data });

    const onScoreUpdate = (data: {
      teamScore: number;
      playerScores: { playerId: string; score: number }[];
    }) => dispatch({ type: "SCORE_UPDATE", payload: data });

    const onChatMessage = (data: ChatMessage) =>
      dispatch({ type: "CHAT_MESSAGE", payload: data });

    const onNotesUpdated = (data: { notes: string }) =>
      dispatch({ type: "NOTES_UPDATED", payload: data });

    const onTeamUpdate = (data: {
      players: GamePlayer[];
      newHostId?: string;
    }) => dispatch({ type: "TEAM_UPDATE", payload: data });

    const onGameEnd = (data: GameState["gameEndData"]) =>
      dispatch({ type: "GAME_END", payload: data });

    const onError = (data: { message: string }) =>
      dispatch({ type: "ERROR", payload: data.message });

    const onSkipCountdown = () => {
      dispatch({ type: "SET_COUNTDOWN", seconds: null });
    };

    const onPlayerReady = (data: {
      playerId: string;
      readyCount: number;
      totalPlayers: number;
    }) => {
      dispatch({
        type: "SET_SKIP_VOTES",
        skipVotes: data.readyCount,
        totalPlayers: data.totalPlayers,
      });
    };

    // Socket disconnect / reconnect handlers
    const onDisconnect = () => {
      dispatch({ type: "SOCKET_DISCONNECTED" });
    };
    const onReconnect = () => {
      dispatch({ type: "SOCKET_RECONNECTED" });
      // Re-join the same session to get fresh state
      socket.emit(JOIN_SESSION, { sessionId });
    };

    socket.on(GAME_STATE, onGameState);
    socket.on(PLAYER_JOIN, onPlayerJoin);
    socket.on(PLAYER_LEAVE, onPlayerLeave);
    socket.on(PLAYER_MOVED, onPlayerMoved);
    socket.on(TIMER_SYNC, onTimerSync);
    socket.on(PUZZLE_START, onPuzzleStart);
    socket.on(PUZZLE_SOLVED, onPuzzleSolved);
    socket.on(ANSWER_INCORRECT, onAnswerIncorrect);
    socket.on(PUZZLE_HINT, onPuzzleHint);
    socket.on(ROOM_UNLOCK, onRoomUnlock);
    socket.on(SCORE_UPDATE, onScoreUpdate);
    socket.on(CHAT_MESSAGE, onChatMessage);
    socket.on(NOTES_UPDATED, onNotesUpdated);
    socket.on(TEAM_UPDATE, onTeamUpdate);
    socket.on(GAME_END, onGameEnd);
    socket.on(ERROR, onError);
    socket.on(SKIP_COUNTDOWN, onSkipCountdown);
    socket.on(PLAYER_READY, onPlayerReady);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onReconnect);

    return () => {
      socket.off(GAME_STATE, onGameState);
      socket.off(PLAYER_JOIN, onPlayerJoin);
      socket.off(PLAYER_LEAVE, onPlayerLeave);
      socket.off(PLAYER_MOVED, onPlayerMoved);
      socket.off(TIMER_SYNC, onTimerSync);
      socket.off(PUZZLE_START, onPuzzleStart);
      socket.off(PUZZLE_SOLVED, onPuzzleSolved);
      socket.off(ANSWER_INCORRECT, onAnswerIncorrect);
      socket.off(PUZZLE_HINT, onPuzzleHint);
      socket.off(ROOM_UNLOCK, onRoomUnlock);
      socket.off(SCORE_UPDATE, onScoreUpdate);
      socket.off(CHAT_MESSAGE, onChatMessage);
      socket.off(NOTES_UPDATED, onNotesUpdated);
      socket.off(TEAM_UPDATE, onTeamUpdate);
      socket.off(GAME_END, onGameEnd);
      socket.off(ERROR, onError);
      socket.off(SKIP_COUNTDOWN, onSkipCountdown);
      socket.off(PLAYER_READY, onPlayerReady);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onReconnect);

      dispatch({ type: "RESET" });
    };
  }, [sessionId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const moveToRoom = useCallback(
    (roomId: string) => {
      dispatch({ type: "SET_CURRENT_ROOM", payload: roomId });
      socket.emit(ROOM_ENTER, { sessionId, roomId });
    },
    [sessionId],
  );

  const submitAnswer = useCallback(
    (puzzleId: string, answer: string) => {
      socket.emit(PUZZLE_ANSWER, { sessionId, puzzleId, answer });
    },
    [sessionId],
  );

  const requestHint = useCallback(
    (puzzleId: string, hintLevel: HintLevel) => {
      socket.emit(REQUEST_HINT, {
        sessionId,
        puzzleId,
        hintLevel,
      });
    },
    [sessionId],
  );

  const sendChat = useCallback(
    (message: string) => {
      socket.emit(SEND_CHAT, { sessionId, message });
    },
    [sessionId],
  );

  const updateNotes = useCallback(
    (notes: string) => {
      dispatch({ type: "SET_NOTES_LOCAL", payload: notes });

      // Debounce 500ms
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
      notesTimerRef.current = setTimeout(() => {
        socket.emit(UPDATE_NOTES, { sessionId, notes });
      }, 500);
    },
    [sessionId],
  );

  const clearAnswerResult = useCallback(() => {
    dispatch({ type: "CLEAR_ANSWER_RESULT" });
  }, []);

  const signalReady = useCallback(
    (roomIndex: number) => {
      socket.emit(PLAYER_READY, { sessionId, roomIndex });
    },
    [sessionId],
  );

  return (
    <GameContext.Provider
      value={{
        state,
        moveToRoom,
        submitAnswer,
        requestHint,
        sendChat,
        updateNotes,
        clearAnswerResult,
        signalReady,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a <GameProvider>");
  }
  return ctx;
}
