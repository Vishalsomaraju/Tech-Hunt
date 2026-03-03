"use strict";
// ============================================================================
// TECH HUNT — Shared Enums
// Single source of truth for all game enumerations.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionType = exports.HintLevel = exports.PlayerRole = exports.GamePhase = exports.RoomStatus = exports.PuzzleType = void 0;
/** Types of puzzles available in the game */
var PuzzleType;
(function (PuzzleType) {
    PuzzleType["BINARY"] = "BINARY";
    PuzzleType["HEX"] = "HEX";
    PuzzleType["OCTAL"] = "OCTAL";
    PuzzleType["ASCII"] = "ASCII";
    PuzzleType["CODING"] = "CODING";
})(PuzzleType || (exports.PuzzleType = PuzzleType = {}));
/** Current status of a room in the building */
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["LOCKED"] = "LOCKED";
    RoomStatus["UNLOCKED"] = "UNLOCKED";
    RoomStatus["ACTIVE"] = "ACTIVE";
    RoomStatus["COMPLETED"] = "COMPLETED";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
/** High-level phase of a game session */
var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "LOBBY";
    GamePhase["EXPLORING"] = "EXPLORING";
    GamePhase["PUZZLE"] = "PUZZLE";
    GamePhase["RESULTS"] = "RESULTS";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
/** Role of a player within a team */
var PlayerRole;
(function (PlayerRole) {
    PlayerRole["LEADER"] = "LEADER";
    PlayerRole["MEMBER"] = "MEMBER";
})(PlayerRole || (exports.PlayerRole = PlayerRole = {}));
/** Hint severity level — penalties are defined in HINT_PENALTIES constant */
var HintLevel;
(function (HintLevel) {
    HintLevel["SMALL"] = "SMALL";
    HintLevel["MEDIUM"] = "MEDIUM";
    HintLevel["LARGE"] = "LARGE";
})(HintLevel || (exports.HintLevel = HintLevel = {}));
/** Whether the session is solo (resumable) or multiplayer */
var SessionType;
(function (SessionType) {
    SessionType["SOLO"] = "SOLO";
    SessionType["MULTIPLAYER"] = "MULTIPLAYER";
})(SessionType || (exports.SessionType = SessionType = {}));
//# sourceMappingURL=enums.js.map