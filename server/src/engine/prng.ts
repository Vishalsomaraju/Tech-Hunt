// ============================================================================
// TECH HUNT — Seeded Pseudo-Random Number Generator (PRNG)
// Uses the Mulberry32 algorithm for deterministic, reproducible sequences.
// Given the same seed, the output sequence is always identical — critical for
// resumable sessions and late-joining players.
// ============================================================================

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0; // Ensure 32-bit integer
  }

  // ─── Core ────────────────────────────────────────────────────────────────

  /**
   * Returns the next pseudo-random float in [0, 1).
   * Mulberry32 — fast, well-distributed, passes common PRNG test suites.
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a pseudo-random integer in [min, max] (both inclusive). */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a pseudo-random boolean with the given probability of `true`. */
  nextBool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  // ─── Collection Helpers ──────────────────────────────────────────────────

  /** Picks a uniformly random element from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error("PRNG.pick: array must not be empty");
    return arr[this.nextInt(0, arr.length - 1)];
  }

  /** Returns a shuffled copy of the array (Fisher–Yates). */
  shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Picks `count` unique random elements from the array. */
  sample<T>(arr: readonly T[], count: number): T[] {
    return this.shuffle(arr).slice(0, Math.min(count, arr.length));
  }

  // ─── Derivation ─────────────────────────────────────────────────────────

  /**
   * Creates a child PRNG whose seed is deterministically derived from the
   * current state and the given index.  Useful for generating independent
   * sub-sequences (e.g. one per room) without advancing the parent.
   */
  derive(index: number): PRNG {
    const childSeed = (this.state ^ Math.imul(index + 1, 0x9e3779b9)) | 0;
    return new PRNG(childSeed);
  }

  /** Returns the current internal state (useful for serialization / debugging). */
  getState(): number {
    return this.state;
  }
}
