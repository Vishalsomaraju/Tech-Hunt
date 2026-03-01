// ============================================================================
// TECH HUNT Server — Team Routes
// REST endpoints for team CRUD: create, join, get, leave.
// All team data changes go through REST. Socket.io only broadcasts updates.
// ============================================================================

import { Router, Request, Response } from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";
import {
  MAX_TEAM_SIZE,
  TEAM_CODE_LENGTH,
  PlayerRole,
  SessionType,
} from "@techhunt/shared";

const router = Router();

// All team routes require authentication
router.use(authenticate);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a random alphanumeric team invite code.
 * Uses uppercase letters and digits for readability.
 */
function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < TEAM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── POST /api/teams — Create a new team ─────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, sessionType } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "Team name is required",
      });
      return;
    }

    if (name.length > 64) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "Team name must be 64 characters or fewer",
      });
      return;
    }

    // Validate session type
    const type =
      sessionType === SessionType.MULTIPLAYER
        ? SessionType.MULTIPLAYER
        : SessionType.SOLO;

    // Generate a unique team code (retry if collision)
    let code = generateTeamCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const check = await pool.query("SELECT id FROM teams WHERE code = $1", [
        code,
      ]);
      if (check.rows.length === 0) {
        codeExists = false;
      } else {
        code = generateTeamCode();
        attempts++;
      }
    }

    if (codeExists) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to generate unique team code",
      });
      return;
    }

    // Create team + add creator as LEADER in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const teamResult = await client.query(
        `INSERT INTO teams (name, code, session_type)
         VALUES ($1, $2, $3)
         RETURNING id, name, code, session_type, team_score, created_at`,
        [name.trim(), code, type],
      );

      const team = teamResult.rows[0];

      await client.query(
        `INSERT INTO team_members (user_id, team_id, role)
         VALUES ($1, $2, $3)`,
        [userId, team.id, PlayerRole.LEADER],
      );

      await client.query("COMMIT");

      // Fetch the full team with members
      const membersResult = await pool.query(
        `SELECT tm.user_id, u.username, tm.role, tm.individual_score, tm.joined_at
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = $1
         ORDER BY tm.joined_at ASC`,
        [team.id],
      );

      res.status(201).json({
        success: true,
        data: {
          id: team.id,
          name: team.name,
          code: team.code,
          sessionType: team.session_type,
          teamScore: team.team_score,
          createdAt: team.created_at,
          players: membersResult.rows.map((m) => ({
            userId: m.user_id,
            username: m.username,
            role: m.role,
            individualScore: m.individual_score,
            joinedAt: m.joined_at,
          })),
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to create team",
    });
  }
});

// ─── POST /api/teams/join — Join a team by invite code ───────────────────────

