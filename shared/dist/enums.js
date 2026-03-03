// ============================================================================
// TECH HUNT — Shared Enums
// Single source of truth for all game enumerations.
// ============================================================================
/** Types of puzzles available in the game */
export var PuzzleType;
(function (PuzzleType) {
    PuzzleType["BINARY"] = "BINARY";
    PuzzleType["HEX"] = "HEX";
    PuzzleType["OCTAL"] = "OCTAL";
    PuzzleType["ASCII"] = "ASCII";
    PuzzleType["CODING"] = "CODING";
})(PuzzleType || (PuzzleType = {}));
/** Current status of a room in the building */
export var RoomStatus;
(function (RoomStatus) {
    RoomStatus["LOCKED"] = "LOCKED";
    RoomStatus["UNLOCKED"] = "UNLOCKED";
    RoomStatus["ACTIVE"] = "ACTIVE";
    RoomStatus["COMPLETED"] = "COMPLETED";
})(RoomStatus || (RoomStatus = {}));
/** High-level phase of a game session */
export var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "LOBBY";
    GamePhase["EXPLORING"] = "EXPLORING";
    GamePhase["PUZZLE"] = "PUZZLE";
    GamePhase["RESULTS"] = "RESULTS";
})(GamePhase || (GamePhase = {}));
/** Role of a player within a team */
export var PlayerRole;
(function (PlayerRole) {
    PlayerRole["LEADER"] = "LEADER";
    PlayerRole["MEMBER"] = "MEMBER";
})(PlayerRole || (PlayerRole = {}));
/** Hint severity level — penalties are defined in HINT_PENALTIES constant */
export var HintLevel;
(function (HintLevel) {
    HintLevel["SMALL"] = "SMALL";
    HintLevel["MEDIUM"] = "MEDIUM";
    HintLevel["LARGE"] = "LARGE";
})(HintLevel || (HintLevel = {}));
/** Whether the session is solo (resumable) or multiplayer */
export var SessionType;
(function (SessionType) {
    SessionType["SOLO"] = "SOLO";
    SessionType["MULTIPLAYER"] = "MULTIPLAYER";
})(SessionType || (SessionType = {}));
//# sourceMappingURL=enums.js.map