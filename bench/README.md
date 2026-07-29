# Benchmarks

Standalone node scripts, deliberately **not** vitest tests.

## Why not vitest

Every perf measurement problem this project has hit traced back to running
benchmarks under vitest:

| Symptom | Cause |
| --- | --- |
| Client speedup measured as 1.03x; real figure is 1.81x | vitest forces `NODE_ENV=test`, so React resolves to its **development** build, whose validation overhead dominates |
| Metrics table invisible in CI logs | vitest intercepts `console` (needs `--disable-console-intercept`) |
| Memory assertions flip pass/fail between invocations | thresholds sit within noise, and results depend on which files share a worker |
| `--cpu-prof` captures nothing useful | vitest runs tests in forked workers |

`NODE_ENV=production` cannot simply be forced under vitest either — vite's
dev-server machinery fails with `Error: No such built-in module: node:`.

So the authoritative numbers come from here. `tests/performance.test.ts` stays
as a **regression guard** (it asserts the compiled path never falls below the
legacy one) but its absolute figures are measured against dev React and should
not be quoted.

## Running

```bash
NODE_ENV=production node bench/node-construction.mjs
NODE_ENV=production node bench/client-render.mjs
```

Or via the package scripts, which set `NODE_ENV` and `--expose-gc` for you:

```bash
bun run bench
```

Profiling works normally, because these are ordinary node processes:

```bash
NODE_ENV=production node --cpu-prof --cpu-prof-dir=prof bench/client-render.mjs
```

## What each measures

- **`node-construction.mjs`** — construction, `processProps`, and stable-key
  work only. No React, no Emotion, no DOM. This is the *upper bound* on what
  compiling can buy, not a page-level number.
- **`client-render.mjs`** — mount plus re-renders through React and jsdom.
  Closest to what a user experiences. Matters specifically because
  `_getStableKey` returns early when `isServer`, so `__meo$k` is only ever
  consumed on the client — SSR benchmarks never exercised it at all.

For end-to-end SSR, see `e2e/bench-theme-tokens.mjs` in the `@meonode/compiler`
repo, which drives the real wasm plugin at the docs site's token density.

## Conventions

Both scripts alternate the two variants and report medians. Measuring one order
only charges the second variant for the first's accumulated heap — that bias
once swung a re-render ratio between 1.16 and 0.50 across runs.

Both abort loudly rather than reporting a number if something is wrong: a
missing `history` global once made every node construction throw, and the
benchmark quietly measured exception handling instead of rendering.
