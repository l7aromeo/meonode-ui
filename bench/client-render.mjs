// Client-side benchmark: mount, re-render, and hydration, compiled vs uncompiled.
//
// This is the measurement the project was missing. `_getStableKey` returns
// early when `isServer`, so `__meo$k` — the compiler's call-site hash — is only
// ever consumed on the client. Every SSR benchmark therefore measured
// partitioning and the theme rewrite alone and left the stable-key work
// entirely unmeasured.
//
// Usage:
//   NODE_ENV=production node bench/client-render.mjs
//   NODE_ENV=production node --cpu-prof --cpu-prof-dir=prof bench/client-render.mjs
import { JSDOM } from 'jsdom'
import { compare, report } from './_lib.mjs'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
// `history` matters: BaseNode's constructor starts NavigationCacheManagerUtil,
// which patches history methods. Without it every construction throws, and the
// benchmark silently measures exception handling instead of rendering.
globalThis.history = dom.window.history
globalThis.location = dom.window.location
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Element = dom.window.Element
globalThis.Node = dom.window.Node
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame

// Fail loudly rather than quietly measuring an error path.
process.on('uncaughtException', e => {
  console.error('BENCH ABORT:', e)
  process.exit(1)
})

const { Div } = await import('../dist/esm/main.js')
const { COMPILED_MARKER, COMPILER_SCHEMA_KEYS } = await import('../dist/esm/constant/common.const.js')
const { createElement, useState } = await import('react')
const { createRoot } = await import('react-dom/client')
// `act` is stripped from production React; `flushSync` is the production-safe
// way to force a synchronous commit.
const { flushSync } = await import('react-dom')

const SK = COMPILER_SCHEMA_KEYS[2]
const DEPTH = 3
const BREADTH = 4 // 85 nodes
const RERENDERS = Number(process.env.RERENDERS || 40)
const CYCLES = Number(process.env.CYCLES || 20)

const buildLegacy = (depth, path, tick) =>
  Div({
    id: `n-${path}`,
    padding: '20px',
    backgroundColor: 'red',
    margin: '4px',
    borderRadius: '4px',
    display: 'flex',
    color: '#333',
    onClick: () => {},
    children: depth > 0 ? Array.from({ length: BREADTH }, (_, i) => buildLegacy(depth - 1, `${path}-${i}`, tick)) : [`leaf ${path} ${tick}`],
  })

// What the plugin emits for the same source. Note `dyn` omits `onClick`: an
// inline function literal hashes to a constant, so listing it only costs a
// `toString()` and a hash per render.
const buildCompiled = (depth, path, tick) =>
  Div({
    [COMPILED_MARKER]: 2,
    [SK.css]: { padding: '20px', backgroundColor: 'red', margin: '4px', borderRadius: '4px', display: 'flex', color: '#333' },
    [SK.dom]: { id: `n-${path}`, onClick: () => {} },
    [SK.key]: `site-${path}`,
    children: depth > 0 ? Array.from({ length: BREADTH }, (_, i) => buildCompiled(depth - 1, `${path}-${i}`, tick)) : [`leaf ${path} ${tick}`],
  })

function cycleFor(build) {
  return () => {
    let setTick = () => {}
    const App = () => {
      const [tick, set] = useState(0)
      setTick = set
      return build(DEPTH, 'r', tick).render()
    }
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)

    const t0 = performance.now()
    flushSync(() => root.render(createElement(App)))
    for (let i = 1; i <= RERENDERS; i++) flushSync(() => setTick(i))
    const ms = performance.now() - t0

    flushSync(() => root.unmount())
    host.remove()
    return ms
  }
}

const legacy = cycleFor(buildLegacy)
const compiled = cycleFor(buildCompiled)

for (let i = 0; i < 5; i++) {
  legacy()
  compiled()
}

const result = compare({ rounds: CYCLES, a: legacy, b: compiled, labelA: 'uncompiledMs', labelB: 'compiledMs' })

if (result.ratio < 0.5 || result.ratio > 5) {
  throw new Error(`implausible ratio ${result.ratio} — harness is measuring something other than render work`)
}

report('client-render', {
  nodesPerTree: 85,
  rerendersPerCycle: RERENDERS,
  cycles: CYCLES,
  uncompiledMs: result.uncompiledMs,
  compiledMs: result.compiledMs,
  compiledSpeedup: result.ratio,
})
