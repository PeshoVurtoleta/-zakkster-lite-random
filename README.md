# @zakkster/lite-random

[![npm version](https://img.shields.io/npm/v/@zakkster/lite-random.svg?style=for-the-badge&color=latest)](https://www.npmjs.com/package/@zakkster/lite-random)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@zakkster/lite-random?style=for-the-badge)](https://bundlephobia.com/result?p=@zakkster/lite-random)
![TypeScript](https://img.shields.io/badge/TypeScript-Types-informational)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Zero-dependency seeded RNG built for games, not data science.

**Deterministic. Fast. Zero allocations. Game-ready API out of the box.**

## Why This Library?

Most RNG libraries on npm are built for statisticians. They return closures and thunks (`random.uniform(0, 1)()`), creating garbage in a tight 60fps game loop. They ship Poisson distributions when you need a dice roll.

`@zakkster/lite-random` is different:

- **No GC spikes** — direct execution (`rng.range(0, 1)`), zero allocations per call
- **Deterministic replay** — same seed = same sequence, every time. Replay bugs, test edge cases, ship replays
- **Game-ready API** — loot drops (`weighted()`), critical hits (`chance()`), 2D physics (`unitVector()`, `sign()`)
- **Mulberry32 PRNG** — entire state in a single 32-bit integer. Blazing fast, minimal memory
- **Natural distribution** — `gaussian()` for particle spread, procedural terrain, organic variation
- **Zero dependencies** — < 1KB minified

You don't need a statistics library to make a scratch card. You need `rng.chance(0.05)` and `rng.weighted()`.

## Installation

```bash
npm install @zakkster/lite-random
```

## Quick Start

```javascript
import { Random } from '@zakkster/lite-random';

const rng = new Random(42); // deterministic seed

rng.next();           // 0.0–1.0 float
rng.range(5, 10);     // float in [5, 10)
rng.int(1, 6);        // integer 1–6 inclusive (dice roll)
rng.chance(0.2);      // 20% chance → true/false
rng.bool();           // 50/50
rng.sign();           // -1 or 1
rng.pick(['a','b']);   // random element
rng.gaussian(0, 1);   // normal distribution
```

## Benchmarks & Comparison

### Micro‑Benchmarks (Chrome M1, 2026)
| Operation        | Ops/sec |
|------------------|---------|
| `rng.next()`     | ~200M   |
| `rng.range()`    | ~180M   |
| `rng.int()`      | ~170M   |
| `rng.chance()`   | ~190M   |
| `rng.gaussian()` | ~40M    |

### Comparison
| Feature | lite‑random | Math.random | random-js | seedrandom |
|---------|-------------|-------------|-----------|------------|
| Deterministic | ✔ | ✘ | ✔ | ✔ |
| Zero allocations | ✔ | ✔ | ✘ | ✔ |
| Game‑focused API | ✔ | ✘ | ✘ | ✘ |
| <1KB | ✔ | ✔ | ✘ | ✘ |
| Weighted selection | ✔ | ✘ | ✔ | ✘ |
| Gaussian | ✔ | ✘ | ✔ | ✘ |
| unitVector() | ✔ | ✘ | ✘ | ✘ |


## API Reference

| Method | Returns | Description |
|--------|---------|-------------|
| `new Random(seed?)` | | Create RNG. Defaults to `Date.now()`. |
| `.next()` | `number` | Float in [0, 1) |
| `.reset(seed?)` | | Reset to seed (or original). Replay levels. |
| `.range(min, max)` | `number` | Float in [min, max) |
| `.int(min, max)` | `number` | Integer in [min, max] inclusive |
| `.chance(p)` | `boolean` | True with probability p |
| `.bool()` | `boolean` | 50/50 |
| `.sign()` | `-1 \| 1` | Random direction multiplier |
| `.unitVector()` | `{x, y}` | Normalized 2D direction |
| `.gaussian(mean?, std?)` | `number` | Normal distribution (Box-Muller) |
| `.pick(arr)` | `T \| null` | Random element |
| `.shuffle(arr)` | `T[]` | New shuffled array |
| `.shuffleInPlace(arr)` | `T[]` | Mutates in-place (GC-friendly) |
| `.weighted(items, weights)` | `T` | Weighted random selection |
| `.pickWeighted(...)` | `T` | Alias for `.weighted()` |

## Recipes

### Weighted Loot Drops

The core of any game economy. Weights don't need to sum to 100 — they're relative:

```javascript
const loot = rng.weighted(
    ['Common', 'Rare', 'Epic', 'Legendary'],
    [60, 25, 10, 5]
);

// With item objects
const drop = rng.weighted(
    [{ name: 'Potion', value: 10 }, { name: 'Sword', value: 500 }],
    [90, 10]
);
```

### Procedural Dungeon Generation

Build deterministic levels that play the same every time for the same seed:

```javascript
const rng = new Random(levelSeed);

for (const room of rooms) {
    if (rng.chance(0.3)) spawnEnemies(room);
    if (rng.chance(0.1)) spawnTreasure(room);
    if (rng.chance(0.02)) spawnBoss(room);
}
```

### Deterministic Particle Burst

Reset the seed before a burst so the pattern is always identical — perfect for polished VFX:

```javascript
rng.reset(123);
for (let i = 0; i < 20; i++) {
    const dir = rng.unitVector();
    emitter.emit({
        vx: dir.x * rng.range(100, 300),
        vy: dir.y * rng.range(100, 300),
        life: rng.range(0.5, 1.5),
    });
}
```

### Weighted Enemy Spawning

Harder enemies become more common as the player progresses:

```javascript
const wave = rng.weighted(
    ['Slime', 'Goblin', 'Orc', 'Dragon'],
    [Math.max(0, 60 - level * 5), 25, 10 + level, 5 + level * 2]
);
```

### Random Walk / Brownian Motion

Simple but effective for fireflies, dust particles, or ambient movement:

```javascript
function updateFirefly(firefly, rng) {
    firefly.x += rng.range(-1, 1);
    firefly.y += rng.range(-1, 1);
}
```

### Natural-Looking Particle Spread

`gaussian()` clusters values near the center with natural falloff — much better than flat `range()` for particle effects:

```javascript
emitter.emitBurst(50, () => ({
    x: origin.x + rng.gaussian(0, 30),  // clustered near center
    y: origin.y + rng.gaussian(0, 30),
    vx: rng.gaussian(0, 50),             // most go slow, few go fast
    vy: rng.gaussian(-100, 40),           // mostly upward
    life: 1 + rng.gaussian(0, 0.3),      // ~1s ± 0.3s
}));
```

### Shuffle a Deck of Cards

In-place shuffle for zero allocations:

```javascript
const deck = rng.shuffleInPlace(cards);   // mutates, GC-friendly
const hand = rng.shuffle(deck);           // copy, original intact
```

### Deterministic Replay

The killer feature for bug reports and competitive games:

```javascript
// Record
const gameSeed = Date.now();
const rng = new Random(gameSeed);
saveReplay({ seed: gameSeed, inputs: [...] });

// Replay — identical sequence guaranteed
const rng = new Random(replay.seed);
```

### Random Sign for Directional Variety

```javascript
// Random left/right velocity
particle.vx = rng.sign() * rng.range(50, 150);

// Random clockwise/counterclockwise spin
particle.rotation = rng.sign() * rng.range(1, 5);
```

## TypeScript

Full generic support — `pick()`, `shuffle()`, and `weighted()` preserve element types:

```typescript
import { Random } from '@zakkster/lite-random';

const rng = new Random(42);
const item: string = rng.pick(['sword', 'shield', 'potion'])!;
const shuffled: number[] = rng.shuffle([1, 2, 3, 4, 5]);
```

## License

MIT
