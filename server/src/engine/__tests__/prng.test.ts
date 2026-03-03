// ============================================================================
// TECH HUNT — PRNG Unit Tests
// Verifies deterministic output, distribution, and derivation.
// Run: npx tsx src/engine/__tests__/prng.test.ts
// ============================================================================

import assert from "node:assert/strict";
import { PRNG } from "../prng.js";

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

console.log("\n🎲 PRNG Tests\n");

// ─── Determinism ───────────────────────────────────────────────────────────

test("same seed → identical sequence", () => {
  const a = new PRNG(42);
  const b = new PRNG(42);
  for (let i = 0; i < 100; i++) {
    assert.equal(a.next(), b.next(), `Mismatch at iteration ${i}`);
  }
});

test("different seeds → different sequences", () => {
  const a = new PRNG(42);
  const b = new PRNG(99);
  let same = 0;
  for (let i = 0; i < 100; i++) {
    if (a.next() === b.next()) same++;
  }
  assert.ok(same < 5, `Too many collisions: ${same}/100`);
});

// ─── Range ─────────────────────────────────────────────────────────────────

test("next() always returns [0, 1)", () => {
  const rng = new PRNG(123);
  for (let i = 0; i < 10_000; i++) {
    const v = rng.next();
    assert.ok(v >= 0 && v < 1, `Out of range: ${v}`);
  }
});

test("nextInt() respects bounds", () => {
  const rng = new PRNG(456);
  for (let i = 0; i < 10_000; i++) {
    const v = rng.nextInt(5, 15);
    assert.ok(v >= 5 && v <= 15, `Out of range: ${v}`);
  }
});

test("nextInt() covers full range", () => {
  const rng = new PRNG(789);
  const seen = new Set<number>();
  for (let i = 0; i < 10_000; i++) {
    seen.add(rng.nextInt(0, 9));
  }
  assert.equal(seen.size, 10, `Only saw ${seen.size} of 10 values`);
});

// ─── Distribution ──────────────────────────────────────────────────────────

test("distribution is roughly uniform (chi-squared)", () => {
  const rng = new PRNG(1337);
  const buckets = 10;
  const n = 100_000;
  const counts = new Array(buckets).fill(0);
  for (let i = 0; i < n; i++) {
    const bucket = Math.floor(rng.next() * buckets);
    counts[bucket]++;
  }
  const expected = n / buckets;
  let chiSq = 0;
  for (const c of counts) {
    chiSq += Math.pow(c - expected, 2) / expected;
  }
  // Critical value for chi-squared with 9 df at p=0.01 is ~21.67
  assert.ok(chiSq < 25, `Chi-squared too high: ${chiSq.toFixed(2)}`);
});

// ─── Boolean ───────────────────────────────────────────────────────────────

test("nextBool() produces both values", () => {
  const rng = new PRNG(555);
  let trues = 0;
  const n = 10_000;
  for (let i = 0; i < n; i++) {
    if (rng.nextBool()) trues++;
  }
  const ratio = trues / n;
  assert.ok(ratio > 0.4 && ratio < 0.6, `Ratio too skewed: ${ratio}`);
});

// ─── Collection Helpers ────────────────────────────────────────────────────

test("pick() always returns an element from the array", () => {
  const rng = new PRNG(111);
  const items = ["a", "b", "c", "d"];
  for (let i = 0; i < 1_000; i++) {
    const picked = rng.pick(items);
    assert.ok(items.includes(picked), `Picked unknown item: ${picked}`);
  }
});

test("shuffle() preserves all elements", () => {
  const rng = new PRNG(222);
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = rng.shuffle(original);
  assert.deepEqual(
    shuffled.sort((a, b) => a - b),
    [...original].sort((a, b) => a - b),
  );
});

test("shuffle() does not mutate original array", () => {
  const rng = new PRNG(333);
  const original = [1, 2, 3, 4, 5];
  const copy = [...original];
  rng.shuffle(original);
  assert.deepEqual(original, copy);
});

test("sample() returns correct count of unique elements", () => {
  const rng = new PRNG(444);
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sampled = rng.sample(items, 4);
  assert.equal(sampled.length, 4);
  assert.equal(new Set(sampled).size, 4, "Sample should contain unique items");
  for (const s of sampled) {
    assert.ok(items.includes(s), `Sampled unknown item: ${s}`);
  }
});

// ─── Derivation ────────────────────────────────────────────────────────────

test("derive() produces deterministic child", () => {
  const parentA = new PRNG(42);
  const parentB = new PRNG(42);
  const childA = parentA.derive(3);
  const childB = parentB.derive(3);
  for (let i = 0; i < 50; i++) {
    assert.equal(childA.next(), childB.next(), `Child mismatch at ${i}`);
  }
});

test("derive() different indices → different children", () => {
  const parent = new PRNG(42);
  const child1 = parent.derive(0);
  const child2 = parent.derive(1);
  let same = 0;
  for (let i = 0; i < 100; i++) {
    if (child1.next() === child2.next()) same++;
  }
  assert.ok(same < 5, `Too many collisions between children: ${same}`);
});

test("derive() does not advance parent state", () => {
  const a = new PRNG(42);
  const b = new PRNG(42);
  a.derive(5); // should not change a's state
  assert.equal(a.next(), b.next());
});

// ─── Edge Cases ────────────────────────────────────────────────────────────

test("seed 0 works", () => {
  const rng = new PRNG(0);
  const v = rng.next();
  assert.ok(v >= 0 && v < 1);
});

test("negative seed works", () => {
  const rng = new PRNG(-12345);
  const v = rng.next();
  assert.ok(v >= 0 && v < 1);
});

test("large seed works", () => {
  const rng = new PRNG(2147483647);
  const v = rng.next();
  assert.ok(v >= 0 && v < 1);
});

console.log(`\n🏁 ${passed} tests passed\n`);
