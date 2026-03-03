-- ============================================================================
-- TECH HUNT — PostgreSQL Database Schema
-- Run this file against your database to create all tables.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(32) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ─── Teams ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(64) NOT NULL,
  code          VARCHAR(8) UNIQUE NOT NULL,
  session_type  VARCHAR(16) NOT NULL DEFAULT 'SOLO',
  team_score    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);

-- ─── Team Members (join table) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role              VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
  individual_score  INTEGER NOT NULL DEFAULT 0,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ─── Game Sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  building_seed        BIGINT NOT NULL,
  phase                VARCHAR(16) NOT NULL DEFAULT 'LOBBY',
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,
  puzzle_activated_at  TIMESTAMPTZ,
  notes           TEXT NOT NULL DEFAULT '',
  is_resumable    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_team ON game_sessions(team_id);

-- ─── Puzzle Attempts ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_index    INTEGER NOT NULL,
  puzzle_seed   BIGINT NOT NULL,
  answer        TEXT,
  correct       BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_session ON puzzle_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_player ON puzzle_attempts(player_id);

-- ─── Hint Usage ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hint_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  room_index  INTEGER NOT NULL,
  hint_level  VARCHAR(8) NOT NULL,
  penalty     INTEGER NOT NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hint_usage_session ON hint_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_team ON hint_usage(team_id);
