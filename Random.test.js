import { describe, it, expect } from 'vitest';
import { Random } from './Random.js';

describe('🎲 lite-random', () => {
    const SEED = 42;

    describe('constructor', () => {
        it('accepts a seed', () => {
            const rng = new Random(123);
            expect(rng.seed).toBe(123);
        });

        it('clamps large seeds (e.g. Date.now()) to 32-bit int', () => {
            const big = 1_700_000_000_000; // > 2^32
            const rng = new Random(big);
            expect(rng.seed).toBe(big | 0);
            expect(Number.isInteger(rng.seed)).toBe(true);
        });

        it('defaults seed to a number when omitted', () => {
            const rng = new Random();
            expect(rng.seed).toBeTypeOf('number');
        });
    });

    describe('next()', () => {
        it('returns a float in [0, 1)', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 1000; i++) {
                const v = rng.next();
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThan(1);
            }
        });

        it('is deterministic with same seed', () => {
            const a = new Random(SEED);
            const b = new Random(SEED);
            for (let i = 0; i < 100; i++) {
                expect(a.next()).toBe(b.next());
            }
        });

        it('produces different sequences with different seeds', () => {
            const a = new Random(1);
            const b = new Random(2);
            const sameCount = Array.from({ length: 100 }, () => a.next() === b.next())
                .filter(Boolean).length;
            expect(sameCount).toBeLessThan(5);
        });

        it('does not drift after millions of calls (32-bit clamp regression)', () => {
            // The | 0 on (state + 0x6D2B79F5) prevents float drift past ~4.9M calls.
            // Two RNGs at different "burn-in" depths must still agree once aligned.
            const a = new Random(SEED);
            for (let i = 0; i < 5_000_000; i++) a.next();
            const stateAfterBurn = a.getState();

            const b = new Random(SEED).setState(stateAfterBurn);
            for (let i = 0; i < 1000; i++) {
                expect(a.next()).toBe(b.next());
            }
        });
    });

    describe('reset()', () => {
        it('replays the same sequence', () => {
            const rng = new Random(SEED);
            const seq1 = Array.from({ length: 10 }, () => rng.next());
            rng.reset();
            const seq2 = Array.from({ length: 10 }, () => rng.next());
            expect(seq1).toEqual(seq2);
        });

        it('accepts a new seed', () => {
            const rng = new Random(1);
            rng.next();
            rng.reset(2);
            expect(rng.seed).toBe(2);

            const fresh = new Random(2);
            expect(rng.next()).toBe(fresh.next());
        });

        it('returns `this` for chainability', () => {
            const rng = new Random(SEED);
            expect(rng.reset()).toBe(rng);
            expect(rng.reset(99)).toBe(rng);
        });
    });

    describe('getState() / setState()', () => {
        it('round-trips state perfectly', () => {
            const a = new Random(SEED);
            for (let i = 0; i < 50; i++) a.next();

            const snapshot = a.getState();
            const fork = new Random(0).setState(snapshot);

            for (let i = 0; i < 100; i++) {
                expect(a.next()).toBe(fork.next());
            }
        });

        it('setState clamps to 32-bit int', () => {
            const rng = new Random(SEED);
            rng.setState(2 ** 33 + 7);
            expect(Number.isInteger(rng._state)).toBe(true);
        });

        it('setState returns `this` for chainability', () => {
            const rng = new Random(SEED);
            expect(rng.setState(123)).toBe(rng);
        });
    });

    describe('range()', () => {
        it('returns values within [min, max)', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 1000; i++) {
                const v = rng.range(5, 10);
                expect(v).toBeGreaterThanOrEqual(5);
                expect(v).toBeLessThan(10);
            }
        });
    });

    describe('int()', () => {
        it('returns integers within [min, max] inclusive', () => {
            const rng = new Random(SEED);
            const results = new Set();
            for (let i = 0; i < 1000; i++) {
                const v = rng.int(1, 6);
                expect(Number.isInteger(v)).toBe(true);
                expect(v).toBeGreaterThanOrEqual(1);
                expect(v).toBeLessThanOrEqual(6);
                results.add(v);
            }
            expect(results.size).toBe(6);
        });

        // REGRESSION: previously, `| 0` truncated toward zero, making negative
        // `min` essentially never returned and over-representing 0 by 2×.
        it('is unbiased on negative ranges (regression test)', () => {
            const rng = new Random(SEED);
            const counts = new Map();
            const N = 110_000;
            for (let i = 0; i < N; i++) {
                const v = rng.int(-5, 5);
                expect(v).toBeGreaterThanOrEqual(-5);
                expect(v).toBeLessThanOrEqual(5);
                counts.set(v, (counts.get(v) || 0) + 1);
            }

            // Each of the 11 buckets should hit ~9.09%. Allow ±20% slack for sampling noise.
            const expected = N / 11;
            for (let v = -5; v <= 5; v++) {
                const c = counts.get(v) || 0;
                expect(c).toBeGreaterThan(expected * 0.8);
                expect(c).toBeLessThan(expected * 1.2);
            }
        });

        it('handles min === max', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 50; i++) expect(rng.int(7, 7)).toBe(7);
        });
    });

    describe('chance()', () => {
        it('returns boolean', () => {
            const rng = new Random(SEED);
            expect(typeof rng.chance(0.5)).toBe('boolean');
        });

        it('always true at p=1', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 100; i++) expect(rng.chance(1)).toBe(true);
        });

        it('always false at p=0', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 100; i++) expect(rng.chance(0)).toBe(false);
        });
    });

    describe('bool()', () => {
        it('returns boolean', () => {
            const rng = new Random(SEED);
            expect(typeof rng.bool()).toBe('boolean');
        });
    });

    describe('sign()', () => {
        it('returns -1 or 1', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 100; i++) {
                const s = rng.sign();
                expect(s === -1 || s === 1).toBe(true);
            }
        });
    });

    describe('unitVector()', () => {
        it('returns normalized vector (length ≈ 1)', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 100; i++) {
                const { x, y } = rng.unitVector();
                expect(Math.hypot(x, y)).toBeCloseTo(1, 5);
            }
        });

        it('mutates the `out` object when provided (Zero-GC)', () => {
            const rng = new Random(SEED);
            const out = { x: 0, y: 0 };
            const result = rng.unitVector(out);
            expect(result).toBe(out);
            expect(Math.hypot(out.x, out.y)).toBeCloseTo(1, 5);
        });
    });

    describe('unitVectorArray()', () => {
        it('writes a unit vector into a flat array at index 0', () => {
            const rng = new Random(SEED);
            const buf = [0, 0];
            rng.unitVectorArray(buf);
            expect(Math.hypot(buf[0], buf[1])).toBeCloseTo(1, 5);
        });

        it('writes at an arbitrary index (ECS pattern)', () => {
            const rng = new Random(SEED);
            const buf = new Float32Array(8);
            rng.unitVectorArray(buf, 4); // entityId 2, stride 2

            // Untouched slots remain 0
            expect(buf[0]).toBe(0);
            expect(buf[1]).toBe(0);
            expect(buf[2]).toBe(0);
            expect(buf[3]).toBe(0);
            // Written slots form a unit vector
            expect(Math.hypot(buf[4], buf[5])).toBeCloseTo(1, 5);
            expect(buf[6]).toBe(0);
            expect(buf[7]).toBe(0);
        });

        it('returns the same array reference', () => {
            const rng = new Random(SEED);
            const buf = new Float32Array(2);
            expect(rng.unitVectorArray(buf)).toBe(buf);
        });
    });

    describe('gaussian()', () => {
        it('returns numbers centered around mean', () => {
            const rng = new Random(SEED);
            let sum = 0;
            const N = 10000;
            for (let i = 0; i < N; i++) sum += rng.gaussian(0, 1);
            expect(sum / N).toBeCloseTo(0, 0);
        });

        it('respects custom mean and stddev', () => {
            const rng = new Random(SEED);
            let sum = 0;
            const N = 10000;
            for (let i = 0; i < N; i++) sum += rng.gaussian(100, 5);
            expect(sum / N).toBeCloseTo(100, 0);
        });

        it('approximates the 68-95-99.7 rule', () => {
            const rng = new Random(SEED);
            const N = 20000;
            let within1 = 0, within2 = 0;
            for (let i = 0; i < N; i++) {
                const z = rng.gaussian(0, 1);
                if (Math.abs(z) <= 1) within1++;
                if (Math.abs(z) <= 2) within2++;
            }
            expect(within1 / N).toBeGreaterThan(0.65); // ~68%
            expect(within1 / N).toBeLessThan(0.71);
            expect(within2 / N).toBeGreaterThan(0.93); // ~95%
            expect(within2 / N).toBeLessThan(0.97);
        });

        it('always consumes exactly 2 next() calls (predictable for replay)', () => {
            const a = new Random(SEED);
            const b = new Random(SEED);
            a.gaussian();
            b.next(); b.next();
            expect(a.getState()).toBe(b.getState());
        });

        it('defaults to mean=0 stddev=1', () => {
            const rng = new Random(SEED);
            const val = rng.gaussian();
            expect(typeof val).toBe('number');
            expect(isFinite(val)).toBe(true);
        });
    });

    describe('pick()', () => {
        it('returns an element from the array', () => {
            const rng = new Random(SEED);
            const arr = ['a', 'b', 'c'];
            for (let i = 0; i < 100; i++) {
                expect(arr).toContain(rng.pick(arr));
            }
        });

        it('returns null for empty array', () => {
            expect(new Random(SEED).pick([])).toBeNull();
        });

        it('returns null for null/undefined', () => {
            expect(new Random(SEED).pick(null)).toBeNull();
            expect(new Random(SEED).pick(undefined)).toBeNull();
        });
    });

    describe('shuffle()', () => {
        it('returns a new array', () => {
            const rng = new Random(SEED);
            const arr = [1, 2, 3, 4, 5];
            const shuffled = rng.shuffle(arr);
            expect(shuffled).not.toBe(arr);
        });

        it('contains all original elements', () => {
            const rng = new Random(SEED);
            const arr = [1, 2, 3, 4, 5];
            expect([...rng.shuffle(arr)].sort()).toEqual([...arr].sort());
        });

        it('is deterministic for the same seed', () => {
            const a = new Random(SEED);
            const b = new Random(SEED);
            const src = [1, 2, 3, 4, 5, 6, 7, 8];
            expect(a.shuffle(src)).toEqual(b.shuffle(src));
        });
    });

    describe('shuffleInPlace()', () => {
        it('mutates the original array', () => {
            const rng = new Random(SEED);
            const arr = [1, 2, 3, 4, 5];
            const result = rng.shuffleInPlace(arr);
            expect(result).toBe(arr);
        });

        it('preserves all elements', () => {
            const rng = new Random(SEED);
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const original = [...arr];
            rng.shuffleInPlace(arr);
            expect([...arr].sort((a, b) => a - b)).toEqual(original);
        });
    });

    describe('weighted()', () => {
        it('respects weights', () => {
            const rng = new Random(SEED);
            const counts = { a: 0, b: 0, c: 0 };
            for (let i = 0; i < 10000; i++) {
                const result = rng.weighted(['a', 'b', 'c'], [80, 15, 5]);
                counts[result]++;
            }
            expect(counts.a).toBeGreaterThan(counts.b);
            expect(counts.b).toBeGreaterThan(counts.c);
        });

        it('returns last item as fallback when all weights are 0', () => {
            const rng = new Random(SEED);
            expect(rng.weighted(['a', 'b'], [0, 0])).toBe('b');
        });

        it('handles items.length > weights.length safely', () => {
            const rng = new Random(SEED);
            // Only 'a' and 'b' have weights; 'c' is ignored
            const counts = { a: 0, b: 0, c: 0 };
            for (let i = 0; i < 1000; i++) {
                const r = rng.weighted(['a', 'b', 'c'], [70, 30]);
                counts[r]++;
            }
            expect(counts.c).toBe(0);
            expect(counts.a + counts.b).toBe(1000);
        });

        it('handles weights.length > items.length safely', () => {
            const rng = new Random(SEED);
            for (let i = 0; i < 100; i++) {
                const r = rng.weighted(['a', 'b'], [50, 50, 50, 50]);
                expect(['a', 'b']).toContain(r);
            }
        });
    });

    describe('pickWeighted()', () => {
        it('is an alias for weighted', () => {
            expect(Random.prototype.pickWeighted).toBe(Random.prototype.weighted);
        });
    });
});
