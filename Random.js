/**
 * @zakkster/lite-random — Zero-dependency Seeded RNG & Game Utilities
 *
 * Powered by Mulberry32: deterministic, fast, holds state in a single 32-bit integer.
 * Designed for 60fps game loops — zero allocations, no closures, direct execution.
 *
 * v1.1 Improvements:
 * - Strict 32-bit state clamping (fixes long-run drift after ~4.9M calls)
 * - `int()` now uses Math.floor — fixes truncation bias on negative ranges
 *   (previously, `int(-5, 5)` could never return -5 and over-returned 0)
 * - `getState()` / `setState()` for serialization & deterministic replay
 * - Zero-GC `unitVector(out)` and `unitVectorArray(outArray, index)` for ECS buffers
 * - `reset()` now returns `this` for chainability (matches `setState()`)
 * - `weighted()` is robust to length mismatch between items and weights
 */

export class Random {
    /**
     * @param {number} [seed] - Initialize with a specific seed for deterministic results.
     *                          Defaults to Date.now().
     */
    constructor(seed = Date.now()) {
        this.seed = seed | 0;      // Clamp initial seed to 32-bit signed int. Date.now() exceeds 32 bits.
        this._state = this.seed;   // Internal 32-bit state
    }

    /** Core PRNG (Mulberry32). Returns deterministic float in [0, 1). */
    next() {
        // Clamp addition to 32-bit to prevent precision loss after ~4.9M calls
        let t = this._state = (this._state + 0x6D2B79F5) | 0;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Reset the RNG to a specific seed (or the original seed). Enables deterministic replay.
     * @returns {this} for chainability
     */
    reset(seed) {
        if (seed !== undefined) this.seed = seed | 0;
        this._state = this.seed;
        return this;
    }

    /** Extract internal 32-bit state for serialization. */
    getState() {
        return this._state;
    }

    /**
     * Inject internal 32-bit state to resume a sequence perfectly.
     * @returns {this} for chainability
     */
    setState(state) {
        this._state = state | 0;
        return this;
    }

    /** Random float in [min, max). */
    range(min, max) {
        return min + this.next() * (max - min);
    }

    /**
     * Random integer in [min, max] inclusive.
     * Uses Math.floor (not `| 0`) to avoid truncation-toward-zero bias on negative ranges.
     */
    int(min, max) {
        return Math.floor(min + this.next() * (max - min + 1));
    }

    /** Returns true with probability p (0–1). e.g., chance(0.2) = 20% chance. */
    chance(p) {
        return this.next() < p;
    }

    /** 50/50 chance to return true or false. */
    bool() {
        return this.next() < 0.5;
    }

    /** 50/50 chance to return -1 or 1. Great for random left/right velocities. */
    sign() {
        return this.next() < 0.5 ? -1 : 1;
    }

    /**
     * Random normalized 2D vector written to an object.
     * V8 Fast-Path: Monomorphic {x, y} shape.
     *
     * @param {{x:number, y:number}} [out] - Optional target object to mutate (Zero-GC).
     * @returns {{x:number, y:number}}
     */
    unitVector(out) {
        const theta = this.next() * Math.PI * 2;
        const x = Math.cos(theta);
        const y = Math.sin(theta);

        if (out) {
            out.x = x;
            out.y = y;
            return out;
        }
        return { x, y }; // fallback allocation (rare)
    }

    /**
     * Random normalized 2D vector written to a flat array or TypedArray.
     * Essential for ECS component buffers and Zero-GC data packing.
     *
     * @param {Float32Array|number[]} outArray - The array to mutate.
     * @param {number} [index=0] - The starting index (e.g., entityId * 2).
     * @returns {Float32Array|number[]}
     */
    unitVectorArray(outArray, index = 0) {
        const theta = this.next() * Math.PI * 2;
        outArray[index]     = Math.cos(theta);
        outArray[index + 1] = Math.sin(theta);
        return outArray;
    }

    /**
     * Gaussian (normal) distribution using Box-Muller transform.
     * Returns a value centered at `mean` with standard deviation `stddev`.
     * ~68% of values fall within ±1σ, ~95% within ±2σ.
     * Great for natural-looking particle spread.
     *
     * Note: Always consumes exactly 2 calls to next() — predictable for replay.
     *
     * @param {number} [mean=0]
     * @param {number} [stddev=1]
     */
    gaussian(mean = 0, stddev = 1) {
        const u1 = this.next() || 1e-10; // prevent log(0)
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z * stddev;
    }

    /** Pick a random element from an array. Returns null for empty/null/undefined arrays. */
    pick(arr) {
        if (!arr || !arr.length) return null;
        return arr[(this.next() * arr.length) | 0];
    }

    /**
     * Fisher-Yates shuffle (in-place). Mutates the array. GC-friendly.
     * @returns {Array} The same array reference.
     */
    shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = (this.next() * (i + 1)) | 0;

            // Old-school swap to avoid temporary array allocation
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    /**
     * Fisher-Yates shuffle (copy). Returns a new shuffled array.
     */
    shuffle(arr) {
        return this.shuffleInPlace([...arr]);
    }

    /**
     * Weighted random selection.
     * e.g., Loot drops: weighted(['Common','Rare','Epic'], [70, 20, 10])
     *
     * Weights need not sum to 100; they're relative. Negative weights are not supported.
     * If `items.length !== weights.length`, only the overlapping prefix is considered.
     */
    weighted(items, weights) {
        // Iterate only over the overlap to avoid out-of-bounds reads on length mismatch
        const len = items.length < weights.length ? items.length : weights.length;

        let total = 0;
        for (let i = 0; i < len; i++) total += weights[i];

        let r = this.next() * total;

        for (let i = 0; i < len; i++) {
            if (r < weights[i]) return items[i];
            r -= weights[i];
        }
        // Fallback for total === 0 or float drift on the last bucket
        return items[len - 1];
    }
}

// Ergonomic alias on prototype (zero memory per instance)
Random.prototype.pickWeighted = Random.prototype.weighted;

export default Random;
