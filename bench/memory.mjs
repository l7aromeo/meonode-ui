// Memory behaviour: heavy state churn, mount/unmount cycles, and navigation.
//
// Ported from the "Memory Management" block of the old tests/performance.test.ts.
// These are threshold checks, not timings — they catch a leak, not a slowdown.
//
// They live here rather than in vitest for the same reason as the timings: the
// numbers depend on which files share a worker and on whether `--expose-gc` was
// passed, so under vitest they flipped between passing and failing depending on
// how the suite was invoked. As a standalone script the conditions are fixed.
//
// Exits non-zero if a threshold is exceeded, so it is still usable as a gate —
// just one you run deliberately.
import { bootDom, heapMB, makeChecks } from './_lib.mjs'

if (!global.gc) {
  throw new Error('run with --expose-gc, or heap readings include uncollected garbage and mean nothing')
}

await bootDom()

const { Div, Span, Button } = await import('../dist/esm/main.js')
const { createElement, useState } = await import('react')
const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')

const checks = makeChecks()

function mountRoot(element) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  flushSync(() => root.render(element))
  return {
    root,
    host,
    unmount() {
      flushSync(() => root.unmount())
      host.remove()
    },
  }
}

// 1. Heavy state churn with varying nodes, handlers and CSS.
{
  const STATE_UPDATES = 50
  let setN = () => {}
  const App = () => {
    const [n, setN_] = useState(0)
    setN = setN_
    return Div({
      padding: `${8 + (n % 4)}px`,
      children: Array.from({ length: 60 }, (_, i) =>
        Div({
          key: `row-${i}`,
          padding: '4px',
          backgroundColor: (i + n) % 2 === 0 ? '#fff' : '#eee',
          onClick: () => {},
          children: [Span(`item ${i} @ ${n}`), Button('go', { onClick: () => {} })],
        }),
      ),
    }).render()
  }

  const before = heapMB()
  const mounted = mountRoot(createElement(App))
  for (let i = 1; i <= STATE_UPDATES; i++) flushSync(() => setN(i))
  mounted.unmount()
  const after = heapMB()
  checks.check(`heap growth after ${STATE_UPDATES} state updates`, after - before, 150)
}

// 2. Repeated mount/unmount, which is what exercises the cache cleanup registry.
{
  const CYCLES = 20
  const PER_CYCLE = 10
  const before = heapMB()
  for (let c = 0; c < CYCLES; c++) {
    const mounts = []
    for (let i = 0; i < PER_CYCLE; i++) {
      mounts.push(mountRoot(Div({ padding: '8px', children: [Span(`c${c}-i${i}`), Button('x', { onClick: () => {} })] }).render()))
    }
    for (const m of mounts) m.unmount()
  }
  const after = heapMB()
  checks.check(`heap growth after ${CYCLES} cycles (${CYCLES * PER_CYCLE} mounts/unmounts)`, after - before, 20)
}

// 3. Navigation: alternating page trees, which is where stale cache entries
//    would accumulate if the unmount path stopped evicting them.
{
  const NAVIGATIONS = 10
  const page = label =>
    Div({
      padding: '12px',
      children: Array.from({ length: 40 }, (_, i) => Div({ key: `${label}-${i}`, padding: '4px', children: Span(`${label} ${i}`) })),
    }).render()

  const before = heapMB()
  let mounted = mountRoot(page('a'))
  for (let i = 0; i < NAVIGATIONS; i++) {
    mounted.unmount()
    mounted = mountRoot(page(i % 2 === 0 ? 'b' : 'a'))
  }
  mounted.unmount()
  const after = heapMB()
  checks.check(`heap growth after ${NAVIGATIONS} navigations`, after - before, 20)
}

await checks.report('memory')
