// ============================================================================
// TECH HUNT — Game Socket Event Handlers
// Handles all real-time game events: joining sessions, moving between rooms,
// answering puzzles, requesting hints, chatting, and shared notes.
//
// RULES ENFORCED:
//   1. Never send PuzzleInternal (answer) to the client.
//   2. All scoring is server-side — clients only receive results.
//   3. Countdown dedup — one timer per room, never two.
//   4. Already-solved guard — a solved puzzle cannot be re-answered.
//   5. Validate answer server-side and emit PUZZLE_SOLVED or ANSWER_INCORRECT.
//   6. Unlock the next sequential room after a correct solve.
//   7. Emit GAME_END when the last room is solved.
//   8. Use shared constants — never hard-code event names or score values.
// ============================================================================

import { Server, Socket } from "socket.io";
import {
  SocketEvents,
  RoomStatus,
  GamePhase,
  PlayerRole,
  HintLevel,
} from "@techhunt/shared";
import type { JwtPayload, PuzzleInternal } from "@techhunt/shared";

import { pool } from "../db/pool.js";
import {
  generateBuilding,
  regeneratePuzzleForRoom,
  toPuzzlePublic,
  toBuildingPublic,
  validateAnswer,
  calculateScore,
  calculateHintPenalty,
} from "../engine/index.js";
import {
  startCountdown,
  cancelCountdown,
  isCountdownActive,
  clearAllForSession,
  markPlayerReady,
  getReadyCount,
} from "./countdownManager.js";

// ─── In-Memory Session Runtime ───────────────────────────────────────────────

/** Simple HTML tag stripper — prevents XSS in chat / notes. */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/** Per-socket rate limiter for high-frequency events (answer, chat). */
const socketRateLimits = new Map<string, Map<string, number[]>>();

function isRateLimited(
  socketId: string,
  event: string,
  maxPerWindow: number,
  windowMs: number,
): boolean {
  if (!socketRateLimits.has(socketId)) {
    socketRateLimits.set(socketId, new Map());
  }
  const socketMap = socketRateLimits.get(socketId)!;
  const now = Date.now();
  const timestamps = (socketMap.get(event) ?? []).filter(
    (t) => now - t < windowMs,
  );
  if (timestamps.length >= maxPerWindow) return true;
  timestamps.push(now);
  socketMap.set(event, timestamps);
  return false;
}

function clearRateLimits(socketId: string): void {
  socketRateLimits.delete(socketId);
}

/**
 * Volatile state that lives only while at least one socket is connected to a
 * session. Rebuilt on the first join (or reconnect) from DB + engine.
 */
interface SessionRuntime {
  buildingSeed: number;
  teamId: string;
  totalRooms: number;

  /** Room status indexed by roomIndex (0-based). */
  roomStatuses: RoomStatus[];

  /** Bidirectional room-id ↔ index maps. */
  roomIdToIndex: Map<string, number>;
  roomIndexToId: Map<number, string>;

  /** Which rooms have been solved. */
  solvedRooms: Set<number>;

  /** Which room each player is currently in (userId → roomId). */
  playerRooms: Map<string, string>;

  /** Tracks active (unsolved, countdown-expired) puzzles: puzzleId → roomIndex. */
  activePuzzles: Map<string, number>;

  /** Puzzle activation timestamps, mirrored from DB for fast lookup. */
  puzzleActivatedAt: Map<number, Date>;
}

/** Session runtime cache — rebuilt lazily on first join. */
const sessions = new Map<string, SessionRuntime>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HINT_LEVEL_TO_INDEX: Record<string, number> = {
  [HintLevel.SMALL]: 0,
  [HintLevel.MEDIUM]: 1,
  [HintLevel.LARGE]: 2,
};

function userFromSocket(socket: Socket): JwtPayload | null {
  return (socket.data?.user as JwtPayload) ?? null;
}

function sessionIdFromSocket(socket: Socket): string | null {
  return (socket.data?.sessionId as string) ?? null;
}

/**
 * Lazily creates (or returns the cached) runtime for a session.
 * Rebuilds room state from the engine + DB `puzzle_attempts`.
 */
