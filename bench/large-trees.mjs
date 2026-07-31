// Large-tree rendering: flat breadth and deep nesting.
//
// Replaces the "Layout Rendering" cases from the old tests/performance.test.ts.
// The deep-nesting case doubles as a stack-safety check — `render()` walks
// iteratively with an explicit work stack precisely so 10k levels do not blow
// the call stack, and a regression there would throw rather than run slowly.
import { bootDom, median, report } from './_lib.mjs'

await bootDom()

const { Div, Span } = await import('../dist/esm/main.js')
const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')

const FLAT_NODES = Number(process.env.FLAT_NODES || 10000)
const NESTED_NODES = Number(process.env.NESTED_NODES || 10000)
const ROUNDS = Number(process.env.ROUNDS || 5)

function mount(tree) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  const t0 = performance.now()
  flushSync(() => root.render(tree))
  const ms = performance.now() - t0
  flushSync(() => root.unmount())
  host.remove()
  return ms
}

function flatTree() {
  const children = new Array(FLAT_NODES)
  for (let i = 0; i < FLAT_NODES; i++) children[i] = Span(`n${i}`, { padding: '1px', color: '#333' })
  return Div({ children }).render()
}

function nestedTree() {
  let node = Span('leaf', { padding: '1px' })
  for (let i = 0; i < NESTED_NODES; i++) node = Div({ padding: '1px', children: node })
  return node.render()
}

// A realistic page shape: mixed depth and breadth rather than one degenerate axis.
function layoutTree() {
  const section = (title, rows) =>
    Div({
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      children: [
        Span(title, { fontSize: '20px', fontWeight: 'bold' }),
        ...Array.from({ length: rows }, (_, i) =>
          Div({
            padding: '8px',
            margin: '4px',
            backgroundColor: i % 2 === 0 ? '#fff' : '#eee',
            display: 'flex',
            children: [Span(`row ${i}`, { flex: 1 }), Span(`v${i}`, { color: '#666' })],
          }),
        ),
      ],
    })

  return Div({
    display: 'flex',
    flexDirection: 'column',
    children: [
      Div({ padding: '12px', backgroundColor: '#111', children: Span('header', { color: '#fff' }) }),
      section('features', 40),
      section('article', 60),
      section('testimonials', 30),
      Div({ padding: '12px', children: Span('footer', { color: '#666' }) }),
    ],
  }).render()
}

const measure = build => {
  for (let i = 0; i < 2; i++) mount(build())
  return median(Array.from({ length: ROUNDS }, () => mount(build())))
}

const layoutMs = measure(layoutTree)
const flatMs = measure(flatTree)
const nestedMs = measure(nestedTree)

await report('large-trees', {
  singlePageLayoutMs: +layoutMs.toFixed(2),
  flatNodes: FLAT_NODES,
  flatMs: +flatMs.toFixed(2),
  nestedNodes: NESTED_NODES,
  nestedMs: +nestedMs.toFixed(2),
})
