// @vitest-environment jsdom
//
// `disableEmotion` propagates from a parent to its children, and that
// propagation must not escape the subtree it came from.
//
// `processRawNode` builds a new BaseNode to carry the flag, but `BaseNode`
// stores the `rawProps` object it is given by reference. Writing
// `newNode.rawProps.disableEmotion = true` therefore wrote through to the
// original node's props: a node used in two places, where only one parent
// disabled Emotion, was permanently mutated and lost its styling everywhere.
import { render, cleanup } from '@testing-library/react'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'

afterEach(() => {
  cleanup()
  BaseNode.elementCache.clear()
})

describe('disableEmotion propagation', () => {
  it('does not mutate the source node it was applied to', () => {
    const shared = Div({ padding: '8px', children: 'x' })

    render(Div({ disableEmotion: true, children: [shared] }).render())

    expect(shared.rawProps.disableEmotion).toBeUndefined()
  })

  it('leaves a shared node styled under a parent that does not disable Emotion', () => {
    // The user-visible symptom. One node rendered under two parents: the first
    // disables Emotion, the second does not. The second must still get a class.
    const shared = Div({ padding: '8px', 'data-testid': 'shared', children: 'x' })

    render(Div({ disableEmotion: true, children: [shared] }).render())
    const { container } = render(Div({ children: [shared] }).render())

    const el = container.querySelector('[data-testid="shared"]') as HTMLElement
    expect(el).not.toBeNull()
    expect(el.className).toMatch(/css-/)
  })

  it('still applies the flag inside the subtree that asked for it', () => {
    // Non-vacuity: the fix must not simply stop propagating.
    const child = Div({ padding: '8px', 'data-testid': 'child', children: 'x' })
    const { container } = render(Div({ disableEmotion: true, children: [child] }).render())

    const el = container.querySelector('[data-testid="child"]') as HTMLElement
    expect(el).not.toBeNull()
    expect(el.className).not.toMatch(/css-/)
  })

  it('leaves a node that already opted out alone', () => {
    // No new instance is needed when the child already has the flag.
    const child = Div({ padding: '8px', disableEmotion: true, children: 'x' })
    const parent = Div({ disableEmotion: true, children: [child] })

    const kids = parent.props.children
    const first = (Array.isArray(kids) ? kids[0] : kids) as BaseNode

    expect(first).toBe(child)
  })
})
