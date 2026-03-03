// ============================================================================
// TECH HUNT — Coding Challenge Template Pool
// 60 parameterized templates (20 per difficulty tier).
// Each template's `generate` function takes a PRNG and returns a unique
// puzzle instance with prompt, answer, and three progressive hints.
// ============================================================================

import { PRNG } from "./prng.js";

// ─── Public Types ──────────────────────────────────────────────────────────

export interface CodingChallengeTemplate {
  id: string;
  tier: 1 | 2 | 3;
  generate: (rng: PRNG) => CodingChallengeInstance;
}

export interface CodingChallengeInstance {
  prompt: string;
  answer: string;
  /** [SMALL, MEDIUM, LARGE] — progressively more revealing. */
  hints: [string, string, string];
}

// ─── Math Helpers (used by generators) ─────────────────────────────────────

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function fibonacci(n: number): number {
  let a = 0,
    b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return n === 0 ? 0 : b;
}

function sumDigits(n: number): number {
  return Math.abs(n)
    .toString()
    .split("")
    .reduce((s, d) => s + parseInt(d, 10), 0);
}

function popcount(n: number): number {
  let c = 0;
  let v = n;
  while (v) {
    c += v & 1;
    v >>>= 1;
  }
  return c;
}

function collatzSteps(n: number): number {
  let s = 0;
  let v = n;
  while (v !== 1) {
    v = v % 2 === 0 ? v / 2 : 3 * v + 1;
    s++;
  }
  return s;
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

// ─── Word Pools ────────────────────────────────────────────────────────────

const WORDS_SHORT: readonly string[] = [
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
  "ax",
  "my",
];

const WORDS_MED: readonly string[] = [
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
  "chip",
];

const WORDS_LONG: readonly string[] = [
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
  "object",
  "method",
  "cursor",
  "docker",
];

const PALINDROMES: readonly string[] = [
  "racecar",
  "level",
  "deed",
  "noon",
  "madam",
  "radar",
  "refer",
  "civic",
  "kayak",
  "rotor",
];

// ─── Formatting Helper ─────────────────────────────────────────────────────

function code(lines: string): string {
  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
//  TIER 1 — EASY  (20 templates)
// ═══════════════════════════════════════════════════════════════════════════

const tier1: CodingChallengeTemplate[] = [
  // 1 ─ Sum 1..N
  {
    id: "t1_sum_range",
    tier: 1,
    generate: (rng) => {
      const n = rng.nextInt(5, 20);
      const ans = (n * (n + 1)) / 2;
      return {
        prompt: code(
          `function sumRange(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) total += i;\n  return total;\n}\n\nWhat is sumRange(${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          "There is a well-known shortcut: n × (n + 1) / 2.",
          `The answer has ${ans.toString().length} digit(s).`,
          `The answer is between ${ans - 5} and ${ans + 5}.`,
        ],
      };
    },
  },

  // 2 ─ Count evens in 1..N
  {
    id: "t1_count_evens",
    tier: 1,
    generate: (rng) => {
      const n = rng.nextInt(10, 50);
      const ans = Math.floor(n / 2);
      return {
        prompt: `How many even numbers are there from 1 to ${n} (inclusive)?`,
        answer: ans.toString(),
        hints: [
          "Even numbers are divisible by 2.",
          `Think: floor(${n} / 2).`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 3 ─ Count odds in 1..N
  {
    id: "t1_count_odds",
    tier: 1,
    generate: (rng) => {
      const n = rng.nextInt(10, 50);
      const ans = Math.ceil(n / 2);
      return {
        prompt: `How many odd numbers are there from 1 to ${n} (inclusive)?`,
        answer: ans.toString(),
        hints: [
          "Odd numbers are not divisible by 2.",
          `Think: ceil(${n} / 2).`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 4 ─ Triple addition
  {
    id: "t1_triple_add",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(10, 99);
      const b = rng.nextInt(10, 99);
      const c = rng.nextInt(10, 99);
      const ans = a + b + c;
      return {
        prompt: `What is ${a} + ${b} + ${c}?`,
        answer: ans.toString(),
        hints: [
          "Just add the three numbers together.",
          `${a} + ${b} = ${a + b}. Now add ${c}.`,
          `The answer is between ${ans - 3} and ${ans + 3}.`,
        ],
      };
    },
  },

  // 5 ─ Multiplication
  {
    id: "t1_multiply",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(3, 15);
      const b = rng.nextInt(3, 15);
      const ans = a * b;
      return {
        prompt: `What is ${a} × ${b}?`,
        answer: ans.toString(),
        hints: [
          "Simple multiplication.",
          `The answer has ${ans.toString().length} digit(s).`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 6 ─ Modulo
  {
    id: "t1_modulo",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(20, 100);
      const b = rng.nextInt(3, 12);
      const ans = a % b;
      return {
        prompt: `What is ${a} % ${b}  (remainder of ${a} ÷ ${b})?`,
        answer: ans.toString(),
        hints: [
          "The modulo operator returns the remainder after division.",
          `${a} ÷ ${b} = ${Math.floor(a / b)} remainder ?`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 7 ─ Floor division
  {
    id: "t1_floor_div",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(20, 100);
      const b = rng.nextInt(3, 10);
      const ans = Math.floor(a / b);
      return {
        prompt: `What is Math.floor(${a} / ${b})?`,
        answer: ans.toString(),
        hints: [
          "Divide then round down.",
          `${a} / ${b} ≈ ${(a / b).toFixed(2)}`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 8 ─ Power (small)
  {
    id: "t1_power",
    tier: 1,
    generate: (rng) => {
      const base = rng.nextInt(2, 5);
      const exp = rng.nextInt(2, 5);
      const ans = Math.pow(base, exp);
      return {
        prompt: `What is ${base} raised to the power of ${exp}  (${base}^${exp})?`,
        answer: ans.toString(),
        hints: [
          `Multiply ${base} by itself ${exp} times.`,
          `${base}^${exp - 1} = ${Math.pow(base, exp - 1)}. Multiply once more by ${base}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 9 ─ Array sum
  {
    id: "t1_array_sum",
    tier: 1,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 20));
      const ans = arr.reduce((a, b) => a + b, 0);
      return {
        prompt: `Given the array [${arr.join(", ")}], what is the sum of all elements?`,
        answer: ans.toString(),
        hints: [
          "Add every element together.",
          `The first three sum to ${arr[0] + arr[1] + arr[2]}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 10 ─ Array max
  {
    id: "t1_array_max",
    tier: 1,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 50));
      const ans = Math.max(...arr);
      return {
        prompt: `Given the array [${arr.join(", ")}], what is the maximum value?`,
        answer: ans.toString(),
        hints: [
          "Scan the array for the largest element.",
          `It's not ${Math.min(...arr)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 11 ─ Array min
  {
    id: "t1_array_min",
    tier: 1,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 50));
      const ans = Math.min(...arr);
      return {
        prompt: `Given the array [${arr.join(", ")}], what is the minimum value?`,
        answer: ans.toString(),
        hints: [
          "Scan the array for the smallest element.",
          `It's not ${Math.max(...arr)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 12 ─ String length
  {
    id: "t1_string_len",
    tier: 1,
    generate: (rng) => {
      const word = rng.pick(WORDS_MED);
      return {
        prompt: `What is the length of the string "${word}"?`,
        answer: word.length.toString(),
        hints: [
          "Count each character.",
          `It's a ${word.length > 3 ? "four or more" : "short"} letter word.`,
          `The answer is ${word.length}.`,
        ],
      };
    },
  },

  // 13 ─ Absolute difference
  {
    id: "t1_abs_diff",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 100);
      const b = rng.nextInt(1, 100);
      const ans = Math.abs(a - b);
      return {
        prompt: `What is the absolute difference |${a} − ${b}|?`,
        answer: ans.toString(),
        hints: [
          "Subtract and take the absolute value.",
          `${a} − ${b} = ${a - b}`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 14 ─ Boolean AND
  {
    id: "t1_bool_and",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 20);
      const b = rng.nextInt(1, 20);
      const c = rng.nextInt(1, 20);
      const d = rng.nextInt(1, 20);
      const ans = a > b && c > d;
      return {
        prompt: `What does (${a} > ${b}) AND (${c} > ${d}) evaluate to?  Answer "true" or "false".`,
        answer: ans.toString(),
        hints: [
          "Both conditions must be true for AND to be true.",
          `(${a} > ${b}) is ${a > b}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 15 ─ Boolean OR
  {
    id: "t1_bool_or",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 20);
      const b = rng.nextInt(1, 20);
      const c = rng.nextInt(1, 20);
      const d = rng.nextInt(1, 20);
      const ans = a > b || c < d;
      return {
        prompt: `What does (${a} > ${b}) OR (${c} < ${d}) evaluate to?  Answer "true" or "false".`,
        answer: ans.toString(),
        hints: [
          "At least one condition must be true for OR to be true.",
          `(${a} > ${b}) is ${a > b}; (${c} < ${d}) is ${c < d}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 16 ─ Ternary operator
  {
    id: "t1_ternary",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 30);
      const b = rng.nextInt(1, 30);
      const ans = a > b ? "yes" : "no";
      return {
        prompt: `What is the result of:  ${a} > ${b} ? "yes" : "no"`,
        answer: ans,
        hints: [
          "If the condition is true, the first value is returned.",
          `Is ${a} greater than ${b}?`,
          `The answer is "${ans}".`,
        ],
      };
    },
  },

  // 17 ─ Double N times
  {
    id: "t1_double_n",
    tier: 1,
    generate: (rng) => {
      const n = rng.nextInt(3, 8);
      const ans = Math.pow(2, n);
      return {
        prompt: code(
          `let x = 1;\nfor (let i = 0; i < ${n}; i++) x = x * 2;\n\nWhat is x?`,
        ),
        answer: ans.toString(),
        hints: [
          "You're doubling 1 repeatedly.",
          `After ${n - 1} iterations x = ${Math.pow(2, n - 1)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 18 ─ Count divisible
  {
    id: "t1_count_div",
    tier: 1,
    generate: (rng) => {
      const n = rng.nextInt(20, 60);
      const k = rng.nextInt(2, 7);
      const ans = Math.floor(n / k);
      return {
        prompt: `How many numbers from 1 to ${n} are divisible by ${k}?`,
        answer: ans.toString(),
        hints: [
          "Use floor(N / K).",
          `${k} × ${ans - 1} = ${k * (ans - 1)} and ${k} × ${ans} = ${k * ans}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 19 ─ Arithmetic sequence Nth term
  {
    id: "t1_arith_seq",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 10);
      const d = rng.nextInt(2, 8);
      const n = rng.nextInt(5, 12);
      const ans = a + (n - 1) * d;
      return {
        prompt: `An arithmetic sequence starts at ${a} with common difference ${d}.\nWhat is the ${n}th term?`,
        answer: ans.toString(),
        hints: [
          "Formula: a + (n − 1) × d.",
          `The 2nd term is ${a + d}, the 3rd is ${a + 2 * d}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 20 ─ Max of three
  {
    id: "t1_max_three",
    tier: 1,
    generate: (rng) => {
      const a = rng.nextInt(1, 100);
      const b = rng.nextInt(1, 100);
      const c = rng.nextInt(1, 100);
      const ans = Math.max(a, b, c);
      return {
        prompt: `What is Math.max(${a}, ${b}, ${c})?`,
        answer: ans.toString(),
        hints: [
          "Pick the largest of the three values.",
          `It's not ${Math.min(a, b, c)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  TIER 2 — MEDIUM  (20 templates)
// ═══════════════════════════════════════════════════════════════════════════

const tier2: CodingChallengeTemplate[] = [
  // 1 ─ Factorial
  {
    id: "t2_factorial",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(4, 8);
      const ans = factorial(n);
      return {
        prompt: code(
          `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\n\nWhat is factorial(${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          "Multiply all integers from 1 to n.",
          `${n - 1}! = ${factorial(n - 1)}.  Now multiply by ${n}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 2 ─ Fibonacci
  {
    id: "t2_fibonacci",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(6, 14);
      const ans = fibonacci(n);
      return {
        prompt: `The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, …\n\nWhat is the ${n}th Fibonacci number (0-indexed)?`,
        answer: ans.toString(),
        hints: [
          "Each number is the sum of the two before it.",
          `fib(${n - 2}) = ${fibonacci(n - 2)}, fib(${n - 1}) = ${fibonacci(n - 1)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 3 ─ Reverse string
  {
    id: "t2_reverse_str",
    tier: 2,
    generate: (rng) => {
      const word = rng.pick(WORDS_MED);
      const ans = word.split("").reverse().join("");
      return {
        prompt: `What is "${word}" reversed?`,
        answer: ans,
        hints: [
          "Read the string from right to left.",
          `The first character of the reversed string is "${word[word.length - 1]}".`,
          `The answer starts with "${ans.substring(0, 2)}".`,
        ],
      };
    },
  },

  // 4 ─ Sum of digits
  {
    id: "t2_sum_digits",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(100, 9999);
      const ans = sumDigits(n);
      return {
        prompt: `What is the sum of all digits in the number ${n}?`,
        answer: ans.toString(),
        hints: [
          "Extract each digit and add them.",
          `The digits are: ${n.toString().split("").join(", ")}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 5 ─ Count digits
  {
    id: "t2_count_digits",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(100, 99999);
      const ans = n.toString().length;
      return {
        prompt: `How many digits does the number ${n} have?`,
        answer: ans.toString(),
        hints: [
          "Convert to a string and check its length.",
          `It has more than ${ans - 1} digit(s).`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 6 ─ GCD
  {
    id: "t2_gcd",
    tier: 2,
    generate: (rng) => {
      const a = rng.nextInt(12, 100);
      const b = rng.nextInt(12, 100);
      const ans = gcd(a, b);
      return {
        prompt: `What is the Greatest Common Divisor (GCD) of ${a} and ${b}?`,
        answer: ans.toString(),
        hints: [
          "Use the Euclidean algorithm: gcd(a, b) = gcd(b, a % b).",
          `${a} % ${b} = ${a % b}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 7 ─ LCM
  {
    id: "t2_lcm",
    tier: 2,
    generate: (rng) => {
      const a = rng.nextInt(3, 18);
      const b = rng.nextInt(3, 18);
      const ans = lcm(a, b);
      return {
        prompt: `What is the Least Common Multiple (LCM) of ${a} and ${b}?`,
        answer: ans.toString(),
        hints: [
          "LCM(a, b) = |a × b| / GCD(a, b).",
          `GCD(${a}, ${b}) = ${gcd(a, b)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 8 ─ Triangular number (nested loop count)
  {
    id: "t2_nested_loop",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(4, 12);
      const ans = (n * (n + 1)) / 2;
      return {
        prompt: code(
          `let count = 0;\nfor (let i = 1; i <= ${n}; i++) {\n  for (let j = 1; j <= i; j++) {\n    count++;\n  }\n}\n\nWhat is count?`,
        ),
        answer: ans.toString(),
        hints: [
          "The inner loop runs i times for each i.",
          `Total iterations = 1 + 2 + … + ${n}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 9 ─ Palindrome check
  {
    id: "t2_palindrome",
    tier: 2,
    generate: (rng) => {
      const isPalin = rng.nextBool();
      const word = isPalin ? rng.pick(PALINDROMES) : rng.pick(WORDS_LONG);
      const reversed = word.split("").reverse().join("");
      const ans = word === reversed ? "yes" : "no";
      return {
        prompt: `Is "${word}" a palindrome? Answer "yes" or "no".`,
        answer: ans,
        hints: [
          "A palindrome reads the same forwards and backwards.",
          `Reversed: "${reversed}".`,
          `The answer is "${ans}".`,
        ],
      };
    },
  },

  // 10 ─ Count vowels
  {
    id: "t2_vowel_count",
    tier: 2,
    generate: (rng) => {
      const word = rng.pick(WORDS_LONG);
      const vowels = "aeiou";
      const ans = word.split("").filter((c) => vowels.includes(c)).length;
      return {
        prompt: `How many vowels (a, e, i, o, u) are in the word "${word}"?`,
        answer: ans.toString(),
        hints: [
          "Scan each character and check if it's a vowel.",
          `The vowels present are: ${[...new Set(word.split("").filter((c) => vowels.includes(c)))].join(", ") || "none"}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 11 ─ Popcount (bit count)
  {
    id: "t2_popcount",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(5, 255);
      const ans = popcount(n);
      return {
        prompt: `How many 1-bits are in the binary representation of ${n}?\n(${n} in binary is ${n.toString(2)})`,
        answer: ans.toString(),
        hints: [
          "Count each '1' in the binary form.",
          `Binary: ${n.toString(2)}`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 12 ─ Power of two check
  {
    id: "t2_power_of_two",
    tier: 2,
    generate: (rng) => {
      const isPow = rng.nextBool();
      const n = isPow ? Math.pow(2, rng.nextInt(1, 10)) : rng.nextInt(3, 500);
      const ans = isPowerOfTwo(n) ? "yes" : "no";
      return {
        prompt: `Is ${n} a power of 2? Answer "yes" or "no".`,
        answer: ans,
        hints: [
          "Powers of 2: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024.",
          `${n} in binary is ${n.toString(2)}.`,
          `The answer is "${ans}".`,
        ],
      };
    },
  },

  // 13 ─ Array product
  {
    id: "t2_array_product",
    tier: 2,
    generate: (rng) => {
      const arr = Array.from({ length: 4 }, () => rng.nextInt(1, 8));
      const ans = arr.reduce((a, b) => a * b, 1);
      return {
        prompt: `What is the product of all elements in [${arr.join(", ")}]?`,
        answer: ans.toString(),
        hints: [
          "Multiply every element together.",
          `${arr[0]} × ${arr[1]} = ${arr[0] * arr[1]}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 14 ─ Sum even numbers in range
  {
    id: "t2_sum_evens",
    tier: 2,
    generate: (rng) => {
      const a = rng.nextInt(1, 10);
      const b = a + rng.nextInt(8, 20);
      let ans = 0;
      for (let i = a; i <= b; i++) if (i % 2 === 0) ans += i;
      return {
        prompt: `What is the sum of all even numbers from ${a} to ${b} (inclusive)?`,
        answer: ans.toString(),
        hints: [
          "Iterate through the range and add only even values.",
          `The first even number in range is ${a % 2 === 0 ? a : a + 1}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 15 ─ Celsius to Fahrenheit
  {
    id: "t2_c_to_f",
    tier: 2,
    generate: (rng) => {
      const c = rng.nextInt(0, 100);
      const ans = Math.round((c * 9) / 5 + 32);
      return {
        prompt: `Convert ${c}°C to Fahrenheit (round to nearest integer).\nFormula: F = C × 9/5 + 32`,
        answer: ans.toString(),
        hints: [
          "Multiply by 9, divide by 5, then add 32.",
          `${c} × 9/5 = ${((c * 9) / 5).toFixed(1)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 16 ─ XOR
  {
    id: "t2_xor",
    tier: 2,
    generate: (rng) => {
      const a = rng.nextInt(10, 255);
      const b = rng.nextInt(10, 255);
      const ans = a ^ b;
      return {
        prompt: `What is ${a} XOR ${b}  (in decimal)?\n\nHint: XOR compares each bit — 1 if different, 0 if same.`,
        answer: ans.toString(),
        hints: [
          `${a} in binary: ${a.toString(2)}.  ${b} in binary: ${b.toString(2)}.`,
          `Compare each bit position.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 17 ─ Array average (floor)
  {
    id: "t2_array_avg",
    tier: 2,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 30));
      const sum = arr.reduce((a, b) => a + b, 0);
      const ans = Math.floor(sum / arr.length);
      return {
        prompt: `What is Math.floor(average) of [${arr.join(", ")}]?`,
        answer: ans.toString(),
        hints: [
          "Sum all elements, divide by count, then floor.",
          `Sum = ${sum}.  Count = ${arr.length}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 18 ─ Filter & sum (elements > threshold)
  {
    id: "t2_filter_sum",
    tier: 2,
    generate: (rng) => {
      const arr = Array.from({ length: 6 }, () => rng.nextInt(1, 30));
      const k = rng.nextInt(10, 20);
      const ans = arr.filter((x) => x > k).reduce((a, b) => a + b, 0);
      return {
        prompt: `Sum all elements greater than ${k} in [${arr.join(", ")}].`,
        answer: ans.toString(),
        hints: [
          `Filter elements > ${k}, then sum the result.`,
          `Elements > ${k}: [${arr.filter((x) => x > k).join(", ")}].`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 19 ─ Swap result
  {
    id: "t2_swap",
    tier: 2,
    generate: (rng) => {
      const a = rng.nextInt(1, 100);
      const b = rng.nextInt(1, 100);
      return {
        prompt: code(
          `let x = ${a};\nlet y = ${b};\nlet temp = x;\nx = y;\ny = temp;\n\nWhat is x now?`,
        ),
        answer: b.toString(),
        hints: [
          "This is a classic swap using a temporary variable.",
          "After the swap, x holds the original value of y.",
          `The answer is ${b}.`,
        ],
      };
    },
  },

  // 20 ─ Nested loop total
  {
    id: "t2_nested_total",
    tier: 2,
    generate: (rng) => {
      const n = rng.nextInt(3, 7);
      const m = rng.nextInt(3, 7);
      const ans = n * m;
      return {
        prompt: code(
          `let count = 0;\nfor (let i = 0; i < ${n}; i++) {\n  for (let j = 0; j < ${m}; j++) {\n    count++;\n  }\n}\n\nWhat is count?`,
        ),
        answer: ans.toString(),
        hints: [
          "The inner loop runs m times for each of n outer iterations.",
          `Total = ${n} × ${m}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  TIER 3 — HARD  (20 templates)
// ═══════════════════════════════════════════════════════════════════════════

const tier3: CodingChallengeTemplate[] = [
  // 1 ─ Recursive sum
  {
    id: "t3_recursive_sum",
    tier: 3,
    generate: (rng) => {
      const n = rng.nextInt(5, 15);
      const ans = (n * (n + 1)) / 2;
      return {
        prompt: code(
          `function f(n) {\n  if (n === 0) return 0;\n  return n + f(n - 1);\n}\n\nWhat is f(${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          "This recursion sums all integers from n down to 0.",
          `f(${n}) = ${n} + f(${n - 1}).  f(${n - 1}) = ${((n - 1) * n) / 2}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 2 ─ Recursive power
  {
    id: "t3_recursive_pow",
    tier: 3,
    generate: (rng) => {
      const x = rng.nextInt(2, 5);
      const n = rng.nextInt(2, 6);
      const ans = Math.pow(x, n);
      return {
        prompt: code(
          `function power(x, n) {\n  if (n === 0) return 1;\n  return x * power(x, n - 1);\n}\n\nWhat is power(${x}, ${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          `Each recursive call multiplies x one more time.`,
          `power(${x}, ${n - 1}) = ${Math.pow(x, n - 1)}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 3 ─ Caesar cipher
  {
    id: "t3_caesar",
    tier: 3,
    generate: (rng) => {
      const word = rng.pick(WORDS_SHORT).toUpperCase();
      const shift = rng.nextInt(1, 10);
      const ans = word
        .split("")
        .map((c) => {
          const code = c.charCodeAt(0) - 65;
          return String.fromCharCode(((code + shift) % 26) + 65);
        })
        .join("");
      return {
        prompt: `Apply a Caesar cipher with shift ${shift} to "${word}".\nEach letter moves ${shift} positions forward in the alphabet (wrap Z→A).`,
        answer: ans,
        hints: [
          "Shift each letter by the given amount, wrapping around Z to A.",
          `'${word[0]}' shifted by ${shift} → '${ans[0]}'.`,
          `The answer starts with "${ans.substring(0, Math.ceil(ans.length / 2))}".`,
        ],
      };
    },
  },

  // 4 ─ Run-length encoding
  {
    id: "t3_rle",
    tier: 3,
    generate: (rng) => {
      // Build a string with repeated chars
      const charset = "ABCDEFGH";
      let input = "";
      const groups = rng.nextInt(3, 5);
      for (let g = 0; g < groups; g++) {
        const ch = charset[g % charset.length];
        const count = rng.nextInt(1, 5);
        input += ch.repeat(count);
      }
      // Compute RLE
      let ans = "";
      let i = 0;
      while (i < input.length) {
        const ch = input[i];
        let count = 0;
        while (i < input.length && input[i] === ch) {
          count++;
          i++;
        }
        ans += `${count}${ch}`;
      }
      return {
        prompt: `Run-length encode the string: "${input}"\n\nFormat: count followed by character, e.g. "AAABB" → "3A2B"`,
        answer: ans,
        hints: [
          "Group consecutive identical characters and prefix each group with its count.",
          `The first group is '${input[0]}' repeated ${input.split("").filter((c, idx) => idx === 0 || c === input[0]).length > 1 ? "multiple times" : "once"}.`,
          `The answer starts with "${ans.substring(0, 4)}".`,
        ],
      };
    },
  },

  // 5 ─ Array rotation
  {
    id: "t3_rotate",
    tier: 3,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 20));
      const k = rng.nextInt(1, 4);
      const len = arr.length;
      const rotated = [...arr.slice(len - k), ...arr.slice(0, len - k)];
      return {
        prompt: `Rotate the array [${arr.join(", ")}] to the right by ${k} position(s).\n\nGive the resulting array as comma-separated values.`,
        answer: rotated.join(", "),
        hints: [
          "Take the last K elements and move them to the front.",
          `The last ${k} element(s): [${arr.slice(len - k).join(", ")}].`,
          `The answer starts with "${rotated.slice(0, 2).join(", ")}".`,
        ],
      };
    },
  },

  // 6 ─ Prefix sum at index
  {
    id: "t3_prefix_sum",
    tier: 3,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 15));
      const idx = rng.nextInt(1, arr.length - 1);
      let ans = 0;
      for (let i = 0; i <= idx; i++) ans += arr[i];
      return {
        prompt: `Given the array [${arr.join(", ")}], what is the prefix sum at index ${idx} (0-based)?\n\nprefix_sum[i] = sum of arr[0..i]`,
        answer: ans.toString(),
        hints: [
          "Sum all elements from index 0 through the given index.",
          `Elements to sum: [${arr.slice(0, idx + 1).join(", ")}].`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 7 ─ Composed linear function
  {
    id: "t3_compose_linear",
    tier: 3,
    generate: (rng) => {
      const a = rng.nextInt(2, 5);
      const b = rng.nextInt(1, 6);
      const n = rng.nextInt(1, 10);
      const fN = a * n + b;
      const ans = a * fN + b; // f(f(n))
      return {
        prompt: code(
          `function f(x) { return ${a} * x + ${b}; }\nfunction g(x) { return f(f(x)); }\n\nWhat is g(${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          "First compute f(n), then feed that result back into f.",
          `f(${n}) = ${fN}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 8 ─ Composed quadratic
  {
    id: "t3_compose_quad",
    tier: 3,
    generate: (rng) => {
      const a = rng.nextInt(1, 5);
      const n = rng.nextInt(2, 8);
      const gN = n + a;
      const ans = gN * gN;
      return {
        prompt: code(
          `function f(x) { return x * x; }\nfunction g(x) { return x + ${a}; }\n\nWhat is f(g(${n}))?`,
        ),
        answer: ans.toString(),
        hints: [
          "First compute g(n), then square the result.",
          `g(${n}) = ${gN}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 9 ─ Matrix trace
  {
    id: "t3_matrix_trace",
    tier: 3,
    generate: (rng) => {
      const a = rng.nextInt(1, 20);
      const b = rng.nextInt(1, 20);
      const c = rng.nextInt(1, 20);
      const d = rng.nextInt(1, 20);
      const ans = a + d;
      return {
        prompt: `What is the trace (sum of diagonal elements) of this 2×2 matrix?\n\n| ${a}  ${b} |\n| ${c}  ${d} |`,
        answer: ans.toString(),
        hints: [
          "The trace is the sum of elements on the main diagonal.",
          `Diagonal elements: ${a} and ${d}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 10 ─ Stack operations
  {
    id: "t3_stack_ops",
    tier: 3,
    generate: (rng) => {
      const ops: { type: "push"; val: number }[] | { type: "pop" }[] = [];
      const stack: number[] = [];
      // Generate a sequence of push/pop ops that always leaves a non-empty stack
      const pushCount = rng.nextInt(3, 5);
      for (let i = 0; i < pushCount; i++) {
        const val = rng.nextInt(1, 50);
        stack.push(val);
        (ops as any[]).push({ type: "push", val });
      }
      // Add 1-2 pops
      const popCount = rng.nextInt(1, Math.min(2, pushCount - 1));
      for (let i = 0; i < popCount; i++) {
        stack.pop();
        (ops as any[]).push({ type: "pop" });
      }
      // Maybe push one more
      if (rng.nextBool()) {
        const val = rng.nextInt(1, 50);
        stack.push(val);
        (ops as any[]).push({ type: "push", val });
      }
      const ans = stack[stack.length - 1];
      const opsStr = (ops as any[])
        .map((o: any) => (o.type === "push" ? `push(${o.val})` : "pop()"))
        .join(", ");
      return {
        prompt: `Starting with an empty stack, perform these operations in order:\n${opsStr}\n\nWhat value is on top of the stack?`,
        answer: ans.toString(),
        hints: [
          "push adds to top; pop removes from top (LIFO).",
          `After all pushes before any pop, the stack has ${pushCount} element(s).`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 11 ─ Collatz steps
  {
    id: "t3_collatz",
    tier: 3,
    generate: (rng) => {
      const n = rng.nextInt(5, 30);
      const ans = collatzSteps(n);
      return {
        prompt: code(
          `function collatz(n) {\n  let steps = 0;\n  while (n !== 1) {\n    n = n % 2 === 0 ? n / 2 : 3 * n + 1;\n    steps++;\n  }\n  return steps;\n}\n\nWhat is collatz(${n})?`,
        ),
        answer: ans.toString(),
        hints: [
          "Even → divide by 2.  Odd → multiply by 3 and add 1.  Count steps until you reach 1.",
          `After step 1: n = ${n % 2 === 0 ? n / 2 : 3 * n + 1}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 12 ─ Sum of squares
  {
    id: "t3_sum_squares",
    tier: 3,
    generate: (rng) => {
      const n = rng.nextInt(4, 10);
      const ans = (n * (n + 1) * (2 * n + 1)) / 6;
      return {
        prompt: `What is 1² + 2² + 3² + … + ${n}²?`,
        answer: ans.toString(),
        hints: [
          "Formula: n(n+1)(2n+1) / 6.",
          `1² + 2² + 3² = ${1 + 4 + 9}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 13 ─ Recursive countdown print count
  {
    id: "t3_countdown",
    tier: 3,
    generate: (rng) => {
      const n = rng.nextInt(3, 15);
      // prints n, n-1, ..., 1 → total n values
      return {
        prompt: code(
          `function countdown(n) {\n  if (n <= 0) return;\n  console.log(n);\n  countdown(n - 1);\n}\n\ncountdown(${n});\n\nHow many numbers are printed?`,
        ),
        answer: n.toString(),
        hints: [
          "It prints n, then n-1, …, down to 1.",
          `The first printed value is ${n}, the last is 1.`,
          `The answer is ${n}.`,
        ],
      };
    },
  },

  // 14 ─ Bitwise AND
  {
    id: "t3_bitwise_and",
    tier: 3,
    generate: (rng) => {
      const a = rng.nextInt(10, 255);
      const b = rng.nextInt(10, 255);
      const ans = a & b;
      return {
        prompt: `What is ${a} AND ${b}  (bitwise AND, answer in decimal)?\n\n${a} = ${a.toString(2).padStart(8, "0")}\n${b} = ${b.toString(2).padStart(8, "0")}`,
        answer: ans.toString(),
        hints: [
          "AND gives 1 only where both bits are 1.",
          `Result in binary: ${ans.toString(2).padStart(8, "0")}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 15 ─ Array intersection count
  {
    id: "t3_intersect",
    tier: 3,
    generate: (rng) => {
      const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const a = rng.sample(pool, 5).sort((x, y) => x - y);
      const b = rng.sample(pool, 5).sort((x, y) => x - y);
      const setB = new Set(b);
      const common = a.filter((x) => setB.has(x));
      const ans = common.length;
      return {
        prompt: `How many elements are common to both arrays?\n\nA = [${a.join(", ")}]\nB = [${b.join(", ")}]`,
        answer: ans.toString(),
        hints: [
          "Find elements that appear in both arrays.",
          `Common elements: [${common.join(", ") || "none"}].`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 16 ─ Map +K
  {
    id: "t3_map_add",
    tier: 3,
    generate: (rng) => {
      const arr = Array.from({ length: 5 }, () => rng.nextInt(1, 20));
      const k = rng.nextInt(2, 10);
      const result = arr.map((x) => x + k);
      return {
        prompt: code(
          `const arr = [${arr.join(", ")}];\nconst result = arr.map(x => x + ${k});\n\nWhat is result?  (comma-separated values)`,
        ),
        answer: result.join(", "),
        hints: [
          "Add the constant to every element.",
          `First element: ${arr[0]} + ${k} = ${arr[0] + k}.`,
          `The result starts with: ${result.slice(0, 3).join(", ")}.`,
        ],
      };
    },
  },

  // 17 ─ Reduce product
  {
    id: "t3_reduce_prod",
    tier: 3,
    generate: (rng) => {
      const arr = Array.from({ length: 4 }, () => rng.nextInt(1, 6));
      const ans = arr.reduce((a, b) => a * b, 1);
      return {
        prompt: code(
          `const arr = [${arr.join(", ")}];\nconst result = arr.reduce((acc, x) => acc * x, 1);\n\nWhat is result?`,
        ),
        answer: ans.toString(),
        hints: [
          "Multiply all elements, starting with accumulator = 1.",
          `After first two elements: ${arr[0]} × ${arr[1]} = ${arr[0] * arr[1]}.`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 18 ─ Filter even count
  {
    id: "t3_filter_even",
    tier: 3,
    generate: (rng) => {
      const arr = Array.from({ length: 7 }, () => rng.nextInt(1, 30));
      const evens = arr.filter((x) => x % 2 === 0);
      const ans = evens.length;
      return {
        prompt: code(
          `const arr = [${arr.join(", ")}];\nconst result = arr.filter(x => x % 2 === 0).length;\n\nWhat is result?`,
        ),
        answer: ans.toString(),
        hints: [
          "Count elements that are divisible by 2.",
          `Even elements: [${evens.join(", ") || "none"}].`,
          `The answer is ${ans}.`,
        ],
      };
    },
  },

  // 19 ─ String charAt
  {
    id: "t3_char_at",
    tier: 3,
    generate: (rng) => {
      const word = rng.pick(WORDS_LONG);
      const idx = rng.nextInt(0, word.length - 1);
      const ans = word[idx];
      return {
        prompt: `What is "${word}".charAt(${idx})?\n\n(0-indexed)`,
        answer: ans,
        hints: [
          "Strings are 0-indexed: position 0 is the first character.",
          `The string has ${word.length} characters.`,
          `The answer is "${ans}".`,
        ],
      };
    },
  },

  // 20 ─ Concat + reverse
  {
    id: "t3_concat_rev",
    tier: 3,
    generate: (rng) => {
      const a = rng.pick(WORDS_SHORT).toUpperCase();
      const b = rng.pick(WORDS_SHORT).toUpperCase();
      const bRev = b.split("").reverse().join("");
      const ans = a + bRev;
      return {
        prompt: `What is "${a}" + reverse("${b}")?`,
        answer: ans,
        hints: [
          `First reverse "${b}", then concatenate.`,
          `reverse("${b}") = "${bRev}".`,
          `The answer is "${ans}".`,
        ],
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  Exports
// ═══════════════════════════════════════════════════════════════════════════

/** All 60 coding challenge templates, grouped by tier. */
export const CODING_CHALLENGES: readonly CodingChallengeTemplate[] = [
  ...tier1,
  ...tier2,
  ...tier3,
];

/** Retrieve challenge templates filtered by tier. */
export function getChallengesByTier(
  tier: 1 | 2 | 3,
): readonly CodingChallengeTemplate[] {
  return CODING_CHALLENGES.filter((c) => c.tier === tier);
}

/** Pick a random challenge from the given tier using the supplied PRNG. */
export function pickCodingChallenge(
  rng: PRNG,
  tier: 1 | 2 | 3,
): CodingChallengeInstance {
  const pool = getChallengesByTier(tier);
  const template = rng.pick(pool);
  return template.generate(rng);
}
