// @vitest-environment jsdom
//
// Regression coverage for a client-side element-cache key collision.
//
// `processProps` has a fast path for nodes whose only props are
// `children`/`ref`/`key`/`props`/`disableEmotion`. That path called
// `_processChildren(children, disableEmotion)` and dropped the third argument,
// where the slow path passes `stableKey`. Children of every such node were
// therefore namespaced `undefined_0`, `undefined_1`, ... instead of
// `<parentKey>_0`, so memoized children of two different children-only
// wrappers computed the same key and shared one `elementCache` entry — and the
// second one rendered the first one's content.
//
// Wrapper nodes with no props other than `children` are extremely common
// (plain layout containers), which is what made this reachable.
//
// Only affects the client and only nodes carrying `deps`, since
// `shouldCacheElement` is `!isServer && stableKey && dependencies`.
// `it` is imported rather than taken from globals: the global typing does not
// expose `skipIf`, which the mode-specific cases below need.
import { it } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { act } from 'react'
import { render as clientRender } from '@src/client.js'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

/**
 * Compiled call sites key off `__meo$k`, a source-position hash, so two
 * structurally identical nodes written at different places never share a key.
 * Uncompiled call sites derive the key from props and do. Assertions about
 * shared* keys are therefore uncompiled-only — the compiled behaviour is
 * strictly better, and is what makes the collision documented here impossible.
 */
const COMPILED = process.env.MEONODE_COMPILED === '1'

const firstChild = (kids: unknown): NodeInstance => (Array.isArray(kids) ? kids[0] : kids) as NodeInstance

afterEach(() => {
  cleanup()
  // The cache is module-global; leaked entries would make these order-dependent.
  BaseNode.elementCache.clear()
})

describe('element cache key collision', () => {
  it('namespaces children of a children-only node under that node', () => {
    // The original bug: `processProps`'s fast path dropped the parent key, so
    // children of every children-only wrapper keyed as `undefined_0`.
    // Asserted against the cache rather than `stableKey`, which no longer
    // carries position.
    const parent = Div({ children: [Div({ padding: '8px', children: 'x' }, [])] }, [])
    const child = firstChild(parent.props.children)

    render(parent.render())

    const keys = [...BaseNode.elementCache.keys()]
    expect(keys.some(k => k.startsWith('undefined'))).toBe(false)
    expect(keys).toContain(`${parent.signature}_0:${child.signature}`)
  })

  it('keeps memoized children of sibling wrappers distinct', () => {
    // The realistic shape: two plain layout wrappers side by side, each holding
    // a memoized child whose props are identical and whose content differs.
    // With the parent key dropped both children keyed as `undefined_0:<sig>`
    // and the second rendered "AAA".
    const app = Div({
      children: [Div({ children: [Div({ padding: '8px', children: 'AAA' }, [])] }), Div({ children: [Div({ padding: '8px', children: 'BBB' }, [])] })],
    })

    const { container } = render(app.render())

    // The user-visible symptom was the second wrapper rendering the first
    // one's content.
    expect(container.textContent).toBe('AAABBB')

    // And the mechanism: the two memoized children must occupy distinct cache
    // entries. Both sit at index 0 of their own wrapper, so only the wrappers'
    // differing positions separate them.
    const wrappers = app.props.children as NodeInstance[]
    const a = firstChild(wrappers[0].props.children)
    const b = firstChild(wrappers[1].props.children)
    const keyA = `${app.signature}_0:${wrappers[0].signature}_0:${a.signature}`
    const keyB = `${app.signature}_1:${wrappers[1].signature}_0:${b.signature}`

    expect(keyA).not.toBe(keyB)
    const keys = [...BaseNode.elementCache.keys()]
    expect(keys).toContain(keyA)
    expect(keys).toContain(keyB)
  })

  it.skipIf(COMPILED)('does not let a child content change invalidate a memoized sibling', () => {
    // Guards the fix that was attempted first and rejected: folding the
    // children into `stableKey` fixes the collision, but the key is also the
    // prefix every descendant inherits, so a sibling's text changing would
    // evict unrelated memoized nodes on every keystroke.
    //
    // `stableKey` is positional and must stay stable across a sibling's
    // content change.
    const before = Div({ children: [Div({ padding: '8px', children: 'memoized' }, []), Div({ children: 'counter: 1' })] })
    const after = Div({ children: [Div({ padding: '8px', children: 'memoized' }, []), Div({ children: 'counter: 2' })] })

    const memoizedBefore = (before.props.children as Array<{ stableKey?: string }>)[0]
    const memoizedAfter = (after.props.children as Array<{ stableKey?: string }>)[0]

    expect(memoizedAfter.stableKey).toBe(memoizedBefore.stableKey)
  })

  it.skipIf(COMPILED)('still shares a key for two structurally identical subtrees', () => {
    // The cache has to keep working: identical structures must agree, or the
    // fix has just disabled memoization by making every key unique.
    const one = Div({ children: [Div({ padding: '8px', children: 'same' }, [])] })
    const two = Div({ children: [Div({ padding: '8px', children: 'same' }, [])] })

    expect(firstChild(one.props.children).stableKey).toBe(firstChild(two.props.children).stableKey)
  })
})