async function getOrCreateRuntime(
  sessionId: string,
  buildingSeed: number,
  teamId: string,
): Promise<SessionRuntime> {
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  // 1. Generate the building from the deterministic seed
  const gen = generateBuilding(buildingSeed);
  const totalRooms = gen.building.rooms.length;

  // 2. Fetch already-solved rooms from DB
  const { rows: solvedRows } = await pool.query<{ room_index: number }>(
    `SELECT DISTINCT room_index FROM puzzle_attempts
       WHERE session_id = $1 AND correct = true`,
    [sessionId],
  );
  const solvedRooms = new Set<number>(solvedRows.map((r) => r.room_index));

  // 3. Compute room statuses
  const roomStatuses: RoomStatus[] = [];
  const roomIdToIndex = new Map<string, number>();
  const roomIndexToId = new Map<number, string>();

  for (let i = 0; i < totalRooms; i++) {
    const room = gen.building.rooms[i];
    roomIdToIndex.set(room.id, i);
    roomIndexToId.set(i, room.id);

    if (solvedRooms.has(i)) {
      roomStatuses.push(RoomStatus.COMPLETED);
    } else if (i === 0 || solvedRooms.has(i - 1)) {
      roomStatuses.push(RoomStatus.UNLOCKED);
    } else {
      roomStatuses.push(RoomStatus.LOCKED);
    }
  }

  // 4. Build active-puzzle map from unsolved UNLOCKED rooms with a recorded
  //    puzzle_activated_at (means countdown already expired in a prior connection)
  const activePuzzles = new Map<string, number>();
  const puzzleActivatedAt = new Map<number, Date>();

  // Check if there's a pending puzzle activation stored on the session
  const { rows: sessRows } = await pool.query<{
    puzzle_activated_at: string | null;
  }>(`SELECT puzzle_activated_at FROM game_sessions WHERE id = $1`, [
    sessionId,
  ]);
  if (sessRows[0]?.puzzle_activated_at) {
    // Find the first unsolved, unlocked room — that's the one being worked on
    for (let i = 0; i < totalRooms; i++) {
      if (roomStatuses[i] === RoomStatus.UNLOCKED && !solvedRooms.has(i)) {
        const puzzle = regeneratePuzzleForRoom(buildingSeed, i);
        activePuzzles.set(puzzle.id, i);
        puzzleActivatedAt.set(i, new Date(sessRows[0].puzzle_activated_at));
        break;
      }
    }
  }

  const runtime: SessionRuntime = {
    buildingSeed,
    teamId,
    totalRooms,
    roomStatuses,
    roomIdToIndex,
    roomIndexToId,
    solvedRooms,
    playerRooms: new Map(),
    activePuzzles,
    puzzleActivatedAt,
  };

  sessions.set(sessionId, runtime);
  return runtime;
}

// ─── Score Helpers ───────────────────────────────────────────────────────────

async function addIndividualScore(
  userId: string,
  teamId: string,
  points: number,
): Promise<void> {
  await pool.query(
    `UPDATE team_members
        SET individual_score = individual_score + $1
      WHERE user_id = $2 AND team_id = $3`,
    [points, userId, teamId],
  );
}

async function addTeamScore(teamId: string, points: number): Promise<void> {
  await pool.query(
    `UPDATE teams SET team_score = team_score + $1 WHERE id = $2`,
    [points, teamId],
  );
}

async function deductIndividualScore(
  userId: string,
  teamId: string,
  penalty: number,
): Promise<void> {
  await pool.query(
    `UPDATE team_members
        SET individual_score = GREATEST(0, individual_score - $1)
      WHERE user_id = $2 AND team_id = $3`,
    [penalty, userId, teamId],
  );
}

/** Returns an object suitable for the SCORE_UPDATE payload. */
async function buildScorePayload(teamId: string) {
  const { rows: teamRows } = await pool.query<{ team_score: number }>(
    `SELECT team_score FROM teams WHERE id = $1`,
    [teamId],
  );
  const { rows: playerRows } = await pool.query<{
    user_id: string;
    individual_score: number;
  }>(`SELECT user_id, individual_score FROM team_members WHERE team_id = $1`, [
    teamId,
  ]);

  return {
    teamScore: teamRows[0]?.team_score ?? 0,
    playerScores: playerRows.map((p) => ({
      playerId: p.user_id,
      score: p.individual_score,
    })),
  };
}

// ─── Game End ────────────────────────────────────────────────────────────────