router.post("/join", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.userId;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "VALIDATION",
        message: "Team code is required",
      });
      return;
    }

    // Find the team
    const teamResult = await pool.query(
      "SELECT id, name, code, session_type, team_score, created_at FROM teams WHERE code = $1",
      [code.toUpperCase()],
    );

    if (teamResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "No team found with that code",
      });
      return;
    }

    const team = teamResult.rows[0];

    // Check if already a member
    const existingMember = await pool.query(
      "SELECT user_id FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, team.id],
    );

    if (existingMember.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "You are already a member of this team",
      });
      return;
    }

    // Check team size limit
    const memberCount = await pool.query(
      "SELECT COUNT(*) as count FROM team_members WHERE team_id = $1",
      [team.id],
    );

    if (parseInt(memberCount.rows[0].count) >= MAX_TEAM_SIZE) {
      res.status(409).json({
        success: false,
        error: "TEAM_FULL",
        message: `Team is full (max ${MAX_TEAM_SIZE} players)`,
      });
      return;
    }

    // Add the player as MEMBER
    await pool.query(
      `INSERT INTO team_members (user_id, team_id, role)
       VALUES ($1, $2, $3)`,
      [userId, team.id, PlayerRole.MEMBER],
    );

    // Return full team with all members
    const membersResult = await pool.query(
      `SELECT tm.user_id, u.username, tm.role, tm.individual_score, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [team.id],
    );

    res.json({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        code: team.code,
        sessionType: team.session_type,
        teamScore: team.team_score,
        createdAt: team.created_at,
        players: membersResult.rows.map((m) => ({
          userId: m.user_id,
          username: m.username,
          role: m.role,
          individualScore: m.individual_score,
          joinedAt: m.joined_at,
        })),
      },
    });
  } catch (err) {
    console.error("Join team error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to join team",
    });
  }
});

// ─── GET /api/teams/:id — Get team details ───────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Fetch team
    const teamResult = await pool.query(
      "SELECT id, name, code, session_type, team_score, created_at FROM teams WHERE id = $1",
      [id],
    );

    if (teamResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Team not found",
      });
      return;
    }

    const team = teamResult.rows[0];

    // Verify the requesting user is a member
    const isMember = await pool.query(
      "SELECT user_id FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, team.id],
    );

    if (isMember.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You are not a member of this team",
      });
      return;
    }

    // Fetch members
    const membersResult = await pool.query(
      `SELECT tm.user_id, u.username, tm.role, tm.individual_score, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [team.id],
    );

    res.json({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        code: team.code,
        sessionType: team.session_type,
        teamScore: team.team_score,
        createdAt: team.created_at,
        players: membersResult.rows.map((m) => ({
          userId: m.user_id,
          username: m.username,
          role: m.role,
          individualScore: m.individual_score,
          joinedAt: m.joined_at,
        })),
      },
    });
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to fetch team",
    });
  }
});

// ─── GET /api/teams — List all teams the user belongs to ─────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT t.id, t.name, t.code, t.session_type, t.team_score, t.created_at,
              tm.role, tm.individual_score
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId],
    );

    // For each team, also fetch the member count
    const teams = await Promise.all(
      result.rows.map(async (row) => {
        const countResult = await pool.query(
          "SELECT COUNT(*) as count FROM team_members WHERE team_id = $1",
          [row.id],
        );
        return {
          id: row.id,
          name: row.name,
          code: row.code,
          sessionType: row.session_type,
          teamScore: row.team_score,
          createdAt: row.created_at,
          myRole: row.role,
          myScore: row.individual_score,
          memberCount: parseInt(countResult.rows[0].count),
        };
      }),
    );

    res.json({
      success: true,
      data: teams,
    });
  } catch (err) {
    console.error("List teams error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to list teams",
    });
  }
});

// ─── DELETE /api/teams/:id/leave — Leave a team ──────────────────────────────

router.delete("/:id/leave", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check membership
    const membership = await pool.query(
      "SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, id],
    );

    if (membership.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "You are not a member of this team",
      });
      return;
    }

    const isLeader = membership.rows[0].role === PlayerRole.LEADER;

    // If leader leaves, check if there are other members to promote
    if (isLeader) {
      const otherMembers = await pool.query(
        `SELECT user_id FROM team_members
         WHERE team_id = $1 AND user_id != $2
         ORDER BY joined_at ASC
         LIMIT 1`,
        [id, userId],
      );

      if (otherMembers.rows.length > 0) {
        // Promote the next member to leader
        await pool.query(
          `UPDATE team_members SET role = $1
           WHERE user_id = $2 AND team_id = $3`,
          [PlayerRole.LEADER, otherMembers.rows[0].user_id, id],
        );
      }
      // If no other members, the team will be empty (could be cleaned up later)
    }

    // Remove the player
    await pool.query(
      "DELETE FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, id],
    );

    // Check if team is now empty and delete it
    const remaining = await pool.query(
      "SELECT COUNT(*) as count FROM team_members WHERE team_id = $1",
      [id],
    );

    if (parseInt(remaining.rows[0].count) === 0) {
      await pool.query("DELETE FROM teams WHERE id = $1", [id]);
    }

    res.json({
      success: true,
      data: { message: "Left team successfully" },
    });
  } catch (err) {
    console.error("Leave team error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to leave team",
    });
  }
});

export default router;
