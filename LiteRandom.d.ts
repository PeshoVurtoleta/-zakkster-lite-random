export declare class Random {
    seed: number;
    constructor(seed?: number);
    /** Core PRNG (Mulberry32). Returns float in [0, 1). */
    next(): number;
    /** Reset to a seed (or the original). Enables deterministic replay. */
    reset(seed?: number): void;
    /** Random float in [min, max). */
    range(min: number, max: number): number;
    /** Random integer in [min, max] inclusive. */
    int(min: number, max: number): number;
    /** Returns true with probability p (0–1). */
    chance(p: number): boolean;
    /** 50/50 boolean. */
    bool(): boolean;
    /** Returns -1 or 1. */
    sign(): -1 | 1;
    /** Random normalized 2D direction vector. */
    unitVector(): { x: number; y: number };
    /** Gaussian distribution via Box-Muller. */
    gaussian(mean?: number, stddev?: number): number;
    /** Pick a random element. Returns null for empty/null arrays. */
    pick<T>(arr: T[] | null | undefined): T | null;
    /** Fisher-Yates shuffle in-place. Returns the same array. */
    shuffleInPlace<T>(arr: T[]): T[];
    /** Fisher-Yates shuffle (returns new array). */
    shuffle<T>(arr: T[]): T[];
    /** Weighted random selection. */
    weighted<T>(items: T[], weights: number[]): T;
    /** Alias for weighted(). */
    pickWeighted<T>(items: T[], weights: number[]): T;
}
export default Random;
