// @vitest-environment jsdom
//
// React semantics that must survive compilation: refs, state, effects,
// controlled inputs, keys, and hydration.
//
// Runs under both `bun run test` and `bun run test:compiled`. In the compiled
// run the call sites in this file are rewritten by the real SWC plugin into
// `__meo$c`/`__meo$d`/`__meo$k` marker props, so the same assertions exercise
// the marker contract rather than the legacy classification path.
//
// The compiled path reorders props into buckets and precomputes the stable key,
// which is exactly the kind of change that could plausibly break ref
// attachment, hydration matching, or update propagation — none of which the
// prop-level equivalence fixtures in the compiler repo can catch, because they
// compare emitted source rather than rendered behaviour.
import { it } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { createElement, createRef, useEffect, useRef, useState, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { act } from 'react'
import { vi } from 'vitest'
import { Div, Input, Button, Span, ThemeProvider, type Theme } from '@src/main.js'
import { COMPILED_MARKER } from '@src/constant/common.const.js'

const COMPILED = process.env.MEONODE_COMPILED === '1'

const THEME: Theme = {
  mode: 'light',
  system: { colors: { primary: 'rgb(1, 2, 3)' }, spacing: { md: '16px' } },
}

afterEach(cleanup)

describe(`React lifecycle under ${COMPILED ? 'COMPILED' : 'uncompiled'} call sites`, () => {
  it('is actually running in the expected mode', () => {
    // Guard: without this, a broken compiled config would silently run the
    // legacy path twice and report two green suites.
    const node = Div({ padding: '8px', children: 'x' })
    const isMarked = COMPILED_MARKER in (node.rawProps as Record<string, unknown>)
    expect(isMarked).toBe(COMPILED)
  })

  it('attaches an object ref to the real DOM node', () => {
    const ref = createRef<HTMLDivElement>()
    render(Div({ ref, 'data-testid': 'target', padding: '8px', children: 'hi' }).render())
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.getAttribute('data-testid')).toBe('target')
  })

  it('calls a callback ref with the element and with null on unmount', () => {
    const seen: (HTMLElement | null)[] = []
    const view = render(
      Div({
        ref: (el: HTMLElement | null) => {
          seen.push(el)
        },
        children: 'hi',
      }).render(),
    )
    expect(seen[0]).toBeInstanceOf(HTMLElement)
    view.unmount()
    expect(seen.at(-1)).toBeNull()
  })

  it('propagates state changes into the DOM', () => {
    const App = () => {
      const [n, setN] = useState(0)
      return Div({
        children: [Span(`count: ${n}`, { 'data-testid': 'count' }), Button('inc', { 'data-testid': 'inc', onClick: () => setN(v => v + 1) })],
      }).render() as ReactNode
    }
    const { getByTestId } = render(createElement(App))
    expect(getByTestId('count').textContent).toBe('count: 0')
    fireEvent.click(getByTestId('inc'))
    expect(getByTestId('count').textContent).toBe('count: 1')
    fireEvent.click(getByTestId('inc'))
    expect(getByTestId('count').textContent).toBe('count: 2')
  })

  it('runs effects and their cleanup', () => {
    const order: string[] = []
    const App = () => {
      useEffect(() => {
        order.push('mount')
        return () => {
          order.push('cleanup')
        }
      }, [])
      return Div({ children: 'effectful' }).render() as ReactNode
    }
    const view = render(createElement(App))
    expect(order).toEqual(['mount'])
    view.unmount()
    expect(order).toEqual(['mount', 'cleanup'])
  })

  it('keeps a controlled input controlled', () => {
    const App = () => {
      const [value, setValue] = useState('a')
      return Div({
        children: [
          Input({ 'data-testid': 'field', value, onChange: (e: { target: { value: string } }) => setValue(e.target.value), padding: '4px' }),
          Span(value, { 'data-testid': 'echo' }),
        ],
      }).render() as ReactNode
    }
    const { getByTestId } = render(createElement(App))
    const field = getByTestId('field') as HTMLInputElement
    expect(field.value).toBe('a')
    fireEvent.change(field, { target: { value: 'abc' } })
    expect(field.value).toBe('abc')
    expect(getByTestId('echo').textContent).toBe('abc')
  })

  it('preserves identity across re-render when a key is given', () => {
    // Compilation must not disturb `key`: the same key has to keep the same
    // DOM node across a reorder.
    const App = ({ reversed }: { reversed: boolean }) => {
      const items = reversed ? ['b', 'a'] : ['a', 'b']
      return Div({ children: items.map(id => Div({ key: id, 'data-testid': `item-${id}`, children: id })) }).render() as ReactNode
    }
    const view = render(createElement(App, { reversed: false }))
    const firstA = view.getByTestId('item-a')
    view.rerender(createElement(App, { reversed: true }))
    expect(view.getByTestId('item-a')).toBe(firstA)
  })

  it('keeps a ref stable across a state-driven re-render', () => {
    const seen: (HTMLElement | null)[] = []
    const App = () => {
      const ref = useRef<HTMLDivElement>(null)
      const [n, setN] = useState(0)
      useEffect(() => {
        seen.push(ref.current)
      })
      return Div({
        ref,
        children: [Span(`n=${n}`, { 'data-testid': 'n' }), Button('go', { 'data-testid': 'go', onClick: () => setN(v => v + 1) })],
      }).render() as ReactNode
    }
    const { getByTestId } = render(createElement(App))
    fireEvent.click(getByTestId('go'))
    expect(getByTestId('n').textContent).toBe('n=1')
    expect(seen.length).toBeGreaterThan(1)
    expect(seen[0]).toBe(seen.at(-1))
  })
})

