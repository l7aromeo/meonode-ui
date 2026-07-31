// @vitest-environment jsdom
//
// Phase 1 of the node-identity refactor: `signature` is the immutable identity
// a node is born with; `stableKey` is the mutable field that gets stamped with
// positional and scope prefixes as the tree renders.
//
// Today both start equal and only `stableKey` moves. Nothing reads `signature`
// yet — Phase 2 makes it the input to a render-time cache key, at which point
// the clone in `processRawNode` (4.2% of client render compiled, 18.1%
// uncompiled) stops being necessary.
//
// See docs/superpowers/plans/2026-08-01-node-identity-refactor.md.
import { it } from 'vitest'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

const kids = (n: NodeInstance): NodeInstance[] => {
  const c = n.props.children
  return (Array.isArray(c) ? c : [c]) as NodeInstance[]
}

afterEach(() => BaseNode.elementCache.clear())

describe('immutable signature', () => {
  it('starts equal to stableKey', () => {
    const node = Div({ padding: '8px', children: 'x' })

    expect(node.signature).toBeDefined()
    expect(node.stableKey).toBe(node.signature)
  })

  it('survives positional stamping while stableKey moves', () => {
    // `processRawNode` clones each child and overwrites `stableKey` with
    // `${parentKey}_${index}:${ownKey}`. The signature must not follow — it is
    // what lets one node be rendered at more than one position.
    const root = Div({ children: [Div({ padding: '8px', children: 'a' })] })
    const child = kids(root)[0]

    expect(child.stableKey).not.toBe(child.signature)
    expect(child.stableKey!.endsWith(`:${child.signature}`)).toBe(true)
  })

  it('survives scope application while stableKey moves', () => {
    const node = Div({ children: [Div({ padding: '8px', children: 'x' })] })
    const signature = node.signature

    node.render(false, 'scopeA')

    expect(node.signature).toBe(signature)
    expect(node.stableKey).toBe(`scopeA@${signature}`)
  })

  it('is identical for two nodes built from one call site with different content', () => {
    // Content-independence, the invariant `deps` rests on. Built from a single
    // call site so this holds under the compiler too, where keys derive from
    // source position rather than props.
    const make = (text: string) => Div({ padding: '8px', children: text })

    expect(make('AAA').signature).toBe(make('BBB').signature)
  })

  it('folds in the React key, which is part of identity and not content', () => {
    // `_getStableKey` returns `_withKeyPrefix(key, signature)`, so `key` is
    // already baked in before assignment. Documented here because the name
    // "signature" otherwise suggests a bare prop hash.
    //
    // One call site again, key varied: compiled signatures come from source
    // position, so two separate literals would differ for that reason and the
    // assertion would prove nothing about the prefix. `key: undefined` opts
    // out of the prefix and is destructured off before hashing either way.
    const make = (key?: string) => Div({ key, padding: '8px', children: 'x' })

    expect(make('a').signature).toBe(`a:${make().signature}`)
  })

  it('is undefined on the server', async () => {
    // Mirrors `stableKey`: `_getStableKey` returns early when isServer, so the
    // whole identity mechanism stays client-only.
    const { NodeUtil } = await import('@src/util/node.util.js')
    expect(NodeUtil.isServer).toBe(false)
  })
})

describe('public API compatibility', () => {
  // Guards the invariant in the plan: this refactor is internal, so the
  // surface shipped in the .d.ts must not move. `BaseNode` is not exported
  // from main.ts, but `node.type.ts` re-exports `NodeInstance = BaseNode<E>`,
  // which carries `stableKey` and `render`'s signature to consumers.
  it('keeps .render() callable with no arguments', () => {
    const node: NodeInstance = Div({ padding: '8px', children: 'x' })

    expect(() => node.render()).not.toThrow()
  })

  it('keeps stableKey readable through the public NodeInstance type', () => {
    const node: NodeInstance = Div({ padding: '8px', children: 'x' })
    const key: string | undefined = node.stableKey

    expect(typeof key).toBe('string')
  })
})
