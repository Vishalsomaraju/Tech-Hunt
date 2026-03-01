// ============================================================================
// TECH HUNT — Socket.io Event Names
// Every socket event must be defined here. Using raw strings elsewhere = bugs.
// ============================================================================

// ─── Connection Events ───────────────────────────────────────────────────────

export const PLAYER_JOIN = "player:join";
export const PLAYER_LEAVE = "player:leave";
export const PLAYER_RECONNECT = "player:reconnect";

// ─── Room Events ─────────────────────────────────────────────────────────────

export const ROOM_ENTER = "room:enter";
export const ROOM_LOCK = "room:lock";
export const ROOM_UNLOCK = "room:unlock";

// ─── Puzzle Events ───────────────────────────────────────────────────────────

export const PUZZLE_START = "puzzle:start";
export const PUZZLE_ANSWER = "puzzle:answer";
export const PUZZLE_HINT = "puzzle:hint";
export const PUZZLE_SOLVED = "puzzle:solved";

// ─── Game Events ─────────────────────────────────────────────────────────────

export const GAME_START = "game:start";
export const GAME_PAUSE = "game:pause";
export const GAME_END = "game:end";
export const TIMER_SYNC = "game:timer_sync";

// ─── Team Events ─────────────────────────────────────────────────────────────

export const TEAM_UPDATE = "team:update";
export const SCORE_UPDATE = "score:update";

// ─── System Events ───────────────────────────────────────────────────────────

export const ERROR = "error:message";
export const CONNECTED = "connection:established";
