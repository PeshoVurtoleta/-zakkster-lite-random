# Changelog

All notable changes to `@zakkster/lite-random` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-04-25

### Added
- **`getState()` / `setState(state)`** — Serialize and restore the internal 32-bit
  Mulberry32 state. Resume a sequence anywhere — perfect for save files, rollback
  netcode, and golden-master testing. Both methods return `this` for chaining.
- **`unitVectorArray(outArray, index?)`** — Zero-GC unit vector written directly
  into a flat array or `Float32Array` at a given index. Built for ECS component
  buffers and tight particle loops.
- **`unitVector(out?)`** — Optional `out` parameter mutates an existing
  `{ x, y }` object instead of allocating a new one. Drop-in for hot paths.
- **`reset()` now returns `this`** — Matches `setState()` for fluent chaining
  (`rng.reset(seed).next()`).

### Fixed
- **`int(min, max)` was biased on negative ranges.** The previous implementation
  used `| 0` (ToInt32 — truncation toward zero), which made `int(-5, 5)` return
  `-5` with effectively zero probability and double-counted `0`. Now uses
  `Math.floor` for a uniform distribution across all integers in `[min, max]`.
  Verified: across 1.1M samples of `int(-5, 5)`, every bucket now lands within
  ±0.5% of the expected 9.09%.
- **Long-run state drift after ~4.9M calls** — `next()` now clamps the state
  addition to 32 bits (`(state + 0x6D2B79F5) | 0`), preventing float-precision
  drift from breaking determinism on long sessions.
- **`weighted()` is now safe under length mismatch** — When
  `items.length !== weights.length`, only the overlapping prefix is considered.
  Previously, an out-of-bounds read or `NaN` accumulation was possible.

### Documentation
- `range()` JSDoc now correctly states `[min, max)` (it always was — only the
  doc lied).
- `gaussian()` documented as always consuming exactly 2 `next()` calls
  (predictable for replay).
- README expanded with Mermaid diagrams for the deterministic-replay flow,
  Mulberry32 state evolution, and weighted-loot distribution.
- New "Migration" section in the README for v1.0.x → v1.1.0.

### Internal
- Test suite expanded from 22 to 45 cases, including:
  - Regression test for the `int()` negative-range bias.
  - 5M-call drift regression test.
  - Coverage for `getState`/`setState`/`unitVectorArray` and the `unitVector(out)`
    fast path.
  - 68-95-99.7 sanity check on `gaussian()`.
- Fixed `Random.test.js` import path (was importing from `Random.d.ts` —
  declaration-only, no runtime; tests had silently never executed).

## [1.0.6] — Previous

- Baseline release. Mulberry32 PRNG, `range`, `int`, `chance`, `bool`, `sign`,
  `unitVector`, `gaussian`, `pick`, `shuffle`, `shuffleInPlace`, `weighted`,
  `pickWeighted`.
