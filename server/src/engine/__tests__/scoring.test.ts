// ============================================================================
// TECH HUNT — Scoring Engine Unit Tests
// Verifies time bonus curve, hint penalties, and composite score math.
// Run: npx tsx src/engine/__tests__/scoring.test.ts
// ============================================================================

import assert from "node:assert/strict";
import {
  PUZZLE_BASE_SCORE,
  MIN_TIME_BONUS,
  MAX_TIME_BONUS,
  ROOM_COUNTDOWN_SECONDS,
  HintLevel,
} from "@techhunt/shared";
import {
  calculateTimeBonus,
  calculateHintPenalty,
  calculateTotalHintPenalty,
  calculateScore,
  validateAnswer,
} from "../scoring.js";

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

console.log("\n📊 Scoring Tests\n");

// ─── Time Bonus ────────────────────────────────────────────────────────────

test("instant solve → max time bonus", () => {
  assert.equal(calculateTimeBonus(0), MAX_TIME_BONUS);
});

test("negative time → max time bonus (clamp)", () => {
  assert.equal(calculateTimeBonus(-5), MAX_TIME_BONUS);
});

test("solve at countdown → min time bonus", () => {
  assert.equal(calculateTimeBonus(ROOM_COUNTDOWN_SECONDS), MIN_TIME_BONUS);
});

test("solve after countdown → min time bonus", () => {
  assert.equal(calculateTimeBonus(ROOM_COUNTDOWN_SECONDS + 30), MIN_TIME_BONUS);
});

test("halfway → approximately half bonus", () => {
  const half = calculateTimeBonus(ROOM_COUNTDOWN_SECONDS / 2);
  const expected = Math.round(
    MIN_TIME_BONUS + (MAX_TIME_BONUS - MIN_TIME_BONUS) * 0.5,
  );
  assert.equal(half, expected);
});

test("time bonus degrades monotonically", () => {
  let prev = calculateTimeBonus(0);
  for (let t = 1; t <= ROOM_COUNTDOWN_SECONDS; t++) {
    const cur = calculateTimeBonus(t);
    assert.ok(cur <= prev, `Bonus increased at t=${t}: ${prev} → ${cur}`);
    prev = cur;
  }
});

test("time bonus never goes below 0", () => {
  for (let t = 0; t <= ROOM_COUNTDOWN_SECONDS * 2; t++) {
    const bonus = calculateTimeBonus(t);
    assert.ok(bonus >= 0, `Negative bonus at t=${t}: ${bonus}`);
  }
});

// ─── Hint Penalties ────────────────────────────────────────────────────────

test("SMALL hint penalty is 15", () => {
  assert.equal(calculateHintPenalty(HintLevel.SMALL), 15);
});

test("MEDIUM hint penalty is 30", () => {
  assert.equal(calculateHintPenalty(HintLevel.MEDIUM), 30);
});

test("LARGE hint penalty is 50", () => {
  assert.equal(calculateHintPenalty(HintLevel.LARGE), 50);
});

test("total of all hints = 95", () => {
  const total = calculateTotalHintPenalty([
    HintLevel.SMALL,
    HintLevel.MEDIUM,
    HintLevel.LARGE,
  ]);
  assert.equal(total, 95);
});

test("no hints → zero penalty", () => {
  assert.equal(calculateTotalHintPenalty([]), 0);
});

// ─── Composite Score ───────────────────────────────────────────────────────

test("perfect solve (instant, no hints) → base + max bonus", () => {
  const score = calculateScore(0, []);
  assert.equal(score, PUZZLE_BASE_SCORE + MAX_TIME_BONUS);
});

test("slow solve, no hints → base + 0", () => {
  const score = calculateScore(ROOM_COUNTDOWN_SECONDS, []);
  assert.equal(score, PUZZLE_BASE_SCORE + MIN_TIME_BONUS);
});

test("instant solve with all hints → base + max - 95", () => {
  const score = calculateScore(0, [
    HintLevel.SMALL,
    HintLevel.MEDIUM,
    HintLevel.LARGE,
  ]);
  assert.equal(score, PUZZLE_BASE_SCORE + MAX_TIME_BONUS - 95);
});

test("score never goes negative", () => {
  // Worst case: slow + all hints
  const score = calculateScore(ROOM_COUNTDOWN_SECONDS * 2, [
    HintLevel.SMALL,
    HintLevel.MEDIUM,
    HintLevel.LARGE,
  ]);
  assert.ok(score >= 0, `Negative score: ${score}`);
});

test("score is 0 when penalties exceed base", () => {
  // 100 base + 0 bonus - 95 penalty = 5, still positive
  // But what about extra hints applied multiple times?
  // Use a very slow solve with all hints
  const score = calculateScore(999, [
    HintLevel.LARGE,
    HintLevel.LARGE,
    HintLevel.LARGE,
  ]);
  assert.equal(score, 0);
});

// ─── Answer Validation ─────────────────────────────────────────────────────

test("exact match → correct", () => {
  assert.ok(validateAnswer("42", "42"));
});

test("case-insensitive match", () => {
  assert.ok(validateAnswer("FF", "ff"));
  assert.ok(validateAnswer("Hello", "hello"));
});

test("whitespace-trimmed match", () => {
  assert.ok(validateAnswer("  42  ", "42"));
  assert.ok(validateAnswer("42", "  42  "));
});

test("wrong answer → incorrect", () => {
  assert.ok(!validateAnswer("41", "42"));
});

test("empty vs non-empty → incorrect", () => {
  assert.ok(!validateAnswer("", "42"));
});

console.log(`\n🏁 ${passed} tests passed\n`);
