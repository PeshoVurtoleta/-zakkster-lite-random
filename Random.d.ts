export declare class Random {
    /** The seed used to initialize (or last reset to) the generator. */
    seed: number;
    /** Internal 32-bit Mulberry32 state. Prefer getState()/setState() for serialization. */
    _state: number;

    constructor(seed?: number);

    /** Core PRNG (Mulberry32). Returns float in [0, 1). */
    next(): number;

    /** Reset to a seed (or the original). Enables deterministic replay. Returns `this`. */
    reset(seed?: number): this;

    /** Extract internal 32-bit state for serialization. */
    getState(): number;

    /** Inject internal 32-bit state to resume a sequence perfectly. Returns `this`. */
    setState(state: number): this;

    /** Random float in [min, max). */
    range(min: number, max: number): number;

    /** Random integer in [min, max] inclusive. Unbiased on negative ranges. */
    int(min: number, max: number): number;

    /** Returns true with probability p (0–1). */
    chance(p: number): boolean;

    /** 50/50 boolean. */
    bool(): boolean;

    /** Returns -1 or 1. */
    sign(): -1 | 1;

    /**
     * Random normalized 2D direction vector.
     * Pass `out` to write into an existing object (Zero-GC fast path).
     */
    unitVector(): { x: number; y: number };
    unitVector<T extends { x: number; y: number }>(out: T): T;

    /**
     * Random normalized 2D direction written into a flat array or TypedArray
     * at `index` (x) and `index + 1` (y). Essential for ECS component buffers.
     */
    unitVectorArray<T extends Float32Array | Float64Array | number[]>(
        outArray: T,
        index?: number
    ): T;

    /** Gaussian distribution via Box-Muller. Always consumes 2 next() calls. */
    gaussian(mean?: number, stddev?: number): number;

    /** Pick a random element. Returns null for empty/null/undefined arrays. */
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
