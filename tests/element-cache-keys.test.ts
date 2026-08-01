// @vitest-environment jsdom
//
// Asserts the keys `elementCache` is actually populated with after a render.
//
// The other identity tests assert `stableKey`, which positional stamping writes
// and which Phase 3 removes. These assert observable cache state instead, so
// they keep working once stamping is gone and are what would catch a regression
// in the render-time key derivation.
//
// A temporary assertion during Phase 2 compared derived keys against stamped
// ones for every node the suite rendered, and found two divergences the tests
// alone missed. Both are pinned here so neither can come back silently:
//
//   - single-element arrays: `_processChildren` collapses `[x]` to `x`, so
//     array-ness is not recoverable at keying time and both must key as
//     position 0
//   - nodes without `deps` must never be cached, which is what made the
//     library's own unstamped internal nodes (function children, PortalHost,
//     MeoNodeUnmounter) harmless
//
// Keys are asserted relative to the signatures of the actual instances, never
// as literals: compiled signatures derive from source position, so hardcoding
// them would pin the mode rather than the shape.
import { render, cleanup } from '@testing-library/react'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

const kids = (n: NodeInstance): NodeInstance[] => {
  const c = n.props.children
  return (Array.isArray(c) ? c : [c]) as NodeInstance[]
}

const cacheKeys = () => new Set(BaseNode.elementCache.keys())

beforeEach(() => BaseNode.elementCache.clear())
afterEach(() => {
  cleanup()
  BaseNode.elementCache.clear()
})

describe('elementCache keys', () => {
  it('keys memoized children by position under the root', () => {
    const root = Div({ children: [Div({ padding: '8px', children: 'a' }, []), Div({ padding: '9px', children: 'b' }, [])] }, [])
    const [a, b] = kids(root)

    render(root.render())

    expect(cacheKeys()).toEqual(new Set([root.signature!, `${root.signature}_0:${a.signature}`, `${root.signature}_1:${b.signature}`]))
  })

  it('nests one positional segment per level', () => {
    const root = Div({ children: [Div({ children: [Div({ padding: '8px', children: 'deep' }, [])] }, [])] }, [])
    const mid = kids(root)[0]
    const leaf = kids(mid)[0]

    render(root.render())

    const midKey = `${root.signature}_0:${mid.signature}`
    expect(cacheKeys()).toEqual(new Set([root.signature!, midKey, `${midKey}_0:${leaf.signature}`]))
  })

  it('does not cache nodes without deps', () => {
    // The invariant that made every unstamped internal node harmless. If a
    // library-internal node ever gains `deps`, it starts being cached under a
    // key nothing derives correctly — this is the tripwire for that.
    const root = Div({ children: [Div({ padding: '8px', children: 'a' })] }, [])

    render(root.render())

    expect(cacheKeys()).toEqual(new Set([root.signature!]))
  })

  it('caches nothing when the root has no deps either', () => {
    const root = Div({ children: [Div({ padding: '8px', children: 'a' })] })

    render(root.render())

    expect(cacheKeys()).toEqual(new Set())
  })

  it('keys a bare child and a single-element array identically', () => {
    // Both wrappers are separate literals, so under the compiler their own
    // signatures differ by source position and absolute keys are not
    // comparable. The claim is that each child lands at position 0 under its
    // own parent; the child is built from one call site so its signature
    // matches on both sides.
    const makeChild = () => Div({ padding: '8px', children: 'only' }, [])

    const arrayed = Div({ children: [makeChild()] }, [])
    render(arrayed.render())
    const arrayedChild = kids(arrayed)[0]
    const arrayedKeys = cacheKeys()

    cleanup()
    BaseNode.elementCache.clear()

    const bare = Div({ children: makeChild() }, [])
    render(bare.render())
    const bareChild = kids(bare)[0]

    expect(bareChild.signature).toBe(arrayedChild.signature)
    expect(arrayedKeys).toContain(`${arrayed.signature}_0:${arrayedChild.signature}`)
    expect(cacheKeys()).toContain(`${bare.signature}_0:${bareChild.signature}`)
  })

  it('namespaces every key under a render scope', () => {
    const root = Div({ children: [Div({ padding: '8px', children: 'a' }, [])] }, [])
    const child = kids(root)[0]

    render(root.render(false, 'scopeA'))

    expect(cacheKeys()).toEqual(new Set([`scopeA@${root.signature}`, `scopeA@${root.signature}_0:${child.signature}`]))
  })

  it('reuses the same key across a re-render so memoization can hit', () => {
    // If the key moved between renders the cache would grow without ever
    // hitting — the failure mode that makes a "working" cache useless.
    const root = Div({ children: [Div({ padding: '8px', children: 'a' }, [])] }, [])

    const view = render(root.render())
    const first = cacheKeys()
    view.rerender(root.render())

    expect(cacheKeys()).toEqual(first)
  })
})
