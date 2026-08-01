// @vitest-environment jsdom
//
// A portal layer component may return a node, the way every sample on the
// portal-system docs page does — none of the six calls `.render()`.
//
// `PortalLayerRenderer` handed the component straight to `createElement`, so
// React received a `BaseNode` and threw "Objects are not valid as a React
// child". Returning a React element worked; returning a node did not.
//
// The `Component` HOC already normalises this exact case — a node return is
// rendered rather than rejected — so portals were the inconsistent one.
import { render, fireEvent } from '@testing-library/react'
import { createElement, useState } from 'react'
import { Div, Text, Button, PortalProvider, PortalHost, usePortal, type PortalLayerProps, type PortalLayerComponent } from '@src/main.js'

interface CounterData {
  count: number
}

// Typed as the public `PortalLayerComponent`, and passed to `open()` with no
// cast. If the type narrowed back to `React.ComponentType` this stops compiling,
// which is the compile-time half of the fix.
function mount(Modal: PortalLayerComponent<CounterData>) {
  const App = () => {
    const [count] = useState(7)
    const portal = usePortal<CounterData>({ count })
    return Div({
      children: [Button('open', { 'data-testid': 'open', onClick: () => portal.open(Modal) })],
    }).render() as never
  }
  const view = render(PortalProvider({ children: [createElement(App), PortalHost()] }).render() as never)
  fireEvent.click(view.getByTestId('open'))
  return view
}

describe('portal layer return values', () => {
  it('accepts a component that returns a node', () => {
    // The documented shape: no `.render()`.
    const Modal = ({ data, close }: PortalLayerProps<CounterData>) =>
      Div({ children: [Text(`count: ${data.count}`, { 'data-testid': 'cnt' }), Button('close', { onClick: close })] })

    const view = mount(Modal)

    expect(view.getByTestId('cnt').textContent).toBe('count: 7')
  })

  it('still accepts a component that returns a React element', () => {
    // The shape that already worked, and must keep working.
    const Modal = ({ data }: PortalLayerProps<CounterData>) => Div({ children: Text(`count: ${data.count}`, { 'data-testid': 'cnt2' }) }).render()

    const view = mount(Modal)

    expect(view.getByTestId('cnt2').textContent).toBe('count: 7')
  })

  it('closes from inside the layer', () => {
    // Non-vacuity: the layer is really mounted and wired, not just rendered.
    const Modal = ({ data, close }: PortalLayerProps<CounterData>) =>
      Div({ children: [Text(`count: ${data.count}`, { 'data-testid': 'cnt3' }), Button('close', { 'data-testid': 'close', onClick: close })] })

    const view = mount(Modal)
    expect(view.getByTestId('cnt3')).toBeTruthy()

    fireEvent.click(view.getByTestId('close'))

    expect(view.queryByTestId('cnt3')).toBeNull()
  })
})
