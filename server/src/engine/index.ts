// ============================================================================
// TECH HUNT — Game Engine Barrel Export
// Single import point for all engine subsystems.
//
//   import { PRNG, generateBuilding, calculateScore } from "../engine/index.js";
// ============================================================================

export { PRNG } from "./prng.js";
export { generatePuzzle, toPuzzlePublic } from "./puzzles.js";
export {
  generateBuilding,
  regeneratePuzzleForRoom,
  toBuildingPublic,
} from "./building.js";
export type { GeneratedBuilding } from "./building.js";
export {
  calculateScore,
  calculateTimeBonus,
  calculateHintPenalty,
  calculateTotalHintPenalty,
  validateAnswer,
} from "./scoring.js";
export {
  CODING_CHALLENGES,
  getChallengesByTier,
  pickCodingChallenge,
} from "./coding-challenges.js";
export type {
  CodingChallengeTemplate,
  CodingChallengeInstance,
} from "./coding-challenges.js";
