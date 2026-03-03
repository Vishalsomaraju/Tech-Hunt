export declare const PLAYER_JOIN = "player:join";
export declare const PLAYER_LEAVE = "player:leave";
export declare const PLAYER_RECONNECT = "player:reconnect";
/** Client → server: join an existing game session */
export declare const JOIN_SESSION = "session:join";
/** Server → client: full game state sync on join / reconnect */
export declare const GAME_STATE = "game:state";
/** Client → server: player moves to a room */
export declare const ROOM_ENTER = "room:enter";
/** Server → all: broadcast that a player moved */
export declare const PLAYER_MOVED = "player:moved";
export declare const ROOM_LOCK = "room:lock";
export declare const ROOM_UNLOCK = "room:unlock";
export declare const PUZZLE_START = "puzzle:start";
/** Client → server: submit an answer for the active puzzle */
export declare const PUZZLE_ANSWER = "puzzle:answer";
/** Client → server: request a hint for the active puzzle */
export declare const REQUEST_HINT = "puzzle:request_hint";
/** Server → client (sender only): submitted answer was incorrect */
export declare const ANSWER_INCORRECT = "puzzle:answer_incorrect";
/** Server → client (sender only): hint text + penalty */
export declare const PUZZLE_HINT = "puzzle:hint";
export declare const PUZZLE_SOLVED = "puzzle:solved";
export declare const GAME_START = "game:start";
export declare const GAME_PAUSE = "game:pause";
export declare const GAME_END = "game:end";
export declare const TIMER_SYNC = "game:timer_sync";
export declare const TEAM_UPDATE = "team:update";
export declare const SCORE_UPDATE = "score:update";
/** Client → server: send a chat message */
export declare const SEND_CHAT = "chat:send";
/** Server → all: broadcast chat message */
export declare const CHAT_MESSAGE = "chat:message";
/** Client → server: update shared notepad */
export declare const UPDATE_NOTES = "notes:update";
/** Server → others (not sender): notes were updated */
export declare const NOTES_UPDATED = "notes:updated";
/** Client → server: player signals ready to skip countdown */
export declare const PLAYER_READY = "player_ready";
/** Server → client: countdown is being skipped now */
export declare const SKIP_COUNTDOWN = "skip_countdown";
export declare const ERROR = "error:message";
export declare const CONNECTED = "connection:established";
//# sourceMappingURL=events.d.ts.map