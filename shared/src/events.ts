// ============================================================================
// TECH HUNT — Socket.io Event Names
// Every socket event must be defined here. Using raw strings elsewhere = bugs.
// ============================================================================

// ─── Connection Events ───────────────────────────────────────────────────────

export const PLAYER_JOIN = "player:join";
export const PLAYER_LEAVE = "player:leave";
export const PLAYER_RECONNECT = "player:reconnect";

// ─── Session Events ──────────────────────────────────────────────────────────

/** Client → server: join an existing game session */
export const JOIN_SESSION = "session:join";
/** Server → client: full game state sync on join / reconnect */
export const GAME_STATE = "game:state";

// ─── Room Events ─────────────────────────────────────────────────────────────

/** Client → server: player moves to a room */
export const ROOM_ENTER = "room:enter";
/** Server → all: broadcast that a player moved */
export const PLAYER_MOVED = "player:moved";
export const ROOM_LOCK = "room:lock";
export const ROOM_UNLOCK = "room:unlock";

// ─── Puzzle Events ───────────────────────────────────────────────────────────

export const PUZZLE_START = "puzzle:start";
/** Client → server: submit an answer for the active puzzle */
export const PUZZLE_ANSWER = "puzzle:answer";
/** Client → server: request a hint for the active puzzle */
export const REQUEST_HINT = "puzzle:request_hint";
/** Server → client (sender only): submitted answer was incorrect */
export const ANSWER_INCORRECT = "puzzle:answer_incorrect";
/** Server → client (sender only): hint text + penalty */
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

// ─── Chat Events ─────────────────────────────────────────────────────────────

/** Client → server: send a chat message */
export const SEND_CHAT = "chat:send";
/** Server → all: broadcast chat message */
export const CHAT_MESSAGE = "chat:message";

// ─── Notes Events ────────────────────────────────────────────────────────────

/** Client → server: update shared notepad */
export const UPDATE_NOTES = "notes:update";
/** Server → others (not sender): notes were updated */
export const NOTES_UPDATED = "notes:updated";

// ─── System Events ───────────────────────────────────────────────────────────

export const ERROR = "error:message";
export const CONNECTED = "connection:established";
