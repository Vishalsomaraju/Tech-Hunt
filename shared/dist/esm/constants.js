// ============================================================================
// TECH HUNT — Shared Constants
// All magic numbers and config values live here. Never hardcode these elsewhere.
// ============================================================================
import { HintLevel } from "./enums";
/** Points awarded for solving a puzzle (before bonuses / penalties) */
export const PUZZLE_BASE_SCORE = 100;
/** Score penalties for each hint level */
export const HINT_PENALTIES = {
    [HintLevel.SMALL]: 15,
    [HintLevel.MEDIUM]: 30,
    [HintLevel.LARGE]: 50,
};
/** Maximum number of players allowed in a single team */
export const MAX_TEAM_SIZE = 5;
/** Default countdown timer for a puzzle room (in seconds) */
export const ROOM_COUNTDOWN_SECONDS = 60;
/** Time bonus range — bonus scales linearly between these bounds */
export const MIN_TIME_BONUS = 0;
export const MAX_TIME_BONUS = 50;
/** Default number of floors in a building */
export const DEFAULT_FLOORS = 1;
/** Default number of rooms per floor */
export const DEFAULT_ROOMS_PER_FLOOR = 5;
/** Team invite code length */
export const TEAM_CODE_LENGTH = 6;
/** JWT token expiry duration */
export const JWT_EXPIRY = "7d";
/** Minimum password length for registration */
export const MIN_PASSWORD_LENGTH = 6;
/** Maximum username length */
export const MAX_USERNAME_LENGTH = 32;
//# sourceMappingURL=constants.js.map