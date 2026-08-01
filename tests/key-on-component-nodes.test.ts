// @vitest-environment jsdom
//
// MeoNode does not *require* a `key`: children are spread variadically into
// `createElement(target, props, ...children)`, so React never demands one. But
// not requiring it is different from refusing it — a caller who wants to pin
// identity across a reorder must be able to say so, on any kind of node.
//
// Two things stopped that working on `Component`:
//
//   1. `ComponentNodeProps<TProps>` did not include `key`, so passing one was a
//      type error: `'key' does not exist in type 'TProps & ...'`.
//   2. Even cast past the types it had no effect. A factory child stays a
//      BaseNode and is rendered inside its parent's loop unwrapped, so its key
//      reaches React. A `Component` child has already called `.render()`, so
//      what lands in the children array is the `MeoNodeUnmounter` wrapper —
//      which carried no key, leaving React with an unkeyed element.
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { Div, Component } from '@src/main.js'
import type { NodeElement } from '@src/types/node.type.js'

const Item = Component<{ id: string }>(({ id }) => Div({ 'data-testid': `i-${id}`, children: id }))

/** Renders ['a','b'], re-renders reversed, reports whether 'a' kept its DOM node. */
function keepsIdentityAcrossReorder(build: (id: string) => NodeElement, testId: (id: string) => string) {
  const App = ({ reversed }: { reversed: boolean }) => Div({ children: (reversed ? ['b', 'a'] : ['a', 'b']).map(build) }).render() as never

  const view = render(createElement(App, { reversed: false }))
  const before = view.getByTestId(testId('a'))
  view.rerender(createElement(App, { reversed: true }))
  const same = view.getByTestId(testId('a')) === before
  view.unmount()
  return same
}

describe('key on Component nodes', () => {
  it('is accepted without a cast', () => {
    // The compile-time half. `key` is not part of the component's own props, so
    // it has to come from `ComponentNodeProps`. If this stops type-checking the
    // type regressed, whatever the runtime does.
    const node = Item({ key: 'k1', id: 'a' })

    expect(node).toBeDefined()
  })

  it('pins DOM identity across a reorder', () => {
    expect(
      keepsIdentityAcrossReorder(
        id => Item({ key: id, id }),
        id => `i-${id}`,
      ),
    ).toBe(true)
  })

  it('matches a factory node, which already worked', () => {
    expect(
      keepsIdentityAcrossReorder(
        id => Div({ key: id, 'data-testid': `f-${id}`, children: id }),
        id => `f-${id}`,
      ),
    ).toBe(true)
  })

  it('stays optional', () => {
    // The ergonomic promise: omitting `key` is still fine and must not warn.
    // Children go out variadically, so React never asks for one.
    const messages: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
      messages.push(a.map(String).join(' '))
    })
    const view = render(Div({ children: ['a', 'b'].map(id => Item({ id })) }).render() as never)
    spy.mockRestore()

    expect(messages.filter(m => /unique "key"/i.test(m))).toEqual([])
    expect(view.getByTestId('i-a')).toBeTruthy()
    view.unmount()
  })

  it('does not reach the component as a prop', () => {
    // `key` is React's, never the component's.
    let seen: Record<string, unknown> | undefined
    const Probe = Component<{ id: string }>(props => {
      seen = props as Record<string, unknown>
      return Div({ children: props.id })
    })

    render(Div({ children: [Probe({ key: 'k1', id: 'a' })] }).render() as never)

    expect(seen).toBeDefined()
    // Checked by own-key enumeration, not `in`: React 19 installs a warning
    // getter named `key` on every props object, so `'key' in props` is true
    // even when no key was passed.
    expect(Object.keys(seen!)).toEqual(['id'])
    expect(seen!.key).toBeUndefined()
    expect(seen!.id).toBe('a')
  })
})
