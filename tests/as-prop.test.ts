import { Div, P, Script, Node, type NodeInstance } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'
import React from 'react'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

afterEach(() => {
  cleanup()
  Node.clearCaches()
  document.head.querySelectorAll('style').forEach(s => s.remove())
})

describe('`as` polymorphism — runtime', () => {
  it('swaps the rendered element to the `as` target', () => {
    const App = Div({ as: 'a', href: '/home', 'data-testid': 'as-anchor', children: 'go home' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-anchor')

    expect(el.tagName).toBe('A')
    expect(el).toHaveAttribute('href', '/home')
    expect(el).toHaveTextContent('go home')
  })

  it('never leaks `as` as a DOM attribute', () => {
    const App = Div({ as: 'a', href: '#', 'data-testid': 'as-no-leak', children: 'x' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-no-leak')

    expect(el).not.toHaveAttribute('as')
  })

  it('still applies Emotion styles to the swapped element', () => {
    const App = Div({ as: 'a', href: '#', backgroundColor: 'red', 'data-testid': 'as-styled', children: 'styled' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-styled')

    expect(el.tagName).toBe('A')
    expect(el).toHaveStyleRule('background-color', 'red')
  })

  it('keeps the base element when `as` is omitted', () => {
    const App = Div({ 'data-testid': 'no-as', children: 'base' })

    const { getByTestId } = render(App.render())
    expect(getByTestId('no-as').tagName).toBe('DIV')
  })

  it('routes events to the swapped element at runtime', () => {
    const onClick = vi.fn()
    const App = Div({ as: 'a', href: '#', 'data-testid': 'as-click', onClick, children: 'click' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-click')
    el.click()

    expect(el.tagName).toBe('A')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('works through the children-first factory', () => {
    const App = P('hi', { as: 'span', 'data-testid': 'as-cfn' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-cfn')

    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveTextContent('hi')
  })

  it('works through the low-level Node() factory', () => {
    const App = Node('div', { as: 'a', href: '#', 'data-testid': 'as-node', children: 'node-as' })

    const { getByTestId } = render(App.render())
    const el = getByTestId('as-node')

    expect(el.tagName).toBe('A')
    expect(el).toHaveTextContent('node-as')
  })
})

describe('`as` polymorphism — types (compile-time)', () => {
  it('narrows event handlers and props to the `as` target', () => {
    Div({
      as: 'a',
      href: '#',
      onClick: e => {
        const el: HTMLAnchorElement = e.currentTarget
        void el
      },
    })

    // default path keeps the base element's event type
    Div({
      onClick: e => {
        const el: HTMLDivElement = e.currentTarget
        void el
      },
    })

    // return type narrows to the `as` target
    const node: NodeInstance<'a'> = Div({ as: 'a' })
    void node

    expect(true).toBe(true)
  })

  it('rejects invalid `as` usages at the type level', () => {
    Div({
      as: 'a',
      // @ts-expect-error - handler typed for the wrong element
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => void e,
    })

    // css strictness preserved on the `as` path
    Div({
      as: 'a',
      // @ts-expect-error - 0 is not a valid justifyContent value
      justifyContent: 0,
    })

    // `as` is gated off for NO_STYLE_TAGS
    // @ts-expect-error - `as` is not available for NO_STYLE_TAGS like <script>
    Script({ as: 'div' })

    // custom components are not supported as `as` targets (TS inference limitation:
    // `As` and the free `AdditionalProps` slot are inferred from the same object,
    // which collapses `As` to `never` for components). Use the component's own factory.
    const Comp = (props: { name: string }) => Div({ children: props.name }).render()
    Div({
      // @ts-expect-error - custom components are not supported as `as` targets
      as: Comp,
    })

    expect(true).toBe(true)
  })
})
