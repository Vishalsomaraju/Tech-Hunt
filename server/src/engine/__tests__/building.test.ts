// ============================================================================
// TECH HUNT — Building Generator Integration Tests
// Generates buildings from fixed seeds and inspects structure, determinism,
// difficulty scaling, and puzzle completeness.
// Run: npx tsx src/engine/__tests__/building.test.ts
// ============================================================================

import assert from "node:assert/strict";
import { RoomStatus, PuzzleType } from "@techhunt/shared";
import type { PuzzleInternal } from "@techhunt/shared";
import {
  generateBuilding,
  regeneratePuzzleForRoom,
  toBuildingPublic,
} from "../building.js";

let passed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("\n🏗️  Building Generator Tests\n");

const SEED = 1234567890;

// ─── Structure ─────────────────────────────────────────────────────────────

test("generates correct number of rooms", () => {
  const { building } = generateBuilding(SEED, 2, 3);
  assert.equal(building.rooms.length, 6);
  assert.equal(building.floors, 2);
  assert.equal(building.roomsPerFloor, 3);
});

test("default config uses shared constants (1 floor, 5 rooms)", () => {
  const { building } = generateBuilding(SEED);
  assert.equal(building.rooms.length, 5);
  assert.equal(building.floors, 1);
  assert.equal(building.roomsPerFloor, 5);
});

test("every room has a valid puzzle type", () => {
  const { building } = generateBuilding(SEED);
  const validTypes = Object.values(PuzzleType);
  for (const room of building.rooms) {
    assert.ok(
      validTypes.includes(room.puzzleType),
      `Invalid type: ${room.puzzleType}`,
    );
  }
});

test("first room is UNLOCKED, rest are LOCKED", () => {
  const { building } = generateBuilding(SEED);
  assert.equal(building.rooms[0].status, RoomStatus.UNLOCKED);
  for (let i = 1; i < building.rooms.length; i++) {
    assert.equal(building.rooms[i].status, RoomStatus.LOCKED);
  }
});

test("every room has a matching puzzle", () => {
  const { building, puzzles } = generateBuilding(SEED);
  for (const room of building.rooms) {
    assert.ok(puzzles.has(room.id), `Missing puzzle for room ${room.id}`);
    const puzzle = puzzles.get(room.id)!;
    assert.equal(puzzle.roomId, room.id);
    assert.equal(puzzle.type, room.puzzleType);
  }
});

test("all IDs are unique", () => {
  const { building, puzzles } = generateBuilding(SEED);
  const roomIds = new Set(building.rooms.map((r: any) => r.id));
  assert.equal(roomIds.size, building.rooms.length, "Duplicate room IDs");
  const puzzleIds = new Set([...puzzles.values()].map((p) => p.id));
  assert.equal(puzzleIds.size, puzzles.size, "Duplicate puzzle IDs");
});

// ─── Determinism ───────────────────────────────────────────────────────────

test("same seed → identical building", () => {
  const a = generateBuilding(SEED);
  const b = generateBuilding(SEED);

  assert.equal(a.building.id, b.building.id);
  assert.equal(a.building.rooms.length, b.building.rooms.length);
  for (let i = 0; i < a.building.rooms.length; i++) {
    assert.equal(a.building.rooms[i].id, b.building.rooms[i].id);
    assert.equal(
      a.building.rooms[i].puzzleType,
      b.building.rooms[i].puzzleType,
    );
  }
});

test("same seed → identical puzzles", () => {
  const a = generateBuilding(SEED);
  const b = generateBuilding(SEED);
  for (const [roomId, puzzleA] of a.puzzles) {
    const puzzleB = b.puzzles.get(roomId)!;
    assert.equal(puzzleA.prompt, puzzleB.prompt);
    assert.equal(puzzleA.answer, puzzleB.answer);
    assert.equal(puzzleA.type, puzzleB.type);
    assert.equal(puzzleA.difficulty, puzzleB.difficulty);
  }
});

test("different seed → different building", () => {
  const a = generateBuilding(42);
  const b = generateBuilding(99);
  // Building IDs should differ
  assert.notEqual(a.building.id, b.building.id);
});

// ─── Difficulty Scaling ────────────────────────────────────────────────────

test("puzzle difficulty increases with room index", () => {
  const { building, puzzles } = generateBuilding(SEED);
  const difficulties = building.rooms.map((r) => puzzles.get(r.id)!.difficulty);
  for (let i = 1; i < difficulties.length; i++) {
    assert.ok(
      difficulties[i] >= difficulties[i - 1],
      `Difficulty decreased: room ${i - 1}(${difficulties[i - 1]}) → room ${i}(${difficulties[i]})`,
    );
  }
});

