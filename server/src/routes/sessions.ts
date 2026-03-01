// ============================================================================
// TECH HUNT Server — Game Session Routes
// REST endpoints for session lifecycle: create, get, update, notes.
// Sessions track a team's run through a procedurally generated building.
// ============================================================================

import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";
import { GamePhase, SessionType } from "@techhunt/shared";

const router = Router();

// All session routes require authentication
router.use(authenticate);

// ─── POST /api/sessions — Start a new game session ──────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.body;
    const userId = req.user!.userId;

    if (!teamId) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "teamId is required",
      });
      return;
    }

    // Verify membership
    const membership = await pool.query(
      "SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId],
    );

    if (membership.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You are not a member of this team",
      });
      return;
    }

    // Check the team's session type for resumability
    const teamResult = await pool.query(
      "SELECT session_type FROM teams WHERE id = $1",
      [teamId],
    );

    if (teamResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Team not found",
      });
      return;
    }

    const isSolo = teamResult.rows[0].session_type === SessionType.SOLO;

    // Check for existing active sessions
    const activeSession = await pool.query(
      `SELECT id, phase FROM game_sessions
       WHERE team_id = $1 AND ended_at IS NULL`,
      [teamId],
    );

    if (activeSession.rows.length > 0) {
      // Solo runs can be resumed, so return the existing session
      if (isSolo) {
        const session = activeSession.rows[0];
        res.json({
          success: true,
          data: {
            id: session.id,
            message: "Resuming existing solo session",
            resumed: true,
          },
        });
        return;
      }

      // Multiplayer sessions cannot be resumed — reject
      res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "Team already has an active session",
      });
      return;
    }

    // Generate a random building seed
    const buildingSeed = Math.floor(Math.random() * 2147483647);

    const result = await pool.query(
      `INSERT INTO game_sessions (team_id, building_seed, phase, is_resumable)
       VALUES ($1, $2, $3, $4)
       RETURNING id, team_id, building_seed, phase, started_at, ended_at, notes, is_resumable`,
      [teamId, buildingSeed, GamePhase.LOBBY, isSolo],
    );

    const session = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: session.id,
        teamId: session.team_id,
        buildingSeed: session.building_seed,
        phase: session.phase,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        notes: session.notes,
        isResumable: session.is_resumable,
        resumed: false,
      },
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to create game session",
    });
  }
});

// ─── GET /api/sessions/:id — Get session details ────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT gs.id, gs.team_id, gs.building_seed, gs.phase,
              gs.started_at, gs.ended_at, gs.notes, gs.is_resumable
       FROM game_sessions gs
       JOIN team_members tm ON tm.team_id = gs.team_id
       WHERE gs.id = $1 AND tm.user_id = $2`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Session not found or you are not a team member",
      });
      return;
    }

    const session = result.rows[0];

    // Also fetch puzzle attempts and hint usage for this session
    const attempts = await pool.query(
      `SELECT pa.id, pa.player_id, u.username, pa.room_index,
              pa.puzzle_seed, pa.answer, pa.correct, pa.attempted_at
       FROM puzzle_attempts pa
       JOIN users u ON u.id = pa.player_id
       WHERE pa.session_id = $1
       ORDER BY pa.attempted_at ASC`,
      [id],
    );

    const hints = await pool.query(
      `SELECT id, room_index, hint_level, penalty, used_at
       FROM hint_usage
       WHERE session_id = $1
       ORDER BY used_at ASC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        id: session.id,
        teamId: session.team_id,
        buildingSeed: session.building_seed,
        phase: session.phase,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        notes: session.notes,
        isResumable: session.is_resumable,
        attempts: attempts.rows.map((a) => ({
          id: a.id,
          playerId: a.player_id,
          username: a.username,
          roomIndex: a.room_index,
          puzzleSeed: a.puzzle_seed,
          answer: a.answer,
          correct: a.correct,
          attemptedAt: a.attempted_at,
        })),
        hints: hints.rows.map((h) => ({
          id: h.id,
          roomIndex: h.room_index,
          hintLevel: h.hint_level,
          penalty: h.penalty,
          usedAt: h.used_at,
        })),
      },
    });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to fetch session",
    });
  }
});

// ─── PATCH /api/sessions/:id/phase — Update session phase ───────────────────

router.patch("/:id/phase", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;
    const userId = req.user!.userId;

    // Validate phase
    const validPhases = Object.values(GamePhase);
    if (!phase || !validPhases.includes(phase)) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: `phase must be one of: ${validPhases.join(", ")}`,
      });
      return;
    }

    // Verify membership
    const result = await pool.query(
      `SELECT gs.id
       FROM game_sessions gs
       JOIN team_members tm ON tm.team_id = gs.team_id
       WHERE gs.id = $1 AND tm.user_id = $2`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Session not found or you are not a team member",
      });
      return;
    }

    // If transitioning to RESULTS, also set ended_at
    const updates =
      phase === GamePhase.RESULTS
        ? await pool.query(
            `UPDATE game_sessions SET phase = $1, ended_at = NOW()
             WHERE id = $2
             RETURNING id, phase, ended_at`,
            [phase, id],
          )
        : await pool.query(
            `UPDATE game_sessions SET phase = $1
             WHERE id = $2
             RETURNING id, phase, ended_at`,
            [phase, id],
          );

    res.json({
      success: true,
      data: {
        id: updates.rows[0].id,
        phase: updates.rows[0].phase,
        endedAt: updates.rows[0].ended_at,
      },
    });
  } catch (err) {
    console.error("Update phase error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to update session phase",
    });
  }
});

// ─── PATCH /api/sessions/:id/notes — Update collaborative notes ─────────────

router.patch("/:id/notes", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user!.userId;

    if (typeof notes !== "string") {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "notes must be a string",
      });
      return;
    }

    // Verify membership
    const session = await pool.query(
      `SELECT gs.id
       FROM game_sessions gs
       JOIN team_members tm ON tm.team_id = gs.team_id
       WHERE gs.id = $1 AND tm.user_id = $2`,
      [id, userId],
    );

    if (session.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Session not found or you are not a team member",
      });
      return;
    }

    const result = await pool.query(
      `UPDATE game_sessions SET notes = $1
       WHERE id = $2
       RETURNING id, notes`,
      [notes, id],
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        notes: result.rows[0].notes,
      },
    });
  } catch (err) {
    console.error("Update notes error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to update notes",
    });
  }
});

// ─── GET /api/sessions/team/:teamId — List sessions for a team ──────────────

router.get("/team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    // Verify membership
    const membership = await pool.query(
      "SELECT user_id FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId],
    );

    if (membership.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You are not a member of this team",
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, team_id, building_seed, phase, started_at, ended_at, notes, is_resumable
       FROM game_sessions
       WHERE team_id = $1
       ORDER BY started_at DESC`,
      [teamId],
    );

    res.json({
      success: true,
      data: result.rows.map((s) => ({
        id: s.id,
        teamId: s.team_id,
        buildingSeed: s.building_seed,
        phase: s.phase,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        notes: s.notes,
        isResumable: s.is_resumable,
      })),
    });
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to list sessions",
    });
  }
});

export default router;
