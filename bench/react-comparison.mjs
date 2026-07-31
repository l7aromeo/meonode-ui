// MeoNode against raw React.createElement.
//
// Ported from tests/react-createelement-comparison.test.ts.
//
// Reports four rows, not two. Bare `createElement` does no prop work at all,
// while MeoNode always classifies props into CSS vs DOM and computes a stable
// key — so comparing those two directly overstates the gap. The `+Props`
// variants are the like-for-like pair.
import { bootDom, compare, report } from './_lib.mjs'

await bootDom()

const { Div, Span } = await import('../dist/esm/main.js')
const { createElement } = await import('react')
const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')

const FLAT = Number(process.env.FLAT || 10000)
const NESTED = Number(process.env.NESTED || 5000)
const ROUNDS = Number(process.env.ROUNDS || 6)

// One property, matching the original test. Using several inflates React's
// cost disproportionately: React writes inline styles property-by-property
// onto the DOM node, while MeoNode emits a single Emotion class. That is a
// real architectural difference, but it is not a like-for-like unit of work,
// so widening it here would flatter MeoNode by measurement choice rather than
// by merit.
const STYLE = { color: 'black' }

function mount(element) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  const t0 = performance.now()
  flushSync(() => root.render(element))
  const ms = performance.now() - t0
  flushSync(() => root.unmount())
  host.remove()
  return ms
}

const flatReact = () => mount(createElement('div', null, Array.from({ length: FLAT }, (_, i) => createElement('span', { key: i }, `n${i}`))))

const flatReactProps = () =>
  mount(createElement('div', null, Array.from({ length: FLAT }, (_, i) => createElement('span', { key: i, style: STYLE, id: `n${i}` }, `n${i}`))))

const flatMeo = () => mount(Div({ children: Array.from({ length: FLAT }, (_, i) => Span(`n${i}`, { key: i })) }).render())

const flatMeoProps = () => mount(Div({ children: Array.from({ length: FLAT }, (_, i) => Span(`n${i}`, { key: i, ...STYLE, id: `n${i}` })) }).render())

function nestedReact(withProps) {
  return () => {
    let node = createElement('span', null, 'leaf')
    for (let i = 0; i < NESTED; i++) node = createElement('div', withProps ? { style: STYLE } : null, node)
    return mount(node)
  }
}

function nestedMeo(withProps) {
  return () => {
    let node = Span('leaf')
    for (let i = 0; i < NESTED; i++) node = Div(withProps ? { ...STYLE, children: node } : { children: node })
    return mount(node.render())
  }
}

const flatBare = compare({ rounds: ROUNDS, a: flatReact, b: flatMeo, labelA: 'reactMs', labelB: 'meonodeMs' })
const flatProps = compare({ rounds: ROUNDS, a: flatReactProps, b: flatMeoProps, labelA: 'reactMs', labelB: 'meonodeMs' })
const nestBare = compare({ rounds: ROUNDS, a: nestedReact(false), b: nestedMeo(false), labelA: 'reactMs', labelB: 'meonodeMs' })
const nestProps = compare({ rounds: ROUNDS, a: nestedReact(true), b: nestedMeo(true), labelA: 'reactMs', labelB: 'meonodeMs' })

report('react-comparison', {
  flatNodes: FLAT,
  nestedNodes: NESTED,
  flat: {
    bare: { react: flatBare.reactMs, meonode: flatBare.meonodeMs, meonodeSlowerBy: +(1 / flatBare.ratio).toFixed(2) },
    withProps: { react: flatProps.reactMs, meonode: flatProps.meonodeMs, meonodeSlowerBy: +(1 / flatProps.ratio).toFixed(2) },
  },
  nested: {
    bare: { react: nestBare.reactMs, meonode: nestBare.meonodeMs, meonodeSlowerBy: +(1 / nestBare.ratio).toFixed(2) },
    withProps: { react: nestProps.reactMs, meonode: nestProps.meonodeMs, meonodeSlowerBy: +(1 / nestProps.ratio).toFixed(2) },
  },
  note: 'compare the withProps rows; bare createElement does no prop work at all. Note the two apply styles differently — React writes inline style properties, MeoNode emits an Emotion class — so this is not a like-for-like unit of DOM work.',
})