describe(`hydration under ${COMPILED ? 'COMPILED' : 'uncompiled'} call sites`, () => {
  /** React reports hydration problems through console.error, so that is what to watch. */
  function captureHydrationErrors() {
    const messages: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      messages.push(args.map(String).join(' '))
    })
    return { messages, restore: () => spy.mockRestore() }
  }

  const HYDRATION_MARKERS = [/did not match/i, /hydration failed/i, /server rendered/i, /text content does not match/i, /server html/i]

  function hydrateAndCollect(tree: () => ReactNode) {
    const html = renderToString(tree())
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)

    const { messages, restore } = captureHydrationErrors()
    let root: ReturnType<typeof hydrateRoot>
    act(() => {
      root = hydrateRoot(container, tree())
    })
    restore()
    const offending = messages.filter(m => HYDRATION_MARKERS.some(p => p.test(m)))
    return {
      html,
      container,
      offending,
      cleanup: () => {
        act(() => root.unmount())
        container.remove()
      },
    }
  }

  it('hydrates a themed tree with no mismatch', () => {
    const tree = () =>
      ThemeProvider({
        theme: THEME,
        children: Div({
          padding: 'theme.spacing.md',
          color: 'theme.colors.primary',
          'data-testid': 'root',
          children: [Span('hello', { fontSize: '12px' }), Div({ children: 'nested' })],
        }),
      }).render() as ReactNode

    const { html, offending, cleanup: done } = hydrateAndCollect(tree)

    // Non-vacuity: an empty render would trivially "not mismatch".
    expect(html.length).toBeGreaterThan(50)
    expect(offending).toEqual([])
    done()
  })

  it('hydrates and then accepts interaction', () => {
    // A tree that hydrates but is inert would pass the check above; this makes
    // sure the hydrated tree is actually wired up.
    const App = () => {
      const [n, setN] = useState(0)
      return Div({
        children: [Span(`v=${n}`, { 'data-testid': 'v' }), Button('bump', { 'data-testid': 'bump', onClick: () => setN(x => x + 1) })],
      }).render() as ReactNode
    }
    const html = renderToString(createElement(App))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)

    const { messages, restore } = captureHydrationErrors()
    let root: ReturnType<typeof hydrateRoot>
    act(() => {
      root = hydrateRoot(container, createElement(App))
    })
    restore()

    expect(messages.filter(m => HYDRATION_MARKERS.some(p => p.test(m)))).toEqual([])
    const bump = container.querySelector('[data-testid="bump"]') as HTMLElement
    act(() => {
      bump.click()
    })
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('v=1')

    act(() => root.unmount())
    container.remove()
  })

  it.skipIf(!COMPILED)('emits markers in the very tree being hydrated', () => {
    // Pins that the hydration cases above are exercising compiled call sites
    // rather than passing for the trivial reason that nothing was compiled.
    const node = Div({ padding: '8px', children: 'x' })
    expect(COMPILED_MARKER in (node.rawProps as Record<string, unknown>)).toBe(true)
  })
})