describe('render scopes', () => {
  it('separates two roots that would otherwise share positional keys', () => {
    // Case B: structurally identical trees mounted into two containers. Keys are
    // positional and bottom out at the root, so without a per-container scope
    // both compute the same keys and the second renders 'AAA'.
    const c1 = document.createElement('div')
    const c2 = document.createElement('div')
    document.body.append(c1, c2)

    let root1!: ReturnType<typeof clientRender>
    let root2!: ReturnType<typeof clientRender>
    act(() => {
      root1 = clientRender(Div({ children: [Div({ padding: '8px', children: 'AAA' }, [])] }), c1)
    })
    act(() => {
      root2 = clientRender(Div({ children: [Div({ padding: '8px', children: 'BBB' }, [])] }), c2)
    })

    expect(c1.textContent).toBe('AAA')
    expect(c2.textContent).toBe('BBB')

    act(() => {
      root1.unmount()
      root2.unmount()
    })
    c1.remove()
    c2.remove()
  })

  it('applies a scope to descendants and is idempotent', () => {
    // Scoping only the root is sufficient because a child's key is built as
    // `${parentKey}_${index}:${ownSignature}`, so the namespace propagates.
    const node = Div({ children: [Div({ padding: '8px', children: 'x' }, [])] }, [])
    const child = firstChild(node.props.children)

    render(node.render(false, 'scopeA'))

    const expected = new Set([`scopeA@${node.signature}`, `scopeA@${node.signature}_0:${child.signature}`])
    expect(new Set(BaseNode.elementCache.keys())).toEqual(expected)

    // Re-rendering under the same scope must produce the same keys. Scope used
    // to be stamped onto the instance, where a second application could stack
    // prefixes and move the key on every render so memoization never hit; it is
    // a render parameter now, so stacking is impossible by construction.
    render(node.render(false, 'scopeA'))
    expect(new Set(BaseNode.elementCache.keys())).toEqual(expected)
  })

  it.skipIf(COMPILED)('gives different scopes different keys for identical trees', () => {
    // Built from one call site so the two trees are genuinely identical —
    // uncompiled signatures derive from props, so they agree.
    const make = () => Div({ children: [Div({ padding: '8px', children: 'same' }, [])] }, [])
    const a = make()
    const b = make()

    expect(a.signature).toBe(b.signature)

    render(a.render(false, 'scope1'))
    render(b.render(false, 'scope2'))

    const keys = [...BaseNode.elementCache.keys()]
    expect(keys).toContain(`scope1@${a.signature}`)
    expect(keys).toContain(`scope2@${b.signature}`)
    // Identical trees, distinct entries: the scope is what separates them.
    expect(new Set(keys).size).toBe(4)
  })
})
