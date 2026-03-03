"use strict";
// ============================================================================
// TECH HUNT — Socket.io Event Names
// Every socket event must be defined here. Using raw strings elsewhere = bugs.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTED = exports.ERROR = exports.SKIP_COUNTDOWN = exports.PLAYER_READY = exports.NOTES_UPDATED = exports.UPDATE_NOTES = exports.CHAT_MESSAGE = exports.SEND_CHAT = exports.SCORE_UPDATE = exports.TEAM_UPDATE = exports.TIMER_SYNC = exports.GAME_END = exports.GAME_PAUSE = exports.GAME_START = exports.PUZZLE_SOLVED = exports.PUZZLE_HINT = exports.ANSWER_INCORRECT = exports.REQUEST_HINT = exports.PUZZLE_ANSWER = exports.PUZZLE_START = exports.ROOM_UNLOCK = exports.ROOM_LOCK = exports.PLAYER_MOVED = exports.ROOM_ENTER = exports.GAME_STATE = exports.JOIN_SESSION = exports.PLAYER_RECONNECT = exports.PLAYER_LEAVE = exports.PLAYER_JOIN = void 0;
// ─── Connection Events ───────────────────────────────────────────────────────
exports.PLAYER_JOIN = "player:join";
exports.PLAYER_LEAVE = "player:leave";
exports.PLAYER_RECONNECT = "player:reconnect";
// ─── Session Events ──────────────────────────────────────────────────────────
/** Client → server: join an existing game session */
exports.JOIN_SESSION = "session:join";
/** Server → client: full game state sync on join / reconnect */
exports.GAME_STATE = "game:state";
// ─── Room Events ─────────────────────────────────────────────────────────────
/** Client → server: player moves to a room */
exports.ROOM_ENTER = "room:enter";
/** Server → all: broadcast that a player moved */
exports.PLAYER_MOVED = "player:moved";
exports.ROOM_LOCK = "room:lock";
exports.ROOM_UNLOCK = "room:unlock";
// ─── Puzzle Events ───────────────────────────────────────────────────────────
exports.PUZZLE_START = "puzzle:start";
/** Client → server: submit an answer for the active puzzle */
exports.PUZZLE_ANSWER = "puzzle:answer";
/** Client → server: request a hint for the active puzzle */
exports.REQUEST_HINT = "puzzle:request_hint";
/** Server → client (sender only): submitted answer was incorrect */
exports.ANSWER_INCORRECT = "puzzle:answer_incorrect";
/** Server → client (sender only): hint text + penalty */
exports.PUZZLE_HINT = "puzzle:hint";
exports.PUZZLE_SOLVED = "puzzle:solved";
// ─── Game Events ─────────────────────────────────────────────────────────────
exports.GAME_START = "game:start";
exports.GAME_PAUSE = "game:pause";
exports.GAME_END = "game:end";
exports.TIMER_SYNC = "game:timer_sync";
// ─── Team Events ─────────────────────────────────────────────────────────────
exports.TEAM_UPDATE = "team:update";
exports.SCORE_UPDATE = "score:update";
// ─── Chat Events ─────────────────────────────────────────────────────────────
/** Client → server: send a chat message */
exports.SEND_CHAT = "chat:send";
/** Server → all: broadcast chat message */
exports.CHAT_MESSAGE = "chat:message";
// ─── Notes Events ────────────────────────────────────────────────────────────
/** Client → server: update shared notepad */
exports.UPDATE_NOTES = "notes:update";
/** Server → others (not sender): notes were updated */
exports.NOTES_UPDATED = "notes:updated";
// ─── Countdown Skip Events ───────────────────────────────────────────────────
/** Client → server: player signals ready to skip countdown */
exports.PLAYER_READY = "player_ready";
/** Server → client: countdown is being skipped now */
exports.SKIP_COUNTDOWN = "skip_countdown";
// ─── System Events ───────────────────────────────────────────────────────────
exports.ERROR = "error:message";
exports.CONNECTED = "connection:established";
//# sourceMappingURL=events.js.map