async function endGame(io: Server, sessionId: string, runtime: SessionRuntime) {
  // Double-trigger guard: check phase is not already RESULTS
  const { rows: checkRows } = await pool.query<{ phase: string }>(
    `SELECT phase FROM game_sessions WHERE id = $1`,
    [sessionId],
  );
  if (checkRows.length === 0 || checkRows[0].phase === GamePhase.RESULTS) {
    return; // already ended or missing
  }

  // 1. Update session phase & ended_at
  await pool.query(
    `UPDATE game_sessions
        SET phase = $1, ended_at = NOW()
      WHERE id = $2 AND phase != $1`,
    [GamePhase.RESULTS, sessionId],
  );

  // 2. Clear all running timers
  clearAllForSession(sessionId);

  // 3. Build final scoreboard
  const scores = await buildScorePayload(runtime.teamId);

  const { rows: playerRows } = await pool.query<{
    user_id: string;
    username: string;
    individual_score: number;
    role: string;
  }>(
    `SELECT tm.user_id, u.username, tm.individual_score, tm.role
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
      ORDER BY tm.individual_score DESC`,
    [runtime.teamId],
  );

  // 4. Broadcast GAME_END
  io.to(sessionId).emit(SocketEvents.GAME_END, {
    teamScore: scores.teamScore,
    players: playerRows.map((p) => ({
      id: p.user_id,
      username: p.username,
      individualScore: p.individual_score,
      role: p.role,
    })),
  });

  // 5. Update team's completion_time for leaderboard ranking
  try {
    const { rows: sessTime } = await pool.query<{
      started_at: string;
      ended_at: string;
    }>(`SELECT started_at, ended_at FROM game_sessions WHERE id = $1`, [
      sessionId,
    ]);
    if (sessTime.length > 0 && sessTime[0].ended_at) {
      const start = new Date(sessTime[0].started_at).getTime();
      const end = new Date(sessTime[0].ended_at).getTime();
      const completionSeconds = Math.max(0, Math.floor((end - start) / 1000));
      await pool.query(`UPDATE teams SET completion_time = $1 WHERE id = $2`, [
        completionSeconds,
        runtime.teamId,
      ]);
    }
  } catch (err) {
    console.error("[socket] Failed to update completion_time:", err);
  }

  // 6. Cleanup runtime (sockets will leave the room on their own)
  sessions.delete(sessionId);
}

// ─── Event Registrations ─────────────────────────────────────────────────────

/**
 * Registers all game-related socket event listeners on the given socket.
 * Called once per connection from the socket/index.ts init handler.
 */