test("early rooms use easy puzzle types (binary/octal)", () => {
  // Generate many buildings to check statistical tendency
  const easyTypes = [PuzzleType.BINARY, PuzzleType.OCTAL];
  let earlyEasyCount = 0;
  const trials = 50;
  for (let s = 0; s < trials; s++) {
    const { building } = generateBuilding(s * 7919);
    const firstRoom = building.rooms[0];
    if (easyTypes.includes(firstRoom.puzzleType)) earlyEasyCount++;
  }
  // First room should be easy type at least 90% of time
  assert.ok(
    earlyEasyCount / trials > 0.85,
    `Early rooms not easy enough: ${earlyEasyCount}/${trials}`,
  );
});

test("late rooms use harder puzzle types", () => {
  const hardTypes = [PuzzleType.CODING, PuzzleType.ASCII, PuzzleType.HEX];
  let lateHardCount = 0;
  const trials = 50;
  for (let s = 0; s < trials; s++) {
    const { building } = generateBuilding(s * 7919);
    const lastRoom = building.rooms[building.rooms.length - 1];
    if (hardTypes.includes(lastRoom.puzzleType)) lateHardCount++;
  }
  assert.ok(
    lateHardCount / trials > 0.85,
    `Late rooms not hard enough: ${lateHardCount}/${trials}`,
  );
});

// ─── Puzzle Content ────────────────────────────────────────────────────────

test("every puzzle has a non-empty prompt and answer", () => {
  const { puzzles } = generateBuilding(SEED);
  for (const [, puzzle] of puzzles) {
    assert.ok(puzzle.prompt.length > 0, "Empty prompt");
    assert.ok(puzzle.answer.length > 0, "Empty answer");
  }
});

test("every puzzle has exactly 3 hints", () => {
  const { puzzles } = generateBuilding(SEED);
  for (const [, puzzle] of puzzles) {
    assert.equal(puzzle.hints.length, 3, `Wrong hint count for ${puzzle.id}`);
    for (const hint of puzzle.hints) {
      assert.ok(hint.length > 0, "Empty hint");
    }
  }
});

test("time limits are positive and reasonable", () => {
  const { puzzles } = generateBuilding(SEED);
  for (const [, puzzle] of puzzles) {
    assert.ok(
      puzzle.timeLimit > 0,
      `Non-positive timeLimit: ${puzzle.timeLimit}`,
    );
    assert.ok(
      puzzle.timeLimit <= 120,
      `Excessive timeLimit: ${puzzle.timeLimit}`,
    );
  }
});

// ─── regeneratePuzzleForRoom ───────────────────────────────────────────────

test("regeneratePuzzleForRoom matches full generation", () => {
  const { building, puzzles } = generateBuilding(SEED);
  for (let i = 0; i < building.rooms.length; i++) {
    const room = building.rooms[i];
    const fromFull = puzzles.get(room.id)!;
    const fromRegen = regeneratePuzzleForRoom(SEED, i);
    assert.equal(fromRegen.prompt, fromFull.prompt);
    assert.equal(fromRegen.answer, fromFull.answer);
    assert.equal(fromRegen.type, fromFull.type);
  }
});

// ─── toBuildingPublic ──────────────────────────────────────────────────────

test("toBuildingPublic strips answer fields", () => {
  const gen = generateBuilding(SEED);
  const pub = toBuildingPublic(gen);

  for (const [, puzzle] of Object.entries(pub.puzzles)) {
    assert.ok(!("answer" in puzzle), "Answer leaked to public puzzle");
    assert.ok("prompt" in puzzle);
    assert.ok("hints" in puzzle);
  }
});

// ─── Visual Inspection ─────────────────────────────────────────────────────

console.log(`\n🏁 ${passed} tests passed\n`);

// Print a sample building for manual review
console.log("─── Sample Building (seed: " + SEED + ") ───\n");
const sample = generateBuilding(SEED);
for (let i = 0; i < sample.building.rooms.length; i++) {
  const room = sample.building.rooms[i];
  const puzzle = sample.puzzles.get(room.id)!;
  console.log(
    `  Room ${i} │ ${room.puzzleType.padEnd(7)} │ diff=${puzzle.difficulty.toFixed(2)} │ time=${puzzle.timeLimit}s`,
  );
  console.log(`         │ Q: ${puzzle.prompt.split("\n")[0].substring(0, 70)}`);
  console.log(`         │ A: ${puzzle.answer}`);
  console.log("");
}
