import { describe, it, expect } from 'vitest';
import { Random } from './LiteRandom.d.ts';

describe('🎲 lite-random', () => {
    const SEED = 42;

    describe('constructor', () => {
        it('accepts a seed', () => {
            const rng = new Random(123);
            expect(rng.seed).toBe(123);
        });

        it('defaults seed to Date.now()', () => {
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
            const sameCount = Array.from({ length: 100 }, () => a.next() === b.next()).filter(Boolean).length;
            expect(sameCount).toBeLessThan(5);
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
    });

    describe('range()', () => {
        it('returns values within [min, max]', () => {
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
            // Should hit all values 1-6
            expect(results.size).toBe(6);
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
                const len = Math.sqrt(x * x + y * y);
                expect(len).toBeCloseTo(1, 5);
            }
        });
    });

    describe('gaussian()', () => {
        it('returns numbers centered around mean', () => {
            const rng = new Random(SEED);
            let sum = 0;
            const N = 10000;
            for (let i = 0; i < N; i++) sum += rng.gaussian(0, 1);
            const avg = sum / N;
            expect(avg).toBeCloseTo(0, 0); // within ~0.5 of 0
        });

        it('respects custom mean and stddev', () => {
            const rng = new Random(SEED);
            let sum = 0;
            const N = 10000;
            for (let i = 0; i < N; i++) sum += rng.gaussian(100, 5);
            expect(sum / N).toBeCloseTo(100, 0);
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
            expect(rng.shuffle(arr).sort()).toEqual(arr.sort());
        });
    });

    describe('shuffleInPlace()', () => {
        it('mutates the original array', () => {
            const rng = new Random(SEED);
            const arr = [1, 2, 3, 4, 5];
            const result = rng.shuffleInPlace(arr);
            expect(result).toBe(arr);
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
            // 'a' should be most common
            expect(counts.a).toBeGreaterThan(counts.b);
            expect(counts.b).toBeGreaterThan(counts.c);
        });

        it('returns last item as fallback', () => {
            const rng = new Random(SEED);
            // Edge case: all zero weights
            const result = rng.weighted(['a', 'b'], [0, 0]);
            expect(result).toBe('b');
        });
    });

    describe('pickWeighted()', () => {
        it('is an alias for weighted', () => {
            expect(Random.prototype.pickWeighted).toBe(Random.prototype.weighted);
        });
    });
});