export function registerGameEvents(io: Server, socket: Socket): void {
  // ────────────────────────────────────────────────────────────────────────
  // EVENT: join_session
  // ────────────────────────────────────────────────────────────────────────
  socket.on(SocketEvents.JOIN_SESSION, async (data: { sessionId: string }) => {
    try {
      const user = userFromSocket(socket);
      const { sessionId } = data;

      // 1. Validate session exists
      const { rows: sessRows } = await pool.query<{
        id: string;
        team_id: string;
        building_seed: number;
        phase: string;
        started_at: string;
        notes: string;
        is_resumable: boolean;
      }>(
        `SELECT id, team_id, building_seed, phase, started_at, notes, is_resumable
             FROM game_sessions WHERE id = $1`,
        [sessionId],
      );

      if (sessRows.length === 0) {
        socket.emit(SocketEvents.ERROR, {
          message: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
        return;
      }

      const session = sessRows[0];

      // 2. Validate membership (skip for guests)
      if (user) {
        const { rows: memberRows } = await pool.query(
          `SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2`,
          [user.userId, session.team_id],
        );
        if (memberRows.length === 0) {
          socket.emit(SocketEvents.ERROR, {
            message: "You are not a member of this team",
            code: "NOT_TEAM_MEMBER",
          });
          return;
        }
      }

      // 3. Join the socket.io room for this session
      socket.join(sessionId);
      socket.data.sessionId = sessionId;

      // 4. Build / cache the runtime state
      const runtime = await getOrCreateRuntime(
        sessionId,
        session.building_seed,
        session.team_id,
      );

      // 5. Generate the public building view
      const gen = generateBuilding(session.building_seed);
      const publicData = toBuildingPublic(gen);

      // Override room statuses with the runtime (may differ from engine defaults)
      const rooms = gen.building.rooms.map((room, idx) => ({
        id: room.id,
        buildingId: room.buildingId,
        floor: room.floor,
        position: room.position,
        status: runtime.roomStatuses[idx],
        puzzleType: room.puzzleType,
        seed: room.seed,
      }));

      // 6. Get solved-room info
      const { rows: solvedRows } = await pool.query<{
        room_index: number;
        player_id: string;
      }>(
        `SELECT DISTINCT ON (room_index) room_index, player_id
             FROM puzzle_attempts
            WHERE session_id = $1 AND correct = true
            ORDER BY room_index, attempted_at ASC`,
        [sessionId],
      );
      const solvedByRoom = new Map<number, string>();
      for (const row of solvedRows) {
        solvedByRoom.set(row.room_index, row.player_id);
      }

      // 7. Build puzzle list (public only — no answers)
      const puzzles = gen.building.rooms.map((room, idx) => {
        const pub = publicData.puzzles[room.id];
        return {
          id: pub.id,
          roomId: pub.roomId,
          type: pub.type,
          difficulty: pub.difficulty,
          timeLimit: pub.timeLimit,
          prompt: pub.prompt,
          hints: pub.hints,
          isSolved: runtime.solvedRooms.has(idx),
          solvedByPlayerId: solvedByRoom.get(idx) ?? null,
        };
      });

      // 8. Get player list
      const { rows: playerRows } = await pool.query<{
        user_id: string;
        username: string;
        role: string;
        individual_score: number;
      }>(
        `SELECT tm.user_id, u.username, tm.role, tm.individual_score
             FROM team_members tm
             JOIN users u ON u.id = tm.user_id
            WHERE tm.team_id = $1`,
        [session.team_id],
      );

      const players = playerRows.map((p) => ({
        id: p.user_id,
        username: p.username,
        individualScore: p.individual_score,
        isHost: p.role === PlayerRole.LEADER,
        currentRoomId:
          runtime.playerRooms.get(p.user_id) ?? rooms[0]?.id ?? null,
      }));

      // Track the joining player's room
      if (user) {
        const currentRoom = runtime.playerRooms.get(user.userId);
        if (!currentRoom) {
          runtime.playerRooms.set(user.userId, rooms[0]?.id ?? "");
        }
      }

      // 9. Emit full game state to THIS socket
      socket.emit(SocketEvents.GAME_STATE, {
        session: {
          id: session.id,
          teamId: session.team_id,
          phase: session.phase,
          startedAt: session.started_at,
          notes: session.notes,
        },
        players,
        rooms,
        puzzles,
      });

      // 10. Broadcast join to others in the session
      if (user) {
        socket.to(sessionId).emit(SocketEvents.PLAYER_JOIN, {
          playerId: user.userId,
          username: user.username,
        });
      }

      console.log(
        `[socket] ${user?.username ?? "guest"} joined session ${sessionId}`,
      );
    } catch (err) {
      console.error("[socket] join_session error:", err);
      socket.emit(SocketEvents.ERROR, {
        message: "Failed to join session",
        code: "JOIN_ERROR",
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: player_move (ROOM_ENTER)
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.ROOM_ENTER,
    async (data: { sessionId: string; roomId: string }) => {
      try {
        const user = userFromSocket(socket);
        if (!user) {
          socket.emit(SocketEvents.ERROR, {
            message: "Authentication required",
            code: "AUTH_REQUIRED",
          });
          return;
        }

        const { sessionId, roomId } = data;
        const runtime = sessions.get(sessionId);
        if (!runtime) {
          socket.emit(SocketEvents.ERROR, {
            message: "Session not active",
            code: "SESSION_NOT_ACTIVE",
          });
          return;
        }

        // 1. Resolve roomIndex
        const roomIndex = runtime.roomIdToIndex.get(roomId);
        if (roomIndex === undefined) {
          socket.emit(SocketEvents.ERROR, {
            message: "Room not found",
            code: "ROOM_NOT_FOUND",
          });
          return;
        }

        // 2. Check that the room is not locked
        if (runtime.roomStatuses[roomIndex] === RoomStatus.LOCKED) {
          socket.emit(SocketEvents.ERROR, {
            message: "Room is locked",
            code: "ROOM_LOCKED",
          });
          return;
        }

        // 3. Update player position
        runtime.playerRooms.set(user.userId, roomId);

        // 4. Broadcast movement
        io.to(sessionId).emit(SocketEvents.PLAYER_MOVED, {
          playerId: user.userId,
          roomId,
        });

        // 5. If room has an unsolved puzzle and no countdown is running → start
        if (
          !runtime.solvedRooms.has(roomIndex) &&
          !isCountdownActive(sessionId, roomIndex) &&
          !runtime.puzzleActivatedAt.has(roomIndex)
        ) {
          startCountdown(io, sessionId, roomIndex, async (sid, rIdx) => {
            // ── Countdown expired — activate the puzzle ──
            const now = new Date();

            // Update DB
            await pool.query(
              `UPDATE game_sessions SET puzzle_activated_at = $1 WHERE id = $2`,
              [now, sid],
            );

            // Cache activation time
            const rt = sessions.get(sid);
            if (rt) rt.puzzleActivatedAt.set(rIdx, now);

            // Generate public puzzle (no answer) and broadcast
            const puzzle = regeneratePuzzleForRoom(runtime.buildingSeed, rIdx);
            const pubPuzzle = toPuzzlePublic(puzzle);

            // Track active puzzle
            if (rt) rt.activePuzzles.set(puzzle.id, rIdx);

            io.to(sid).emit(SocketEvents.PUZZLE_START, {
              roomIndex: rIdx,
              roomId: runtime.roomIndexToId.get(rIdx),
              puzzle: pubPuzzle,
            });

            console.log(
              `[socket] Puzzle activated: session=${sid} room=${rIdx}`,
            );
          });
        }

        // 6. Mark this player as ready (arriving counts as ready for skip)
        if (
          !runtime.solvedRooms.has(roomIndex) &&
          isCountdownActive(sessionId, roomIndex)
        ) {
          const { rows: memberCount } = await pool.query<{ count: string }>(
            `SELECT count(*)::text AS count FROM team_members WHERE team_id = $1`,
            [runtime.teamId],
          );
          const totalPlayers = parseInt(memberCount[0]?.count ?? "1", 10);
          const readyCount = markPlayerReady(
            io,
            sessionId,
            roomIndex,
            user.userId,
            totalPlayers,
          );

          // Broadcast ready count to all players
          if (readyCount > 0) {
            io.to(sessionId).emit(SocketEvents.PLAYER_READY, {
              playerId: user.userId,
              readyCount,
              totalPlayers,
            });
          }
        }

        console.log(
          `[socket] ${user.username} moved to room ${roomId} (idx=${roomIndex})`,
        );
      } catch (err) {
        console.error("[socket] player_move error:", err);
        socket.emit(SocketEvents.ERROR, {
          message: "Failed to move",
          code: "MOVE_ERROR",
        });
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: submit_answer (PUZZLE_ANSWER)
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.PUZZLE_ANSWER,
    async (data: { sessionId: string; puzzleId: string; answer: string }) => {
      try {
        const user = userFromSocket(socket);
        if (!user) {
          socket.emit(SocketEvents.ERROR, {
            message: "Authentication required",
            code: "AUTH_REQUIRED",
          });
          return;
        }

        // Rate limit: max 10 answer attempts per 30 seconds
        if (isRateLimited(socket.id, "answer", 10, 30_000)) {
          socket.emit(SocketEvents.ERROR, {
            message: "Too many attempts — slow down",
            code: "RATE_LIMITED",
          });
          return;
        }

        const { sessionId, puzzleId, answer } = data;
        const runtime = sessions.get(sessionId);
        if (!runtime) {
          socket.emit(SocketEvents.ERROR, {
            message: "Session not active",
            code: "SESSION_NOT_ACTIVE",
          });
          return;
        }

        // 1. Resolve room from active puzzle
        const roomIndex = runtime.activePuzzles.get(puzzleId);
        if (roomIndex === undefined) {
          socket.emit(SocketEvents.ERROR, {
            message: "Puzzle is not active",
            code: "PUZZLE_NOT_ACTIVE",
          });
          return;
        }

        // 2. Already-solved guard
        if (runtime.solvedRooms.has(roomIndex)) {
          socket.emit(SocketEvents.ERROR, {
            message: "Puzzle already solved",
            code: "PUZZLE_ALREADY_SOLVED",
          });
          return;
        }

        // 3. Regenerate the server-side puzzle (contains correct answer)
        const puzzle: PuzzleInternal = regeneratePuzzleForRoom(
          runtime.buildingSeed,
          roomIndex,
        );

        // 4. Validate answer
        const isCorrect = validateAnswer(answer, puzzle.answer);

        // 5. Record the attempt in DB
        await pool.query(
          `INSERT INTO puzzle_attempts
             (session_id, player_id, room_index, puzzle_seed, answer, correct)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sessionId, user.userId, roomIndex, puzzle.seed, answer, isCorrect],
        );

        if (!isCorrect) {
          // ── Wrong answer ──
          socket.emit(SocketEvents.ANSWER_INCORRECT, {
            puzzleId,
            message: "Incorrect answer — try again!",
          });
          return;
        }

        // ── Correct answer ──────────────────────────────────────────────

        // 6. Calculate score
        const activatedAt = runtime.puzzleActivatedAt.get(roomIndex);
        const solveTimeMs = activatedAt
          ? Date.now() - activatedAt.getTime()
          : 0;
        const solveTimeSec = Math.max(0, Math.floor(solveTimeMs / 1000));
        const scoreEarned = calculateScore(solveTimeSec, []);

        // 7. Award points
        await addIndividualScore(user.userId, runtime.teamId, scoreEarned);
        await addTeamScore(runtime.teamId, scoreEarned);

        // 8. Mark room solved
        runtime.solvedRooms.add(roomIndex);
        runtime.roomStatuses[roomIndex] = RoomStatus.COMPLETED;
        runtime.activePuzzles.delete(puzzleId);
        runtime.puzzleActivatedAt.delete(roomIndex);

        // Cancel any remaining countdown for this room
        cancelCountdown(sessionId, roomIndex);

        // Clear puzzle_activated_at in DB
        await pool.query(
          `UPDATE game_sessions SET puzzle_activated_at = NULL WHERE id = $1`,
          [sessionId],
        );

        // 9. Broadcast PUZZLE_SOLVED (no answer leaked)
        io.to(sessionId).emit(SocketEvents.PUZZLE_SOLVED, {
          roomIndex,
          roomId: runtime.roomIndexToId.get(roomIndex),
          solvedByPlayerId: user.userId,
          scoreEarned,
        });

        // 10. Emit updated scores
        const scores = await buildScorePayload(runtime.teamId);
        io.to(sessionId).emit(SocketEvents.SCORE_UPDATE, scores);

        // 11. Unlock next room (or end game)
        const nextRoomIndex = roomIndex + 1;

        if (nextRoomIndex >= runtime.totalRooms) {
          // ── Final room solved — end the game ──
          await endGame(io, sessionId, runtime);
        } else {
          // Unlock the next room
          runtime.roomStatuses[nextRoomIndex] = RoomStatus.UNLOCKED;

          io.to(sessionId).emit(SocketEvents.ROOM_UNLOCK, {
            roomIndex: nextRoomIndex,
            roomId: runtime.roomIndexToId.get(nextRoomIndex),
          });
        }

        console.log(
          `[socket] Puzzle solved: session=${sessionId} room=${roomIndex} by=${user.username} score=${scoreEarned}`,
        );
      } catch (err) {
        console.error("[socket] submit_answer error:", err);
        socket.emit(SocketEvents.ERROR, {
          message: "Failed to submit answer",
          code: "ANSWER_ERROR",
        });
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: request_hint
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.REQUEST_HINT,
    async (data: {
      sessionId: string;
      puzzleId: string;
      hintLevel: HintLevel;
    }) => {
      try {
        const user = userFromSocket(socket);
        if (!user) {
          socket.emit(SocketEvents.ERROR, {
            message: "Authentication required",
            code: "AUTH_REQUIRED",
          });
          return;
        }

        const { sessionId, puzzleId, hintLevel } = data;
        const runtime = sessions.get(sessionId);
        if (!runtime) {
          socket.emit(SocketEvents.ERROR, {
            message: "Session not active",
            code: "SESSION_NOT_ACTIVE",
          });
          return;
        }

        const roomIndex = runtime.activePuzzles.get(puzzleId);
        if (roomIndex === undefined) {
          socket.emit(SocketEvents.ERROR, {
            message: "Puzzle is not active",
            code: "PUZZLE_NOT_ACTIVE",
          });
          return;
        }

        // 1. Check if this hint level was already used for this room
        const { rows: usedRows } = await pool.query(
          `SELECT 1 FROM hint_usage
            WHERE session_id = $1 AND room_index = $2 AND hint_level = $3`,
          [sessionId, roomIndex, hintLevel],
        );
        if (usedRows.length > 0) {
          socket.emit(SocketEvents.ERROR, {
            message: "This hint level has already been used",
            code: "HINT_ALREADY_USED",
          });
          return;
        }

        // 2. Generate the puzzle to get the hint text
        const puzzle = regeneratePuzzleForRoom(runtime.buildingSeed, roomIndex);
        const hintIndex = HINT_LEVEL_TO_INDEX[hintLevel];
        if (hintIndex === undefined || !puzzle.hints[hintIndex]) {
          socket.emit(SocketEvents.ERROR, {
            message: "Invalid hint level",
            code: "INVALID_HINT_LEVEL",
          });
          return;
        }
        const hintText = puzzle.hints[hintIndex];

        // 3. Calculate and apply penalty
        const penalty = calculateHintPenalty(hintLevel);
        await deductIndividualScore(user.userId, runtime.teamId, penalty);

        // 4. Record hint usage
        await pool.query(
          `INSERT INTO hint_usage
             (session_id, team_id, room_index, hint_level, penalty)
           VALUES ($1, $2, $3, $4, $5)`,
          [sessionId, runtime.teamId, roomIndex, hintLevel, penalty],
        );

        // 5. Emit hint to requester only
        socket.emit(SocketEvents.PUZZLE_HINT, {
          puzzleId,
          hintLevel,
          hintText,
          scoreDeducted: penalty,
        });

        // 6. Emit updated scores
        const scores = await buildScorePayload(runtime.teamId);
        io.to(sessionId).emit(SocketEvents.SCORE_UPDATE, scores);

        console.log(
          `[socket] Hint requested: session=${sessionId} room=${roomIndex} level=${hintLevel} by=${user.username} penalty=${penalty}`,
        );
      } catch (err) {
        console.error("[socket] request_hint error:", err);
        socket.emit(SocketEvents.ERROR, {
          message: "Failed to get hint",
          code: "HINT_ERROR",
        });
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: send_chat
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.SEND_CHAT,
    (data: { sessionId: string; message: string }) => {
      try {
        const user = userFromSocket(socket);
        const { sessionId, message } = data;

        if (!message || typeof message !== "string") return;

        // Rate limit: max 15 messages per 30 seconds
        if (isRateLimited(socket.id, "chat", 15, 30_000)) return;

        // Sanitize and truncate
        const trimmed = stripHtml(message).slice(0, 500);

        io.to(sessionId).emit(SocketEvents.CHAT_MESSAGE, {
          senderId: user?.userId ?? null,
          senderName: user?.username ?? "Guest",
          message: trimmed,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[socket] send_chat error:", err);
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: update_notes
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.UPDATE_NOTES,
    async (data: { sessionId: string; notes: string }) => {
      try {
        const user = userFromSocket(socket);
        if (!user) {
          socket.emit(SocketEvents.ERROR, {
            message: "Authentication required",
            code: "AUTH_REQUIRED",
          });
          return;
        }

        const { sessionId, notes } = data;

        // Sanitize notes — strip HTML tags, limit length
        const sanitized = stripHtml(notes).slice(0, 5000);

        // Persist notes on the game session (not the team)
        await pool.query(`UPDATE game_sessions SET notes = $1 WHERE id = $2`, [
          sanitized,
          sessionId,
        ]);

        // Broadcast to everyone EXCEPT the sender
        socket.to(sessionId).emit(SocketEvents.NOTES_UPDATED, {
          notes: sanitized,
          updatedBy: user.userId,
        });
      } catch (err) {
        console.error("[socket] update_notes error:", err);
        socket.emit(SocketEvents.ERROR, {
          message: "Failed to update notes",
          code: "NOTES_ERROR",
        });
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────────
  // EVENT: player_ready (PLAYER_READY)
  // ────────────────────────────────────────────────────────────────────────
  socket.on(
    SocketEvents.PLAYER_READY,
    async (data: { sessionId: string; roomIndex: number }) => {
      try {
        const user = userFromSocket(socket);
        if (!user) return;

        const { sessionId, roomIndex } = data;
        const runtime = sessions.get(sessionId);
        if (!runtime) return;

        // Ignore if room is already solved
        if (runtime.solvedRooms.has(roomIndex)) return;

        // Ignore if no countdown is active (already expired or not started)
        if (!isCountdownActive(sessionId, roomIndex)) return;

        const { rows: memberCount } = await pool.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM team_members WHERE team_id = $1`,
          [runtime.teamId],
        );
        const totalPlayers = parseInt(memberCount[0]?.count ?? "1", 10);
        const readyCount = markPlayerReady(
          io,
          sessionId,
          roomIndex,
          user.userId,
          totalPlayers,
        );

        // Broadcast ready count to all players
        if (readyCount > 0) {
          io.to(sessionId).emit(SocketEvents.PLAYER_READY, {
            playerId: user.userId,
            readyCount,
            totalPlayers,
          });
        }
      } catch (err) {
        console.error("[socket] player_ready error:", err);
      }
    },
  );
}

// ─── Disconnect Handler ──────────────────────────────────────────────────────

/**
 * Called when a socket disconnects. Broadcasts the leave event and, if the
 * disconnecting player was the host, reassigns leadership to the next member.
 */
export async function handleDisconnect(
  io: Server,
  socket: Socket,
): Promise<void> {
  const user = userFromSocket(socket);
  const sessionId = sessionIdFromSocket(socket);

  console.log(
    `[socket] disconnected: ${user?.username ?? "guest"} (${socket.id})`,
  );

  // Clean up rate limit tracking for this socket
  clearRateLimits(socket.id);

  if (!user || !sessionId) return;

  // 1. Broadcast leave
  io.to(sessionId).emit(SocketEvents.PLAYER_LEAVE, {
    playerId: user.userId,
  });

  // 2. Clean up player-room tracking
  const runtime = sessions.get(sessionId);
  if (runtime) {
    runtime.playerRooms.delete(user.userId);
  }

  // 3. Check if the disconnecting player was the host
  try {
    const { rows } = await pool.query<{
      role: string;
      team_id: string;
      phase: string;
    }>(
      `SELECT tm.role, gs.team_id, gs.phase
         FROM team_members tm
         JOIN game_sessions gs ON gs.team_id = tm.team_id
        WHERE tm.user_id = $1 AND gs.id = $2`,
      [user.userId, sessionId],
    );

    if (rows.length === 0) return;

    const { role, team_id, phase } = rows[0];

    if (role === PlayerRole.LEADER && phase !== GamePhase.RESULTS) {
      // Find the next member by earliest joined_at
      const { rows: nextRows } = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM team_members
          WHERE team_id = $1 AND user_id != $2
          ORDER BY joined_at ASC
          LIMIT 1`,
        [team_id, user.userId],
      );

      if (nextRows.length > 0) {
        const newLeaderId = nextRows[0].user_id;

        // Transfer leadership
        await pool.query(
          `UPDATE team_members SET role = $1 WHERE user_id = $2 AND team_id = $3`,
          [PlayerRole.MEMBER, user.userId, team_id],
        );
        await pool.query(
          `UPDATE team_members SET role = $1 WHERE user_id = $2 AND team_id = $3`,
          [PlayerRole.LEADER, newLeaderId, team_id],
        );

        // Build updated player list
        const { rows: playerRows } = await pool.query<{
          user_id: string;
          username: string;
          role: string;
          individual_score: number;
        }>(
          `SELECT tm.user_id, u.username, tm.role, tm.individual_score
             FROM team_members tm
             JOIN users u ON u.id = tm.user_id
            WHERE tm.team_id = $1`,
          [team_id],
        );

        io.to(sessionId).emit(SocketEvents.TEAM_UPDATE, {
          players: playerRows.map((p) => ({
            id: p.user_id,
            username: p.username,
            role: p.role,
            individualScore: p.individual_score,
          })),
          newHostId: newLeaderId,
        });

        console.log(
          `[socket] Host reassigned: ${user.userId} → ${newLeaderId} in session ${sessionId}`,
        );
      }
    }

    // 4. If no players remain in the session room, clean up
    const room = io.sockets.adapter.rooms.get(sessionId);
    if (!room || room.size === 0) {
      clearAllForSession(sessionId);
      sessions.delete(sessionId);
      console.log(
        `[socket] Session ${sessionId} cleaned up (no players remaining)`,
      );
    }
  } catch (err) {
    console.error("[socket] disconnect handler error:", err);
  }
}
