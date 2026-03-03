import { HintLevel } from "./enums";
/** Points awarded for solving a puzzle (before bonuses / penalties) */
export declare const PUZZLE_BASE_SCORE = 100;
/** Score penalties for each hint level */
export declare const HINT_PENALTIES: Record<HintLevel, number>;
/** Maximum number of players allowed in a single team */
export declare const MAX_TEAM_SIZE = 5;
/** Default countdown timer for a puzzle room (in seconds) */
export declare const ROOM_COUNTDOWN_SECONDS = 60;
/** Time bonus range — bonus scales linearly between these bounds */
export declare const MIN_TIME_BONUS = 0;
export declare const MAX_TIME_BONUS = 50;
/** Default number of floors in a building */
export declare const DEFAULT_FLOORS = 1;
/** Default number of rooms per floor */
export declare const DEFAULT_ROOMS_PER_FLOOR = 5;
/** Team invite code length */
export declare const TEAM_CODE_LENGTH = 6;
/** JWT token expiry duration */
export declare const JWT_EXPIRY = "7d";
/** Minimum password length for registration */
export declare const MIN_PASSWORD_LENGTH = 6;
/** Maximum username length */
export declare const MAX_USERNAME_LENGTH = 32;
//# sourceMappingURL=constants.d.ts.map