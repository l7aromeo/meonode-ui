// @vitest-environment jsdom
//
// CHARACTERIZATION TESTS — these pin the *current* shape of `stableKey`, which
// doubles as the `elementCache` key. They are expected to change when identity
// becomes a render-time parameter instead of a mutated field; they exist so
// that change is visible in a diff rather than silent.
//
// See docs/superpowers/plans/2026-08-01-node-identity-refactor.md. The measured
// motivation: work reachable from `processRawNode` is 4.2% of client render
// time compiled, 18.1% uncompiled, almost all of it `createPropSignature` +
// `hashString` recomputing a signature the original node already holds.
//
// Shapes are asserted structurally, never as literal hashes: the signature is
// `__meo$k` under the compiler and a prop hash otherwise, so literals would
// pin the mode rather than the shape.
import { it } from 'vitest'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

const COMPILED = process.env.MEONODE_COMPILED === '1'

const kids = (n: NodeInstance): NodeInstance[] => {
  const c = n.props.children
  return (Array.isArray(c) ? c : [c]) as NodeInstance[]
}

afterEach(() => BaseNode.elementCache.clear())

describe('cache key shape (characterization)', () => {
  it('gives a root node a bare signature with no positional prefix', () => {
    const root = Div({ padding: '8px', children: 'x' })

    expect(typeof root.stableKey).toBe('string')
    expect(root.stableKey).not.toContain('_0:')
    expect(root.stableKey).not.toContain('@')
  })

  it('builds a child key as `${parentKey}_${index}:${childSignature}`', () => {
    const root = Div({ children: [Div({ padding: '8px', children: 'a' }), Div({ padding: '9px', children: 'b' })] })
    const [c0, c1] = kids(root)

    expect(c0.stableKey!.startsWith(`${root.stableKey}_0:`)).toBe(true)
    expect(c1.stableKey!.startsWith(`${root.stableKey}_1:`)).toBe(true)
  })

  it('nests the prefix one level per depth', () => {
    const root = Div({ children: [Div({ children: [Div({ padding: '8px', children: 'deep' })] })] })
    const mid = kids(root)[0]
    const leaf = kids(mid)[0]

    expect(mid.stableKey!.startsWith(`${root.stableKey}_0:`)).toBe(true)
    expect(leaf.stableKey!.startsWith(`${mid.stableKey}_0:`)).toBe(true)
    // Depth shows up as accumulated `_0:` segments, which is precisely the
    // prefix-stamping that forces the clone in processRawNode.
    expect(leaf.stableKey!.match(/_0:/g)?.length).toBe(2)
  })

  it('keys a bare child and a single-element array identically', () => {
    // These used to differ: `_processChildren`'s non-array branch forwarded
    // `parentStableKey` untouched while the single-element array branch
    // appended `_0`, so `children: x` and `children: [x]` were different cache
    // identities for the same tree — code switching between the two forms
    // silently lost memoization.
    //
    // Unified when position moved to a render-time parameter. `_processChildren`
    // collapses `[x]` to `x` before the render loop sees it, so the two shapes
    // are indistinguishable at keying time and must agree. Cache keys are
    // in-memory only, so the change costs one first-render miss.
    // The two wrappers must be separate literals — one holds an array, the
    // other a bare node — so under the compiler their own signatures differ by
    // source position. Absolute keys are therefore not comparable; the claim is
    // that each child sits at position 0 *under its own parent*. The child comes
    // from a single call site so its signature is identical on both sides.
    const makeChild = () => Div({ padding: '8px', children: 'only' })
    const arrayed = Div({ children: [makeChild()] })
    const bare = Div({ children: makeChild() })

    const childSignature = kids(arrayed)[0].signature

    expect(kids(bare)[0].signature).toBe(childSignature)
    expect(kids(arrayed)[0].stableKey).toBe(`${arrayed.stableKey}_0:${childSignature}`)
    expect(kids(bare)[0].stableKey).toBe(`${bare.stableKey}_0:${childSignature}`)
  })

  it('prefixes a scoped root and propagates the scope to descendants', () => {
    const root = Div({ children: [Div({ padding: '8px', children: 'x' })] })
    const unscoped = root.stableKey

    root.render(false, 'scopeA')

    expect(root.stableKey).toBe(`scopeA@${unscoped}`)
    expect(kids(root)[0].stableKey).toContain('scopeA@')
  })

  it('keeps the key free of children content', () => {
    // The invariant every redesign must preserve: `deps` promises that content
    // changes do not invalidate, so children must never reach the signature.
    //
    // Built from one call site rather than two literals. Compiled keys come
    // from source position, so two separate `Div(...)` literals legitimately
    // differ under `__meo$k` — comparing them would test the mode, not the
    // invariant. One factory called twice varies only the content.
    const make = (text: string) => Div({ padding: '8px', children: text })

    expect(make('AAA').stableKey).toBe(make('BBB').stableKey)
  })

  it.skipIf(COMPILED)('derives the signature from props, so identical props collide', () => {
    // The collision documented in element-cache-key-collision.test.ts, pinned
    // here as a *shape* fact: uncompiled identity is prop-derived and carries
    // no call-site information. Compiled builds key off `__meo$k` and do not.
    const one = Div({ padding: '8px', children: 'x' })
    const two = Div({ padding: '8px', children: 'y' })

    expect(one.stableKey).toBe(two.stableKey)
  })

  it('is undefined on the server', async () => {
    // `_getStableKey` returns early when isServer, so the whole cache-key
    // mechanism — and the clone that stamps it — is client-only.
    const { NodeUtil } = await import('@src/util/node.util.js')
    expect(NodeUtil.isServer).toBe(false)
  })
})
