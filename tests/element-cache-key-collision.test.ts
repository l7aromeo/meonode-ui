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
import { render, cleanup } from '@testing-library/react'
import { act } from 'react'
import { render as clientRender } from '@src/client.js'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'

const firstChild = (kids: unknown): { stableKey?: string } => (Array.isArray(kids) ? kids[0] : kids) as { stableKey?: string }

afterEach(() => {
  cleanup()
  // The cache is module-global; leaked entries would make these order-dependent.
  BaseNode.elementCache.clear()
})

describe('element cache key collision', () => {
  it('namespaces children of a children-only node under that node', () => {
    const child = Div({ padding: '8px', children: 'x' }, [])
    const parent = Div({ children: [child] })

    const childKey = firstChild(parent.props.children).stableKey ?? ''

    expect(childKey).not.toMatch(/^undefined_/)
    expect(childKey.startsWith(`${parent.stableKey}_`)).toBe(true)
  })

  it('keeps memoized children of sibling wrappers distinct', () => {
    // The realistic shape: two plain layout wrappers side by side, each holding
    // a memoized child whose props are identical and whose content differs.
    // With the parent key dropped both children keyed as `undefined_0:<sig>`
    // and the second rendered "AAA".
    const app = Div({
      children: [Div({ children: [Div({ padding: '8px', children: 'AAA' }, [])] }), Div({ children: [Div({ padding: '8px', children: 'BBB' }, [])] })],
    })

    const wrappers = app.props.children as Array<{ props: { children: unknown }; stableKey?: string }>
    const keyA = firstChild(wrappers[0].props.children).stableKey
    const keyB = firstChild(wrappers[1].props.children).stableKey

    expect(keyA).not.toBe(keyB)

    const { container } = render(app.render())
    expect(container.textContent).toBe('AAABBB')
  })

  it('does not let a child content change invalidate a memoized sibling', () => {
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

  it('still shares a key for two structurally identical subtrees', () => {
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
    const node = Div({ children: [Div({ padding: '8px', children: 'x' }, [])] })
    const unscoped = node.stableKey

    node.render(false, 'scopeA')
    expect(node.stableKey).toBe(`scopeA@${unscoped}`)
    expect(firstChild(node.props.children).stableKey).toContain('scopeA@')

    // Re-rendering the same root must not stack prefixes, or the key would move
    // on every render and memoization would never hit.
    node.render(false, 'scopeA')
    expect(node.stableKey).toBe(`scopeA@${unscoped}`)
  })

  it('gives different scopes different keys for identical trees', () => {
    const a = Div({ children: [Div({ padding: '8px', children: 'same' }, [])] })
    const b = Div({ children: [Div({ padding: '8px', children: 'same' }, [])] })

    expect(a.stableKey).toBe(b.stableKey)

    a.render(false, 'scope1')
    b.render(false, 'scope2')

    expect(a.stableKey).not.toBe(b.stableKey)
    expect(firstChild(a.props.children).stableKey).not.toBe(firstChild(b.props.children).stableKey)
  })
})
