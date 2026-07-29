// Node construction + prop processing + stable key, in isolation.
//
// The narrowest of the three benchmarks: no React, no Emotion, no DOM. It
// measures only what the compiler directly replaces — per-key CSS/DOM
// classification and prop-signature hashing — so it is the *upper bound* on
// what compiling can buy, not a page-level figure.
//
// Usage: NODE_ENV=production node bench/node-construction.mjs
import { JSDOM } from 'jsdom'
import { compare, report } from './_lib.mjs'

// `_getStableKey` returns early when `isServer`, so this has to run with a
// `window` present or the very work being measured is skipped.
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.history = dom.window.history
globalThis.location = dom.window.location

const { Div } = await import('../dist/esm/main.js')
const { COMPILED_MARKER, COMPILER_SCHEMA_KEYS } = await import('../dist/esm/constant/common.const.js')

const SK = COMPILER_SCHEMA_KEYS[2]
const DEPTH = 3
const BREADTH = 4 // 85 nodes
const ITERATIONS = Number(process.env.ITERATIONS || 150)

const buildLegacy = (depth, path) =>
  Div({
    id: `n-${path}`,
    'data-testid': `n-${path}`,
    padding: '20px',
    backgroundColor: 'red',
    margin: '4px',
    borderRadius: '4px',
    display: 'flex',
    color: '#333',
    onClick: () => {},
    children: depth > 0 ? Array.from({ length: BREADTH }, (_, i) => buildLegacy(depth - 1, `${path}-${i}`)) : [`leaf ${path}`],
  })

const buildCompiled = (depth, path) =>
  Div({
    [COMPILED_MARKER]: 2,
    [SK.css]: { padding: '20px', backgroundColor: 'red', margin: '4px', borderRadius: '4px', display: 'flex', color: '#333' },
    [SK.dom]: { id: `n-${path}`, 'data-testid': `n-${path}`, onClick: () => {} },
    [SK.key]: `site-${path}`,
    children: depth > 0 ? Array.from({ length: BREADTH }, (_, i) => buildCompiled(depth - 1, `${path}-${i}`)) : [`leaf ${path}`],
  })

// Construction alone is lazy: `props` is a getter, so without forcing it the
// benchmark would measure the constructor and nothing else.
function forceProps(node) {
  void node.props
  const children = node.rawProps.children
  if (!children) return
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child && child.isBaseNode) forceProps(child)
  }
}

const run = build => () => {
  const t0 = performance.now()
  for (let i = 0; i < ITERATIONS; i++) forceProps(build(DEPTH, `r${i}`))
  return performance.now() - t0
}

const legacy = run(buildLegacy)
const compiled = run(buildCompiled)
for (let i = 0; i < 3; i++) {
  legacy()
  compiled()
}

const result = compare({ rounds: 8, a: legacy, b: compiled, labelA: 'uncompiledMs', labelB: 'compiledMs' })

report('node-construction', {
  nodesPerTree: 85,
  treesPerRound: ITERATIONS,
  uncompiledMs: result.uncompiledMs,
  compiledMs: result.compiledMs,
  compiledSpeedup: result.ratio,
})
