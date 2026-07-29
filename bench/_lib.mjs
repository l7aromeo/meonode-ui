// Shared helpers for the standalone benchmarks.
//
// These live outside vitest deliberately. Vitest forces `NODE_ENV=test`, which
// resolves React to its **development** build — and that build's validation
// overhead dominates, to the point that it reported the compiler's client-side
// gain as 1.03x when the real figure is 1.47x. `NODE_ENV=production` cannot be
// forced under vitest either: vite's dev-server machinery fails outright with
// "No such built-in module: node:".
//
// Running as plain node scripts also restores `--cpu-prof` (vitest's forked
// workers make it capture nothing) and stdout (vitest intercepts console).
import { readFileSync } from 'node:fs'

if (process.env.NODE_ENV !== 'production') {
  throw new Error('benchmarks must run with NODE_ENV=production — dev React measures overhead no deployed app pays')
}

/** Median, so a single GC pause cannot move the headline number. */
export function median(xs) {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

/**
 * Runs two variants alternately and reports medians.
 *
 * Alternating matters: measuring one order only charges the second variant for
 * the first's accumulated heap, which swung a re-render ratio between 1.16 and
 * 0.50 across runs before this was fixed.
 */
export function compare({ rounds = 8, a, b, labelA = 'a', labelB = 'b' }) {
  const resA = []
  const resB = []
  for (let i = 0; i < rounds; i++) {
    if (global.gc) global.gc()
    if (i % 2 === 0) {
      resA.push(a())
      resB.push(b())
    } else {
      resB.push(b())
      resA.push(a())
    }
  }
  const ma = median(resA)
  const mb = median(resB)
  return { [labelA]: +ma.toFixed(3), [labelB]: +mb.toFixed(3), ratio: +(ma / mb).toFixed(2), rawA: resA, rawB: resB }
}

export function report(name, payload) {
  console.log(JSON.stringify({ benchmark: name, nodeEnv: process.env.NODE_ENV, ...payload }, null, 2))
}

export function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'))
}
