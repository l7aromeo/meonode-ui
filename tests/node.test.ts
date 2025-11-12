import { Component, Div, H1, Node, P, Portal, Root, Span, Text, ThemeProvider, type Theme, type NodeInstance, Fragment, Suspense, Activity } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react'
import { createRef, useState } from 'react'
import { createSerializer, matchers } from '@emotion/jest'
import { BaseNode } from '@src/core.node.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(() => {
  cleanup()
  BaseNode.clearCaches() // Call clearCaches
})

describe('BaseNode - Core Functionality', () => {
  // Basic Div rendering
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

  // Rendering different HTML elements
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

  // Applying basic CSS properties
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

  // Applying `css` prop (Emotion.js)
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

  // Handling multiple and nested children
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

  // Handling function as children (render props)
  it('should render content from a function as child with props and context from a Provider', () => {
    function DataProvider({ children }: { children: (props: { data: string[]; loading: boolean }) => any }) {
      const [data] = useState(['User 1', 'User 2'])
      const [loading] = useState(false)

      return children({ data, loading })
    }

    // MeoNode UI usage - simple!
    const App = () =>
      Node(DataProvider, {
        children: ({ data, loading }: { data: string[]; loading: boolean }) =>
          Node('div', {
            children: loading ? 'Loading...' : data.map(user => Node('p', { children: user })),
          }).render(),
      }).render()

    const { getByText } = render(Node(App).render())
    expect(getByText('User 1')).toBeInTheDocument()
    expect(getByText('User 2')).toBeInTheDocument()
  })

  // Theme propagation and inheritance
  it('should propagate theme to children', () => {
    const myTheme: Theme = {
      mode: 'light',
      system: {
        spacing: { md: '16px' },
      },
    }

    const App = ThemeProvider({
      theme: myTheme,
      children: Div({
        children: Div({
          padding: 'theme.spacing.md',
          children: 'Themed Content',
        }),
      }),
    })

    const { getByText } = render(App.render())
    const element = getByText('Themed Content')

    if (element) {
      // Use getComputedStyle to get the actual computed CSS
      const computedStyles = window.getComputedStyle(element)
      expect(computedStyles.padding).toBe('16px')

      // Alternative: Check for specific padding properties
      expect(computedStyles.paddingTop).toBe('16px')
      expect(computedStyles.paddingRight).toBe('16px')
      expect(computedStyles.paddingBottom).toBe('16px')
      expect(computedStyles.paddingLeft).toBe('16px')
    }
  })

  // If you need to test multiple style properties:
  it('should propagate multiple theme values to children', () => {
    const myTheme: Theme = {
      mode: 'light',
      system: {
        spacing: { md: '16px', lg: '24px' },
        colors: { primary: '#3b82f6' },
      },
    }

    const App = ThemeProvider({
      theme: myTheme,
      children: Div({
        children: Div({
          padding: 'theme.spacing.md',
          margin: 'theme.spacing.lg',
          color: 'theme.colors.primary',
          children: 'Themed Content',
        }),
      }),
    })

    const { getByText } = render(App.render())
    const element = getByText('Themed Content')

    if (element) {
      const computedStyles = window.getComputedStyle(element)
      expect(computedStyles.padding).toBe('16px')
      expect(computedStyles.margin).toBe('24px')
      expect(computedStyles.color).toBe('rgb(59, 130, 246)')
    }
  })

  it('should resolve theme values from strings and functions in the css prop', () => {
    const myTheme: Theme = {
      mode: 'light',
      system: {
        colors: {
          primary: 'rgb(255, 0, 0)', // red
        },
        spacing: {
          md: '10px',
        },
      },
    }

    const App = ThemeProvider({
      theme: myTheme,
      children: Div({
        children: 'Themed Function Content',
        css: {
          padding: 'theme.spacing.md',
          color: (theme: Theme) => theme.system.colors.primary,
        },
      }),
    })

    const { getByText } = render(App.render())
    const element = getByText('Themed Function Content')

    const computedStyles = window.getComputedStyle(element)
    expect(computedStyles.padding).toBe('10px')
    expect(computedStyles.color).toBe('rgb(255, 0, 0)')
  })

  // `createChildrenFirstNode` usage (e.g., Text)
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

  // `Node` factory usage
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

  // Built-in React components (Fragment, Suspense, Activity)
  it('should not apply styling props to Fragment component', () => {
    const App = Fragment({
      children: Div({ children: 'Fragment Child' }),
      // These styling props should be ignored by Fragment
      backgroundColor: 'red',
      css: { border: '1px solid green' },
    })
    const { getByText, container } = render(App.render())

    // Verify that the child is rendered
    const childElement = getByText('Fragment Child')
    expect(childElement).toBeInTheDocument()

    // Verify that the Fragment itself does not have styling applied
    // React Fragment renders as a DocumentFragment, which does not have style properties
    expect(container.firstChild).not.toHaveStyleRule('background-color', 'red')
    expect(container.firstChild).not.toHaveStyleRule('border', '1px solid green')

    // Verify that the child element does not inherit styles from the Fragment (as Fragment should ignore them)
    expect(childElement).not.toHaveStyleRule('background-color', 'red')
    expect(childElement).not.toHaveStyleRule('border', '1px solid green')
  })

  it('should not apply styling props to Suspense component', () => {
    const App = Suspense({
      fallback: Div({ children: 'Loading...' }),
      children: Div({ children: 'Suspense Child' }),
      // These styling props should be ignored by Suspense
      backgroundColor: 'blue',
      css: { border: '1px solid yellow' },
    })
    const { getByText, container } = render(App.render())

    // Verify that the child is rendered (or fallback if not yet resolved)
    const childElement = getByText('Suspense Child')
    expect(childElement).toBeInTheDocument()

    // Verify that the Suspense component itself does not have styling applied
    // Suspense renders its children directly, or a fallback, and does not create a DOM element for itself
    expect(container.firstChild).not.toHaveStyleRule('background-color', 'blue')
    expect(container.firstChild).not.toHaveStyleRule('border', '1px solid yellow')

    // Verify that the child element does not inherit styles from Suspense (as Suspense should ignore them)
    expect(childElement).not.toHaveStyleRule('background-color', 'blue')
    expect(childElement).not.toHaveStyleRule('border', '1px solid yellow')
  })

  it('should not apply styling props to Activity component', () => {
    const App = Activity({
      children: Div({ children: 'Activity Child' }),
      // These styling props should be ignored by Activity
      backgroundColor: 'green',
      css: { border: '1px solid purple' },
    })
    const { getByText, container } = render(App.render())

    // Verify that the child is rendered
    const childElement = getByText('Activity Child')
    expect(childElement).toBeInTheDocument()

    // Verify that the Activity component itself does not have styling applied
    // Activity renders its children directly and does not create a DOM element for itself
    expect(container.firstChild).not.toHaveStyleRule('background-color', 'green')
    expect(container.firstChild).not.toHaveStyleRule('border', '1px solid purple')

    // Verify that the child element does not inherit styles from Activity (as Activity should ignore them)
    expect(childElement).not.toHaveStyleRule('background-color', 'green')
    expect(childElement).not.toHaveStyleRule('border', '1px solid purple')
  })

  it('should render Root component and apply styles via Emotion', () => {
    const App = Root({ children: 'Root Content' })
    const { getByText } = render(App.render())
    const element = getByText('Root Content')
    expect(element).toBeInTheDocument()
    expect(element).toHaveStyleRule('display', 'flex')
  })

  // Root component with default styles (Emotion-based)
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

  // Ref forwarding (basic check, full ref testing is complex)
  it('should allow ref to be passed', () => {
    const ref = createRef<HTMLDivElement>()
    const App = Div({ children: 'Ref Test', ref: ref })
    render(App.render())
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveTextContent('Ref Test')
  })

  // toHaveStyle with inline styles
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

  // expect custom props type safety (compile-time check)
  it('should apply custom props with type safety', () => {
    const Comp = Div<{ 'data-custom': string }>({ 'data-custom': 'custom-value', children: 'Custom Prop Div' })
    const { getByText } = render(Comp.render())
    const element = getByText('Custom Prop Div')
    if (element) {
      expect(element).toHaveAttribute('data-custom', 'custom-value')
    }
  })

  // expect custom props type error (compile-time check)
  it('should expect custom props type error', () => {
    // This line should cause a TypeScript error as intended
    // @ts-expect-error: 'data-custom' should be a string, not a number
    Div<{ 'data-custom': string }>({ 'data-custom': 2 })
  })

  // Portal System
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

  // Display Name as expected (for debugging and React DevTools)
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

  // Preserving Node instances in props and resolving themes
  it('should preserve Node instances passed in props and resolve their themes correctly', () => {
    const theme: Theme = {
      mode: 'light',
      system: {
        colors: {
          primary: 'rgb(255, 0, 0)',
          secondary: 'rgb(0, 0, 255)',
        },
      },
    }

    // These Node instances have theme-dependent styles.
    const ChildOne = Div({
      children: 'Child One',
      color: 'theme.colors.primary',
    })
    const ChildTwo = Div({
      children: 'Child Two',
      color: 'theme.colors.secondary',
    })

    // A component that accepts another Node instance as a prop and renders it.
    const Wrapper = (props: { childNode: NodeInstance }) => {
      return Div({
        'data-testid': 'wrapper',
        children: props.childNode,
      }).render()
    }

    // The component to be rendered.
    // It uses ThemeProvider and passes Node instances as props.
    const App = ThemeProvider({
      theme,
      children: [Node(Wrapper, { childNode: ChildOne }), Node(Wrapper, { childNode: ChildTwo })],
    })

    const { getByText, getAllByTestId } = render(App.render())

    // Check that the wrappers are rendered.
    const wrappers = getAllByTestId('wrapper')
    expect(wrappers.length).toBe(2)

    // Check ChildOne
    const elementOne = getByText('Child One')
    expect(elementOne).toBeInTheDocument()
    expect(elementOne.parentElement).toBe(wrappers[0])
    expect(window.getComputedStyle(elementOne).color).toBe('rgb(255, 0, 0)')

    // Check ChildTwo
    const elementTwo = getByText('Child Two')
    expect(elementTwo).toBeInTheDocument()
    expect(elementTwo.parentElement).toBe(wrappers[1])
    expect(window.getComputedStyle(elementTwo).color).toBe('rgb(0, 0, 255)')
  })

  // disableEmotion propagation
  it('should propagate disableEmotion to children and prevent styling', () => {
    const App = Div({
      disableEmotion: true,
      children: [
        Div({
          'data-testid': 'child1',
          children: 'Child 1',
          backgroundColor: 'red',
        }),
        () =>
          Div({
            'data-testid': 'child2',
            children: 'Child 2 (from function)',
            color: 'blue',
          }),
      ],
    })

    const { getByTestId } = render(App.render())

    const child1 = getByTestId('child1')
    expect(child1).toBeInTheDocument()
    // Emotion styles should NOT be applied
    expect(child1).not.toHaveStyleRule('background-color', 'red')

    const child2 = getByTestId('child2')
    expect(child2).toBeInTheDocument()
    // Emotion styles should NOT be applied
    expect(child2).not.toHaveStyleRule('color', 'blue')
  })

  it('should propagate disableEmotion to BaseNode children', () => {
    const ChildNode = Div({
      'data-testid': 'child-node',
      children: 'Child Node',
      padding: '10px',
    })

    const App = Div({
      disableEmotion: true,
      children: ChildNode,
    })

    const { getByTestId } = render(App.render())
    const child = getByTestId('child-node')
    expect(child).toBeInTheDocument()
    expect(child).not.toHaveStyleRule('padding', '10px')
  })
})
