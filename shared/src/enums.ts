// ============================================================================
// TECH HUNT — Shared Enums
// Single source of truth for all game enumerations.
// ============================================================================

/** Types of puzzles available in the game */
export enum PuzzleType {
  BINARY = "BINARY",
  HEX = "HEX",
  OCTAL = "OCTAL",
  ASCII = "ASCII",
  CODING = "CODING",
}

/** Current status of a room in the building */
export enum RoomStatus {
  LOCKED = "LOCKED",
  UNLOCKED = "UNLOCKED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

/** High-level phase of a game session */
export enum GamePhase {
  LOBBY = "LOBBY",
  EXPLORING = "EXPLORING",
  PUZZLE = "PUZZLE",
  RESULTS = "RESULTS",
}

/** Role of a player within a team */
export enum PlayerRole {
  LEADER = "LEADER",
  MEMBER = "MEMBER",
}

/** Hint severity level — penalties are defined in HINT_PENALTIES constant */
export enum HintLevel {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

/** Whether the session is solo (resumable) or multiplayer */
export enum SessionType {
  SOLO = "SOLO",
  MULTIPLAYER = "MULTIPLAYER",
}
