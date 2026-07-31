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

/** `--json` prints raw JSON instead of a table, for piping into other tooling. */
const AS_JSON = process.argv.includes('--json')

/**
 * Flattens nested payloads to dotted keys so any shape renders as two columns.
 * @param value The payload to flatten.
 * @param prefix Accumulated key path.
 * @param out Accumulator.
 * @returns Rows of `[key, value]`.
 */
function flatten(value, prefix = '', out = []) {
  for (const [k, v] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out.push([key, Array.isArray(v) ? v.join(', ') : String(v)])
  }
  return out
}

async function table(head, colWidths) {
  const { default: Table } = await import('cli-table3')
  return new Table({ head, colWidths, wordWrap: true })
}

export async function report(name, payload) {
  const body = { benchmark: name, nodeEnv: process.env.NODE_ENV, ...payload }
  if (AS_JSON) {
    console.log(JSON.stringify(body, null, 2))
    return
  }
  const t = await table(['Metric', 'Value'], [46, 62])
  for (const [k, v] of flatten(payload)) t.push([k, v])
  console.log(`\n${name}  (NODE_ENV=${process.env.NODE_ENV})`)
  console.log(t.toString())
}

export function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'))
}

/**
 * Boots a jsdom window and installs the globals `@meonode/ui` and React need.
 *
 * `history` and `location` matter more than they look: `BaseNode`'s constructor
 * starts `NavigationCacheManagerUtil`, which patches history methods, and
 * `_navigationStarted` is only set *after* `start()` returns. Without them every
 * node construction throws and retries, and a benchmark silently measures
 * exception handling instead of rendering.
 * @returns The jsdom instance, in case a caller needs to tear it down.
 */
export async function bootDom() {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
  globalThis.history = dom.window.history
  globalThis.location = dom.window.location
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.Element = dom.window.Element
  globalThis.Node = dom.window.Node
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame

  // Fail loudly rather than quietly benchmarking an error path.
  process.on('uncaughtException', e => {
    console.error('BENCH ABORT:', e)
    process.exit(1)
  })
  return dom
}

/** Heap in MB after a forced collection, so a pending GC cannot be read as growth. */
export function heapMB() {
  if (global.gc) {
    global.gc()
    global.gc()
  }
  return process.memoryUsage().heapUsed / 1024 / 1024
}

/**
 * Records a threshold check. Unlike the vitest versions these do not fail a
 * build — they report, and the script exits non-zero only if something regressed,
 * so the numbers stay visible either way.
 */
export function makeChecks() {
  const results = []
  return {
    check(label, actual, limit, unit = 'MB') {
      const ok = actual < limit
      results.push({ label, actual: +actual.toFixed(2), limit, unit, ok })
      return ok
    },
    async report(name) {
      if (AS_JSON) {
        console.log(JSON.stringify({ benchmark: name, checks: results }, null, 2))
      } else {
        const t = await table(['Check', 'Actual', 'Limit', ''], [56, 12, 12, 6])
        for (const r of results) t.push([r.label, `${r.actual} ${r.unit}`, `${r.limit} ${r.unit}`, r.ok ? 'ok' : 'FAIL'])
        console.log(`\n${name}  (NODE_ENV=${process.env.NODE_ENV})`)
        console.log(t.toString())
      }
      const failed = results.filter(r => !r.ok)
      if (failed.length) {
        console.error(`\n${failed.length} threshold(s) exceeded:`)
        for (const f of failed) console.error(`  ${f.label}: ${f.actual}${f.unit} >= ${f.limit}${f.unit}`)
        process.exit(1)
      }
    },
  }
}
