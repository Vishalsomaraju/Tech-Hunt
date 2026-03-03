// ============================================================================
// TECH HUNT — Puzzle Factory
// Generates fully-formed PuzzleInternal objects for every PuzzleType.
// Uses the PRNG for deterministic generation and the difficulty ratio
// (roomIndex / totalRooms) to scale complexity independently of room count.
// ============================================================================

import { PuzzleType, ROOM_COUNTDOWN_SECONDS } from "@techhunt/shared";
import type { PuzzleInternal } from "@techhunt/shared";
import { PRNG } from "./prng.js";
import { pickCodingChallenge } from "./coding-challenges.js";

// ─── Word Pools for ASCII Puzzles ──────────────────────────────────────────

const ASCII_EASY: readonly string[] = [
  "hi",
  "go",
  "up",
  "no",
  "if",
  "on",
  "or",
  "do",
  "to",
  "so",
];
const ASCII_MEDIUM: readonly string[] = [
  "code",
  "data",
  "byte",
  "loop",
  "node",
  "hash",
  "sort",
  "tree",
  "heap",
  "link",
  "port",
  "disk",
  "file",
  "bugs",
  "bits",
];
const ASCII_HARD: readonly string[] = [
  "server",
  "binary",
  "string",
  "switch",
  "kernel",
  "socket",
  "buffer",
  "thread",
  "script",
  "module",
  "deploy",
  "syntax",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Map difficulty (0–1) to a three-tier bucket. */
function difficultyTier(difficulty: number): 1 | 2 | 3 {
  if (difficulty < 0.33) return 1;
  if (difficulty < 0.66) return 2;
  return 3;
}

/**
 * Time limit scales inversely with difficulty:
 *   easy   → 1.5×  base countdown
 *   hard   → 1.0×  base countdown
 */
function computeTimeLimit(difficulty: number): number {
  return Math.round(ROOM_COUNTDOWN_SECONDS * (1.5 - 0.5 * difficulty));
}

/** Generate a deterministic hex-style ID from the PRNG. */
function generateId(rng: PRNG, prefix: string): string {
  const hex = Array.from({ length: 8 }, () =>
    rng.nextInt(0, 15).toString(16),
  ).join("");
  return `${prefix}_${hex}`;
}

// ─── Conversion Generators ─────────────────────────────────────────────────

function generateBinary(
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  const maxBits = Math.floor(4 + difficulty * 8); // 4–12 bits
  const value = rng.nextInt(2, (1 << maxBits) - 1);
  const toBase = rng.nextBool(); // true = decimal→binary

  let prompt: string;
  let answer: string;

  if (toBase) {
    answer = value.toString(2);
    prompt = `Convert the decimal number **${value}** to binary.`;
  } else {
    const binary = value.toString(2);
    answer = value.toString();
    prompt = `Convert the binary number **${binary}** to decimal.`;
  }

  const hints = buildConversionHints("binary", "base 2", answer);

  return {
    id: generateId(rng, "pzl"),
    roomId,
    type: PuzzleType.BINARY,
    seed: rng.getState(),
    difficulty,
    timeLimit: computeTimeLimit(difficulty),
    prompt,
    hints,
    answer,
  };
}

function generateHex(
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  const maxVal = difficulty < 0.33 ? 255 : difficulty < 0.66 ? 65535 : 16777215;
  const value = rng.nextInt(16, maxVal);
  const toBase = rng.nextBool();

  let prompt: string;
  let answer: string;

  if (toBase) {
    answer = value.toString(16).toUpperCase();
    prompt = `Convert the decimal number **${value}** to hexadecimal.`;
  } else {
    const hex = value.toString(16).toUpperCase();
    answer = value.toString();
    prompt = `Convert the hexadecimal number **${hex}** to decimal.`;
  }

  const hints = buildConversionHints("hexadecimal", "base 16", answer);

  return {
    id: generateId(rng, "pzl"),
    roomId,
    type: PuzzleType.HEX,
    seed: rng.getState(),
    difficulty,
    timeLimit: computeTimeLimit(difficulty),
    prompt,
    hints,
    answer,
  };
}

function generateOctal(
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  const maxVal = difficulty < 0.33 ? 63 : difficulty < 0.66 ? 511 : 4095;
  const value = rng.nextInt(8, maxVal);
  const toBase = rng.nextBool();

  let prompt: string;
  let answer: string;

  if (toBase) {
    answer = value.toString(8);
    prompt = `Convert the decimal number **${value}** to octal.`;
  } else {
    const octal = value.toString(8);
    answer = value.toString();
    prompt = `Convert the octal number **${octal}** to decimal.`;
  }

  const hints = buildConversionHints("octal", "base 8", answer);

  return {
    id: generateId(rng, "pzl"),
    roomId,
    type: PuzzleType.OCTAL,
    seed: rng.getState(),
    difficulty,
    timeLimit: computeTimeLimit(difficulty),
    prompt,
    hints,
    answer,
  };
}

function generateASCII(
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  const tier = difficultyTier(difficulty);
  const pool = tier === 1 ? ASCII_EASY : tier === 2 ? ASCII_MEDIUM : ASCII_HARD;
  const word = rng.pick(pool);
  const toCode = rng.nextBool(); // true = word→codes, false = codes→word

  let prompt: string;
  let answer: string;

  if (toCode) {
    const codes = word.split("").map((c) => c.charCodeAt(0));
    answer = codes.join(" ");
    prompt = `Convert the string **"${word}"** to ASCII codes (space-separated decimal values).`;
  } else {
    const codes = word.split("").map((c) => c.charCodeAt(0));
    answer = word;
    prompt = `Convert these ASCII codes to a string: **${codes.join(" ")}**`;
  }

  const hints: string[] = [
    "ASCII maps each character to a number.  'a' = 97, 'A' = 65, '0' = 48.",
    `The answer has ${answer.length > 3 ? answer.split(" ").length || answer.length : answer.length} part(s).`,
    `The answer starts with "${answer.substring(0, Math.ceil(answer.length / 2))}".`,
  ];

  return {
    id: generateId(rng, "pzl"),
    roomId,
    type: PuzzleType.ASCII,
    seed: rng.getState(),
    difficulty,
    timeLimit: computeTimeLimit(difficulty),
    prompt,
    hints,
    answer,
  };
}

function generateCoding(
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  const tier = difficultyTier(difficulty);
  const challenge = pickCodingChallenge(rng, tier);

  return {
    id: generateId(rng, "pzl"),
    roomId,
    type: PuzzleType.CODING,
    seed: rng.getState(),
    difficulty,
    timeLimit: computeTimeLimit(difficulty),
    prompt: challenge.prompt,
    hints: [...challenge.hints],
    answer: challenge.answer,
  };
}

// ─── Hint Builder ──────────────────────────────────────────────────────────

function buildConversionHints(
  systemName: string,
  baseName: string,
  answer: string,
): string[] {
  return [
    `${systemName.charAt(0).toUpperCase() + systemName.slice(1)} uses ${baseName}. Think about positional notation.`,
    `The answer has ${answer.length} character(s).`,
    `The answer starts with "${answer.substring(0, Math.ceil(answer.length / 2))}…"`,
  ];
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Generates a complete PuzzleInternal from the given parameters.
 *
 * @param type       — The puzzle category.
 * @param rng        — A seeded PRNG (must be a fresh child per puzzle).
 * @param roomId     — Parent room identifier.
 * @param difficulty — 0..1 ratio (roomIndex / totalRooms).
 */
export function generatePuzzle(
  type: PuzzleType,
  rng: PRNG,
  roomId: string,
  difficulty: number,
): PuzzleInternal {
  switch (type) {
    case PuzzleType.BINARY:
      return generateBinary(rng, roomId, difficulty);
    case PuzzleType.HEX:
      return generateHex(rng, roomId, difficulty);
    case PuzzleType.OCTAL:
      return generateOctal(rng, roomId, difficulty);
    case PuzzleType.ASCII:
      return generateASCII(rng, roomId, difficulty);
    case PuzzleType.CODING:
      return generateCoding(rng, roomId, difficulty);
    default:
      throw new Error(`Unknown puzzle type: ${type as string}`);
  }
}

/**
 * Strips the answer field, returning a client-safe PuzzlePublic.
 */
export function toPuzzlePublic(
  puzzle: PuzzleInternal,
): Omit<PuzzleInternal, "answer"> {
  const { answer: _answer, ...pub } = puzzle;
  return pub;
}
