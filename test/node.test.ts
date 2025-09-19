import { Button, Component, Div, H1, Node, P, Portal, type PortalProps, Root, Span, Text } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react'
import { createRef, useState } from 'react'
import { createSerializer, matchers } from '@emotion/jest'
import { usePortal } from '@src/hook/index.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM between tests to avoid open handles
afterEach(() => {
  cleanup()
})

describe('BaseNode - Core Functionality', () => {
  // Test Case 1: Basic Div rendering
  it('should render an empty prop Div node', () => {
    const App = Div()
    const { container } = render(App.render())
    expect(container.firstChild).toBeInTheDocument()
    expect((container.firstChild as HTMLElement)?.tagName).toBe('DIV')
  })

  it('should render a simple Div node', () => {
    const App = Div({ children: 'Hello, World!' })
    const { getByText } = render(App.render())
    expect(getByText('Hello, World!')).toBeInTheDocument()
  })

  it('should render a simple Div node using Component HOC', () => {
    const App = Div({ children: 'Hello, World!' })
    const ComponentApp = Component(() => App)
    const { getByText } = render(ComponentApp())
    expect(getByText('Hello, World!')).toBeInTheDocument()
  })

  // Test Case 2: Rendering different HTML elements
  it('should render a paragraph (P) element', () => {
    const App = P('This is a paragraph.')
    const { getByText } = render(App.render())
    expect(getByText('This is a paragraph.')).toBeInTheDocument()
    expect(getByText('This is a paragraph.').tagName).toBe('P')
  })

  it('should render an H1 heading', () => {
    const App = H1('Main Title')
    const { getByText } = render(App.render())
    expect(getByText('Main Title')).toBeInTheDocument()
    expect(getByText('Main Title').tagName).toBe('H1')
  })

  it('should render a Span element', () => {
    const App = Span('Inline Text')
    const { getByText } = render(App.render())
    expect(getByText('Inline Text')).toBeInTheDocument()
    expect(getByText('Inline Text').tagName).toBe('SPAN')
  })

  // Test Case 3: Applying basic CSS properties
  it('should apply basic CSS properties to a Div', () => {
    const App = Div({
      children: 'Styled Div',
      backgroundColor: 'red',
      color: 'blue',
      fontSize: '20px',
    })
    const { getByText } = render(App.render())
    const element = getByText('Styled Div')
    expect(element).toHaveStyleRule('background-color', 'red')
    expect(element).toHaveStyleRule('color', 'blue')
    expect(element).toHaveStyleRule('font-size', '20px')
  })

  // Test Case 4: Applying `css` prop (Emotion.js)
  it('should apply css prop for Emotion styling', () => {
    const App = Div({
      children: 'Emotion Styled Div',
      css: { border: '1px solid green', padding: '10px' },
    })
    const { getByText } = render(App.render())
    const element = getByText('Emotion Styled Div')
    expect(element).toHaveStyleRule('border', '1px solid green')
    expect(element).toHaveStyleRule('padding', '10px')
  })

  // Test Case 5: Handling multiple and nested children
  it('should render multiple children', () => {
    const App = Div({
      children: [P('First paragraph'), P('Second paragraph')],
    })
    const { getByText } = render(App.render())
    expect(getByText('First paragraph')).toBeInTheDocument()
    expect(getByText('Second paragraph')).toBeInTheDocument()
  })

  it('should render nested children', () => {
    const App = Div({
      children: Div({
        children: Span('Nested Text'),
      }),
    })
    const { getByText } = render(App.render())
    expect(getByText('Nested Text')).toBeInTheDocument()
    expect(getByText('Nested Text').tagName).toBe('SPAN')
    expect(getByText('Nested Text').parentElement?.tagName).toBe('DIV')
    expect(getByText('Nested Text').parentElement?.parentElement?.tagName).toBe('DIV')
  })

  // Test Case 6: Handling function as children (render props)
  it('should render content from a function as child', () => {
    const App = Div({
      children: () => P('Content from function'),
    })
    const { getByText } = render(App.render())
    expect(getByText('Content from function')).toBeInTheDocument()
  })

  // Test Case 7: Theme propagation and inheritance
  it('should propagate theme to children', () => {
    const myTheme = { spacing: { md: '16px' } }
    const App = Div({
      theme: myTheme,
      children: Div({
        padding: 'theme.spacing.md',
        children: 'Themed Content',
      }),
    })
    const { getByText } = render(App.render())
    const element = getByText('Themed Content')
    if (element) {
      expect(element).toHaveStyleRule('padding', '16px')
    }
  })

  it('should allow child to override inherited theme', () => {
    const parentTheme = { colors: { text: 'blue' } }
    const childTheme = { colors: { text: 'green' } }
    const App = Div({
      theme: parentTheme,
      children: P('Text with overridden theme', {
        theme: childTheme,
        color: 'theme.colors.text',
      }),
    })
    const { getByText } = render(App.render())
    const element = getByText('Text with overridden theme')
    if (element) {
      expect(element).toHaveStyleRule('color', 'green')
    }
  })

  // Test Case 8: `createChildrenFirstNode` usage (e.g., Text)
  it('should render Text component with children first', () => {
    const App = Text('Hello Text Component', { fontSize: '18px' })
    const { getByText } = render(App.render())
    const element = getByText('Hello Text Component')
    if (element) {
      expect(element).toBeInTheDocument()
      expect(element.tagName).toBe('P')
      expect(element).toHaveStyleRule('font-size', '18px')
    }
  })

  // Test Case 9: `Node` factory usage
  it('should create and render a node using the Node factory', () => {
    const App = Node('span', { children: 'Node Factory Span', className: 'my-span' })
    const { getByText } = render(App.render())
    const element = getByText('Node Factory Span')
    if (element) {
      expect(element).toBeInTheDocument()
      expect(element.tagName).toBe('SPAN')
      expect(element).toHaveClass('my-span')
    }
  })

  // Test Case 10: Root component with default styles (Emotion-based)
  it('should render Root component and apply styles via Emotion', () => {
    const App = Root({ children: 'Root Content' })
    const { getByText } = render(App.render())
    const element = getByText('Root Content')
    expect(element).toBeInTheDocument()
    expect(element).toHaveStyleRule('display', 'flex')
  })

  // Test Case 11: Props merging with nativeProps
  it('should merge nativeProps correctly', () => {
    const App = Div({
      children: 'Native Props Test',
      props: { id: 'test-id', 'data-test': 'value' },
    })
    const { getByText } = render(App.render())
    const element = getByText('Native Props Test')
    if (element) {
      expect(element).toHaveAttribute('id', 'test-id')
      expect(element).toHaveAttribute('data-test', 'value')
    }
  })

  // Test Case 12: Ref forwarding (basic check, full ref testing is complex)
  it('should allow ref to be passed', () => {
    const ref = createRef<HTMLDivElement>()
    const App = Div({ children: 'Ref Test', ref: ref })
    render(App.render())
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveTextContent('Ref Test')
  })

  // Test Case 13: toHaveStyle with inline styles
  it('should apply inline styles correctly', () => {
    const App = Node('div', { children: 'Inline Styled Div', style: { backgroundColor: 'purple', border: '2px solid orange' } })
    const { getByText } = render(App.render())
    const element = getByText('Inline Styled Div')
    if (element) {
      const style = getComputedStyle(element)
      expect(style.backgroundColor).toBe('rgb(128, 0, 128)')
      expect(style.border).toBe('2px solid orange')
    }
  })

  // Test Case 14: expect custom props type safety (compile-time check)
  it('should apply custom props with type safety', () => {
    const Comp = Div<{ 'data-custom': string }>({ 'data-custom': 'custom-value', children: 'Custom Prop Div' })
    const { getByText } = render(Comp.render())
    const element = getByText('Custom Prop Div')
    if (element) {
      expect(element).toHaveAttribute('data-custom', 'custom-value')
    }
  })

  // Test Case 15: expect custom props type error (compile-time check)
  it('should expect custom props type error', () => {
    // This line should cause a TypeScript error as intended
    // @ts-expect-error: 'data-custom' should be a string, not a number
    Div<{ 'data-custom': string }>({ 'data-custom': 2 })
  })

  // Test Case 16: Portal System
  it('should render content in a portal and unmount it', () => {
    const PortalContent = Div({ children: 'Portal Content' })
    const MyPortal = Portal(() => PortalContent)

    let portalInstance: any
    act(() => {
      portalInstance = MyPortal()
    })
    expect(document.body).toHaveTextContent('Portal Content')

    act(() => {
      portalInstance?.unmount()
    })
    expect(document.body).not.toHaveTextContent('Portal Content')
  })

  it('should handle dynamic portal creation, update, and unmounting', () => {
    const MyPortal = () => {
      const [state, setState] = useState<number>(0)
      const { setPortal, createComponent } = usePortal([state])

      const PortalContent = createComponent(({ portal, text }: { text: string } & PortalProps<any>) => {
        return Div({
          children: [
            'This is portal content!',
            state === 1 ? text : 'Initial text value',
            Button(`Update Portal (${state + 1})`, {
              onClick: () => {
                setState((s: number) => s + 1)
              },
            }),
            Button('Close Portal', {
              onClick: () => {
                portal?.unmount()
              },
            }),
          ],
        }).render()
      })

      return Div({
        children: [
          Button('Open Portal', {
            onClick: () => {
              const portal = Portal<{ text: string }>(PortalContent)({ text: `Text prop still passed after update` })
              setPortal(portal)
            },
          }),
        ],
      }).render()
    }

    const { getByText } = render(Node(MyPortal).render())
    const openButton = getByText('Open Portal')
    expect(openButton).toBeInTheDocument()

    act(() => {
      openButton.click()
    })
    expect(document.body).toHaveTextContent('This is portal content!')

    const updateButton = getByText('Update Portal (1)')
    expect(updateButton).toBeInTheDocument()
    expect(document.body).toHaveTextContent(`Initial text value`)
    act(() => {
      updateButton.click()
    })
    expect(document.body).toHaveTextContent('Update Portal (2)')
    expect(document.body).toHaveTextContent(`Text prop still passed after update`)
  })

  // Test Case 17: Display Name as expected (for debugging and React DevTools)
  it('should have correct display names for components', async () => {
    function hasDisplayName(type: any): type is { displayName: string } {
      return type && typeof type === 'object' && 'displayName' in type
    }

    // Test 1: Basic Div component display name
    const divInstance = Div({ children: 'Display Name Test' }).render()
    expect(divInstance.type).toBeDefined()
    if (hasDisplayName(divInstance.type)) {
      expect(divInstance.type.displayName).toMatch('Styled(Div)')
    }

    // Test 2: Custom component wrapped in Node
    const CustomComponent = () => Div({ children: 'Custom Component' }).render()
    const customNode = Node(CustomComponent).render()
    expect(customNode.type).toBeDefined()
    if (hasDisplayName(customNode.type)) {
      expect(customNode.type.displayName).toMatch('Styled(CustomComponent)')
    }

    // Test 3: Named function component wrapped in HOC
    const NamedComponent = Component(function MyComponent() {
      return Div({ children: 'HOC Component' })
    })
    const namedInstance = await NamedComponent()
    expect(namedInstance.type).toBeDefined()
    if (hasDisplayName(namedInstance.type)) {
      expect(namedInstance.type.displayName).toMatch('Component(MyComponent)')
    }

    // Test 4: Anonymous function component wrapped in HOC
    const AnonymousComponent = Component(() => Div({ children: 'HOC Component' }))
    const anonymousInstance = await AnonymousComponent()
    expect(anonymousInstance.type).toBeDefined()
    if (hasDisplayName(anonymousInstance.type)) {
      expect(anonymousInstance.type.displayName).toMatch('Component(AnonymousFunctionComponent)')
    }
  })
})
