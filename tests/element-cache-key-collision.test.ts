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
