/**
 * @zakkster/lite-random — Zero-dependency Seeded RNG & Game Utilities
 *
 * Powered by Mulberry32: deterministic, fast, holds state in a single 32-bit integer.
 * Designed for 60fps game loops — zero allocations, no closures, direct execution.
 */

export class Random {
    /**
     * @param {number} seed - Initialize with a specific seed for deterministic results
     */
    constructor(seed = Date.now()) {
        this.seed = seed;
        this._state = seed;
    }

    /** Core PRNG (Mulberry32). Returns deterministic float in [0, 1). */
    next() {
        let t = this._state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Reset the RNG to a specific seed (or the original seed). Enables deterministic replay. */
    reset(seed) {
        if (seed !== undefined) this.seed = seed;
        this._state = this.seed;
    }

    /** Random float between min and max. */
    range(min, max) { return min + this.next() * (max - min); }

    /** Random integer between min and max (inclusive). */
    int(min, max) { return Math.floor(this.range(min, max + 1)); }

    /** Returns true with probability p (0–1). e.g., chance(0.2) = 20% chance. */
    chance(p) { return this.next() < p; }

    /** 50/50 chance to return true or false. */
    bool() { return this.next() < 0.5; }

    /** 50/50 chance to return -1 or 1. Great for random left/right velocities. */
    sign() { return this.next() < 0.5 ? -1 : 1; }

    /**
     * Returns a random normalized 2D directional vector { x, y }.
     * Multiply by speed to shoot particles in random directions.
     */
    unitVector() {
        const theta = this.next() * Math.PI * 2;
        return { x: Math.cos(theta), y: Math.sin(theta) };
    }

    /**
     * Gaussian (normal) distribution using Box-Muller transform.
     * Returns a value centered at 0 with standard deviation 1.
     * ~68% of values fall within ±1, ~95% within ±2.
     * Great for natural-looking particle spread.
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

    /** Pick a random element from an array. */
    pick(arr) {
        if (!arr || !arr.length) return null;
        return arr[Math.floor(this.next() * arr.length)];
    }

    /**
     * Fisher-Yates shuffle (in-place). Mutates the array. GC-friendly.
     * @returns {Array} The same array reference.
     */
    shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
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
     */
    weighted(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = this.range(0, totalWeight);

        for (let i = 0; i < items.length; i++) {
            if (random < weights[i]) return items[i];
            random -= weights[i];
        }
        return items[items.length - 1];
    }
}

// Ergonomic alias on prototype (zero memory per instance)
Random.prototype.pickWeighted = Random.prototype.weighted;

export default Random;
