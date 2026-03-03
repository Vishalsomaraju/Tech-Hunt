"use strict";
// ============================================================================
// TECH HUNT — Shared Constants
// All magic numbers and config values live here. Never hardcode these elsewhere.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_USERNAME_LENGTH = exports.MIN_PASSWORD_LENGTH = exports.JWT_EXPIRY = exports.TEAM_CODE_LENGTH = exports.DEFAULT_ROOMS_PER_FLOOR = exports.DEFAULT_FLOORS = exports.MAX_TIME_BONUS = exports.MIN_TIME_BONUS = exports.ROOM_COUNTDOWN_SECONDS = exports.MAX_TEAM_SIZE = exports.HINT_PENALTIES = exports.PUZZLE_BASE_SCORE = void 0;
const enums_1 = require("./enums");
/** Points awarded for solving a puzzle (before bonuses / penalties) */
exports.PUZZLE_BASE_SCORE = 100;
/** Score penalties for each hint level */
exports.HINT_PENALTIES = {
    [enums_1.HintLevel.SMALL]: 15,
    [enums_1.HintLevel.MEDIUM]: 30,
    [enums_1.HintLevel.LARGE]: 50,
};
/** Maximum number of players allowed in a single team */
exports.MAX_TEAM_SIZE = 5;
/** Default countdown timer for a puzzle room (in seconds) */
exports.ROOM_COUNTDOWN_SECONDS = 60;
/** Time bonus range — bonus scales linearly between these bounds */
exports.MIN_TIME_BONUS = 0;
exports.MAX_TIME_BONUS = 50;
/** Default number of floors in a building */
exports.DEFAULT_FLOORS = 1;
/** Default number of rooms per floor */
exports.DEFAULT_ROOMS_PER_FLOOR = 5;
/** Team invite code length */
exports.TEAM_CODE_LENGTH = 6;
/** JWT token expiry duration */
exports.JWT_EXPIRY = "7d";
/** Minimum password length for registration */
exports.MIN_PASSWORD_LENGTH = 6;
/** Maximum username length */
exports.MAX_USERNAME_LENGTH = 32;
//# sourceMappingURL=constants.js.map