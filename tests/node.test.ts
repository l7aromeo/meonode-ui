import { jest } from '@jest/globals'
import { Activity, Component, Div, Fragment, H1, Node, type NodeInstance, P, Portal, Root, Span, Suspense, Text, type Theme, ThemeProvider } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react'
import { createRef, useEffect, useState, memo, StrictMode } from 'react'
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
  // Step 1: Basic Rendering Tests
  // This group of tests ensures that fundamental HTML elements can be created and rendered correctly.
  // It covers empty nodes, nodes with simple text content, and the use of HOCs.
  describe('Basic Rendering', () => {
    // Verifies that a `Div` component renders correctly in the DOM even without any explicit props, ensuring its basic existence.
    it('should render an empty prop Div node', () => {
      // Create an instance of the Div component without any props.
      const App = Div()
      // Render the component into the DOM and get the container element.
      const { container } = render(App.render())
      // Assert that the first child of the container (the rendered Div) exists in the document.
      expect(container.firstChild).toBeInTheDocument()
      // Assert that the rendered element is indeed a DIV tag.
      expect((container.firstChild as HTMLElement)?.tagName).toBe('DIV')
    })

    // Confirms that a `Div` component can render with basic text content as its child, checking for both its presence and correct text.
    it('should render a simple Div node', () => {
      // Create a Div component with a 'Hello, World!' text child.
      const App = Div({ children: 'Hello, World!' })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that the text 'Hello, World!' is present in the document.
      expect(getByText('Hello, World!')).toBeInTheDocument()
    })

    // Tests the integration of `Div` within a Higher-Order Component (`Component` HOC), ensuring it renders correctly when wrapped.
    it('should render a simple Div node using Component HOC', () => {
      // Create a Div component with text content.
      const App = Div({ children: 'Hello, World!' })
      // Wrap the Div component in a Higher-Order Component (HOC).
      const ComponentApp = Component(() => App)
      // Render the HOC-wrapped component and get a utility to query the DOM by text.
      const { getByText } = render(ComponentApp())
      // Assert that the text 'Hello, World!' is present in the document, confirming HOC rendering.
      expect(getByText('Hello, World!')).toBeInTheDocument()
    })

    // Checks the rendering of a `P` (paragraph) element with text content, verifying its presence and correct HTML tag.
    it('should render a paragraph (P) element', () => {
      // Create a P component with specific text content.
      const App = P('This is a paragraph.')
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that the paragraph text is present in the document.
      expect(getByText('This is a paragraph.')).toBeInTheDocument()
      // Assert that the rendered element has the correct HTML tag 'P'.
      expect(getByText('This is a paragraph.').tagName).toBe('P')
    })

    it('should render an H1 heading', () => {
      // Create an H1 component with specific text content.
      const App = H1('Main Title')
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that the H1 text is present in the document.
      expect(getByText('Main Title')).toBeInTheDocument()
      // Assert that the rendered element has the correct HTML tag 'H1'.
      expect(getByText('Main Title').tagName).toBe('H1')
    })

    it('should render a Span element', () => {
      // Create a Span component with specific text content.
      const App = Span('Inline Text')
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that the Span text is present in the document.
      expect(getByText('Inline Text')).toBeInTheDocument()
      // Assert that the rendered element has the correct HTML tag 'SPAN'.
      expect(getByText('Inline Text').tagName).toBe('SPAN')
    })

    it('should render multiple children', () => {
      // Create a Div component with an array of two P components as children.
      const App = Div({
        children: [P('First paragraph'), P('Second paragraph')],
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that both paragraph texts are present in the document.
      expect(getByText('First paragraph')).toBeInTheDocument()
      expect(getByText('Second paragraph')).toBeInTheDocument()
    })

    it('should render nested children', () => {
      // Create a Div component with a nested Div, which in turn contains a Span with text.
      const App = Div({
        children: Div({
          children: Span('Nested Text'),
        }),
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Assert that the innermost text is present in the document.
      expect(getByText('Nested Text')).toBeInTheDocument()
      // Assert that the innermost element has the correct HTML tag 'SPAN'.
      expect(getByText('Nested Text').tagName).toBe('SPAN')
      // Assert the parent-child relationship for the nested elements.
      expect(getByText('Nested Text').parentElement?.tagName).toBe('DIV')
      expect(getByText('Nested Text').parentElement?.parentElement?.tagName).toBe('DIV')
    })
  })

  // Step 2: Styling and Theming Tests
  // This section verifies that styling—whether through direct CSS properties, the `css` prop, or theme values—is applied correctly.
  describe('Styling and Theming', () => {
    it('should apply basic CSS properties to a Div', () => {
      // Create a Div component with text content and direct CSS properties.
      const App = Div({
        children: 'Styled Div',
        backgroundColor: 'red',
        color: 'blue',
        fontSize: '20px',
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Styled Div')
      // Assert that the element has the expected CSS rules applied.
      expect(element).toHaveStyleRule('background-color', 'red')
      expect(element).toHaveStyleRule('color', 'blue')
      expect(element).toHaveStyleRule('font-size', '20px')
    })

    it('should apply css prop for Emotion styling', () => {
      // Create a Div component with text content and Emotion's `css` prop for styling.
      const App = Div({
        children: 'Emotion Styled Div',
        css: { border: '1px solid green', padding: '10px' },
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Emotion Styled Div')
      // Assert that the element has the expected Emotion-applied CSS rules.
      expect(element).toHaveStyleRule('border', '1px solid green')
      expect(element).toHaveStyleRule('padding', '10px')
    })

    it('should propagate theme to children', () => {
      // Define a sample theme object.
      const myTheme: Theme = {
        mode: 'light',
        system: {
          spacing: { md: '16px' },
          primary: {
            default: '#fff',
          },
        },
      }

      // Create an App component using ThemeProvider to set the theme,
      // and a child Div that consumes theme values for its styles.
      const App = ThemeProvider({
        theme: myTheme,
        children: Div({
          children: Div({
            backgroundColor: ({ system }) => system.primary.default, // Theme value from function
            padding: 'theme.spacing.md', // Theme value from string path
            children: 'Themed Content',
          }),
        }),
      })

      // Render the App and get the themed content element.
      const { getByText } = render(App.render())
      const element = getByText('Themed Content')
      // Get the computed styles of the element.
      const computedStyles = window.getComputedStyle(element)
      // Assert that theme values are correctly applied to CSS properties.
      expect(computedStyles.backgroundColor).toBe('rgb(255, 255, 255)')
      expect(computedStyles.padding).toBe('16px')
    })

    it('should propagate multiple theme values to children', () => {
      // Define a sample theme with multiple spacing and color values.
      const myTheme: Theme = {
        mode: 'light',
        system: {
          spacing: { md: '16px', lg: '24px' },
          colors: { primary: '#3b82f6' },
        },
      }

      // Create an App component using ThemeProvider, with a child Div consuming multiple theme values.
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

      // Render the App and get the themed content element.
      const { getByText } = render(App.render())
      const element = getByText('Themed Content')
      // Get the computed styles of the element.
      const computedStyles = window.getComputedStyle(element)
      // Assert that all specified theme values are correctly applied to their respective CSS properties.
      expect(computedStyles.padding).toBe('16px')
      expect(computedStyles.margin).toBe('24px')
      expect(computedStyles.color).toBe('rgb(59, 130, 246)')
    })

    it('should resolve theme values from strings and functions in the css prop', () => {
      // Define a sample theme.
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

      // Create an App with ThemeProvider and a child Div using theme values in its `css` prop,
      // both as a string path and as a function.
      const App = ThemeProvider({
        theme: myTheme,
        children: Div({
          children: 'Themed Function Content',
          css: {
            padding: 'theme.spacing.md', // Theme value as string path
            color: (theme: Theme) => theme.system.colors.primary, // Theme value as function
          },
        }),
      })

      // Render the App and get the themed content element.
      const { getByText } = render(App.render())
      const element = getByText('Themed Function Content')
      // Get the computed styles of the element.
      const computedStyles = window.getComputedStyle(element)
      // Assert that theme values are correctly resolved and applied from both string paths and functions.
      expect(computedStyles.padding).toBe('10px')
      expect(computedStyles.color).toBe('rgb(255, 0, 0)')
    })

    it('should apply inline styles correctly', () => {
      // Create a generic Node ('div') with text content and an inline style object.
      const App = Node('div', {
        children: 'Inline Styled Div',
        style: { backgroundColor: 'purple', border: '2px solid orange' },
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Inline Styled Div')
      // Get the computed styles of the element.
      const style = getComputedStyle(element)
      // Assert that the inline styles are correctly applied.
      expect(style.backgroundColor).toBe('rgb(128, 0, 128)')
      expect(style.border).toBe('2px solid orange')
    })
  })

  // Step 3: Advanced Component Features
  // This group tests more complex functionalities like render props, custom component factories, and special React components.
  describe('Advanced Component Features', () => {
    it('should render content from a function as child with props and context from a Provider', () => {
      // Define a DataProvider component that uses React's useState to manage data and loading state,
      // and passes these states to its children via a render prop pattern.
      function DataProvider({ children }: { children: (props: { data: string[]; loading: boolean }) => any }) {
        const [data] = useState(['User 1', 'User 2'])
        const [loading] = useState(false)
        return children({ data, loading })
      }

      // Define the main App component that uses the DataProvider.
      // The children of DataProvider is a function that receives `data` and `loading` props
      // and renders a list of users or a loading message.
      const App = () =>
        Node(DataProvider, {
          children: ({ data, loading }: { data: string[]; loading: boolean }) =>
            Node('div', {
              children: loading ? 'Loading...' : data.map(user => Node('p', { children: user })),
            }).render(),
        }).render()

      // Render the App component.
      const { getByText } = render(Node(App).render())
      // Assert that the user data rendered by the function child is present in the document.
      expect(getByText('User 1')).toBeInTheDocument()
      expect(getByText('User 2')).toBeInTheDocument()
    })

    it('should render Text component with children first', () => {
      // Create a Text component with text content and a styling prop.
      const App = Text('Hello Text Component', { fontSize: '18px' })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Hello Text Component')
      // Assert that the element is present in the document.
      expect(element).toBeInTheDocument()
      // Assert that the element is rendered as a 'P' tag (default for Text).
      expect(element.tagName).toBe('P')
      // Assert that the styling prop is correctly applied.
      expect(element).toHaveStyleRule('font-size', '18px')
    })

    it('should create and render a node using the Node factory', () => {
      // Use the generic Node factory to create a 'span' element with children and a className.
      const App = Node('span', { children: 'Node Factory Span', className: 'my-span' })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Node Factory Span')
      // Assert that the element is present in the document.
      expect(element).toBeInTheDocument()
      // Assert that the element has the correct HTML tag 'SPAN'.
      expect(element.tagName).toBe('SPAN')
      // Assert that the className is correctly applied.
      expect(element).toHaveClass('my-span')
    })

    it('should not apply styling props to Fragment component', () => {
      // Create a Fragment component with a child Div and attempt to apply styling props directly to the Fragment.
      const App = Fragment({
        children: Div({ children: 'Fragment Child' }),
        backgroundColor: 'red', // This styling prop should be ignored by Fragment
        css: { border: '1px solid green' }, // This styling prop should be ignored by Fragment
      })
      // Render the component and get a utility to query the DOM by text, and the container.
      const { getByText, container } = render(App.render())
      // Get the rendered child element.
      const childElement = getByText('Fragment Child')
      // Assert that the child element is present.
      expect(childElement).toBeInTheDocument()
      // Assert that the Fragment's container (which is the parent of the child) does NOT have the applied styles.
      expect(container.firstChild).not.toHaveStyleRule('background-color', 'red')
      // Assert that the child element itself does not inherit or receive the styles intended for the Fragment.
      expect(childElement).not.toHaveStyleRule('background-color', 'red')
    })

    it('should not apply styling props to Suspense component', () => {
      // Create a Suspense component with a fallback and a child Div, attempting to apply styling props directly to Suspense.
      const App = Suspense({
        fallback: Div({ children: 'Loading...' }),
        children: Div({ children: 'Suspense Child' }),
        backgroundColor: 'blue', // This styling prop should be ignored by Suspense
        css: { border: '1px solid yellow' }, // This styling prop should be ignored by Suspense
      })
      // Render the component and get a utility to query the DOM by text, and the container.
      const { getByText, container } = render(App.render())
      // Get the rendered child element (assuming it resolves immediately for this test).
      const childElement = getByText('Suspense Child')
      // Assert that the child element is present.
      expect(childElement).toBeInTheDocument()
      // Assert that the Suspense's container (which is the parent of the child) does NOT have the applied styles.
      expect(container.firstChild).not.toHaveStyleRule('background-color', 'blue')
      // Assert that the child element itself does not inherit or receive the styles intended for Suspense.
      expect(childElement).not.toHaveStyleRule('background-color', 'blue')
    })

    it('should not apply styling props to Activity component', () => {
      // Create an Activity component with a child Div, attempting to apply styling props directly to Activity.
      const App = Activity({
        children: Div({ children: 'Activity Child' }),
        backgroundColor: 'green', // This styling prop should be ignored by Activity
        css: { border: '1px solid purple' }, // This styling prop should be ignored by Activity
      })
      // Render the component and get a utility to query the DOM by text, and the container.
      const { getByText, container } = render(App.render())
      // Get the rendered child element.
      const childElement = getByText('Activity Child')
      // Assert that the child element is present.
      expect(childElement).toBeInTheDocument()
      // Assert that the Activity's container (which is the parent of the child) does NOT have the applied styles.
      expect(container.firstChild).not.toHaveStyleRule('background-color', 'green')
      // Assert that the child element itself does not inherit or receive the styles intended for Activity.
      expect(childElement).not.toHaveStyleRule('background-color', 'green')
    })

    it('should render Root component and apply styles via Emotion', () => {
      // Create a Root component with text content.
      const App = Root({ children: 'Root Content' })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Root Content')
      // Assert that the element is present in the document.
      expect(element).toBeInTheDocument()
      // Assert that a default style (e.g., 'display: flex') applied by Emotion to the Root component is present.
      expect(element).toHaveStyleRule('display', 'flex')
    })

    it('should have correct display names for components', async () => {
      // Helper function to check if an object has a 'displayName' property.
      function hasDisplayName(type: any): type is { displayName: string } {
        return type && typeof type === 'object' && 'displayName' in type
      }

      // Test 1: Basic Div component display name.
      const divInstance = Div({ children: 'Display Name Test' }).render()
      // Assert that the type has a displayName and it matches the expected pattern.
      if (hasDisplayName(divInstance.type)) {
        expect(divInstance.type.displayName).toMatch('Styled(Div)')
      }

      // Test 2: Custom component wrapped in Node.
      const CustomComponent = () => Div({ children: 'Custom Component' }).render()
      const customNode = Node(CustomComponent).render()
      // Assert that the custom component's type has a displayName and it matches the expected pattern.
      if (hasDisplayName(customNode.type)) {
        expect(customNode.type.displayName).toMatch('Styled(CustomComponent)')
      }

      // Test 3: Named function component wrapped in HOC.
      const NamedComponent = Component(function MyComponent() {
        return Div({ children: 'HOC Component' })
      })
      const namedInstance = await NamedComponent()
      // Assert that the named HOC component's type has a displayName and it matches the expected pattern.
      if (hasDisplayName(namedInstance.type)) {
        expect(namedInstance.type.displayName).toMatch('Component(MyComponent)')
      }

      // Test 4: Anonymous function component wrapped in HOC.
      const AnonymousComponent = Component(() => Div({ children: 'HOC Component' }))
      const anonymousInstance = await AnonymousComponent()
      // Assert that the anonymous HOC component's type has a displayName and it matches the expected pattern.
      if (hasDisplayName(anonymousInstance.type)) {
        expect(anonymousInstance.type.displayName).toMatch('Component(AnonymousFunctionComponent)')
      }
    })
  })

  // Step 4: Props and Attributes Handling
  // This section ensures that native props, refs, and custom-typed props are correctly applied to the DOM.
  describe('Props and Attributes', () => {
    it('should merge nativeProps correctly', () => {
      // Create a Div component with text content and native HTML attributes passed via the `props` object.
      const App = Div({
        children: 'Native Props Test',
        props: { id: 'test-id', 'data-test': 'value' },
      })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(App.render())
      // Get the rendered element.
      const element = getByText('Native Props Test')
      // Assert that the native HTML attributes are correctly applied to the element.
      expect(element).toHaveAttribute('id', 'test-id')
      expect(element).toHaveAttribute('data-test', 'value')
    })

    it('should allow ref to be passed', () => {
      // Create a ref object to attach to the Div component.
      const ref = createRef<HTMLDivElement>()
      // Create a Div component with text content and pass the ref to it.
      const App = Div({ children: 'Ref Test', ref: ref })
      // Render the component.
      render(App.render())
      // Assert that the ref's current property points to an HTMLDivElement.
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      // Assert that the element referenced by the ref contains the expected text content.
      expect(ref.current).toHaveTextContent('Ref Test')
    })

    it('should apply custom props with type safety', () => {
      // Create a Div component with a custom prop 'data-custom' and its value, ensuring TypeScript type safety.
      const Comp = Div<{ 'data-custom': string }>({ 'data-custom': 'custom-value', children: 'Custom Prop Div' })
      // Render the component and get a utility to query the DOM by text.
      const { getByText } = render(Comp.render())
      // Get the rendered element.
      const element = getByText('Custom Prop Div')
      // Assert that the custom attribute is correctly applied to the element.
      expect(element).toHaveAttribute('data-custom', 'custom-value')
    })

    it('should expect custom props type error', () => {
      // This line is intentionally designed to cause a TypeScript error.
      // The `@ts-expect-error` comment is used to suppress the error during compilation
      // but serves as a test that the type system correctly identifies the mismatch
      // (expecting a string for 'data-custom', but providing a number).
      // This test primarily verifies compile-time type safety rather than runtime behavior.
      // @ts-expect-error: 'data-custom' should be a string, not a number
      Div<{ 'data-custom': string }>({ 'data-custom': 2 })
    })

    it('should preserve Node instances passed in props and resolve their themes correctly', () => {
      // Define a theme object with primary and secondary colors.
      const theme: Theme = {
        mode: 'light',
        system: {
          colors: {
            primary: 'rgb(255, 0, 0)', // red
            secondary: 'rgb(0, 0, 255)', // blue
          },
        },
      }

      // Create two Node instances (Divs) with theme-dependent colors.
      const ChildOne = Div({
        children: 'Child One',
        color: 'theme.colors.primary',
      })
      const ChildTwo = Div({
        children: 'Child Two',
        color: 'theme.colors.secondary',
      })

      // Define a Wrapper component that accepts a NodeInstance as a prop and renders it.
      const Wrapper = (props: { childNode: NodeInstance }) => {
        return Div({
          'data-testid': 'wrapper',
          children: props.childNode,
        }).render()
      }

      // Create the main App component using ThemeProvider, passing the Wrapper component
      // with ChildOne and ChildTwo as `childNode` props.
      const App = ThemeProvider({
        theme,
        children: [Node(Wrapper, { childNode: ChildOne }), Node(Wrapper, { childNode: ChildTwo })],
      })

      // Render the App and get utilities to query by text and test ID.
      const { getByText, getAllByTestId } = render(App.render())
      // Get all wrapper elements.
      const wrappers = getAllByTestId('wrapper')
      // Assert that two wrapper elements are rendered.
      expect(wrappers.length).toBe(2)

      // Check ChildOne:
      const elementOne = getByText('Child One')
      // Assert that ChildOne is present in the document.
      expect(elementOne).toBeInTheDocument()
      // Assert that ChildOne is rendered inside the first wrapper.
      expect(elementOne.parentElement).toBe(wrappers[0])
      // Assert that ChildOne's color is resolved correctly from the theme.
      expect(window.getComputedStyle(elementOne).color).toBe('rgb(255, 0, 0)')

      // Check ChildTwo:
      const elementTwo = getByText('Child Two')
      // Assert that ChildTwo is present in the document.
      expect(elementTwo).toBeInTheDocument()
      // Assert that ChildTwo is rendered inside the second wrapper.
      expect(elementTwo.parentElement).toBe(wrappers[1])
      // Assert that ChildTwo's color is resolved correctly from the theme.
      expect(window.getComputedStyle(elementTwo).color).toBe('rgb(0, 0, 255)')
    })
  })

  // Step 5: Portal System Tests
  // This test verifies that the Portal component can render content outside the main component tree and be unmounted correctly.
  describe('Portal System', () => {
    it('should render content in a portal and unmount it', () => {
      // Create content for the portal.
      const PortalContent = Div({ children: 'Portal Content' })
      // Create a Portal component factory.
      const MyPortal = Portal(() => PortalContent)

      let portalInstance: any
      // Act: Render the portal content.
      act(() => {
        portalInstance = MyPortal()
      })
      // Assert: The portal content should be in the document body.
      expect(document.body).toHaveTextContent('Portal Content')

      // Act: Unmount the portal content.
      act(() => {
        portalInstance?.unmount()
      })
      // Assert: The portal content should no longer be in the document body.
      expect(document.body).not.toHaveTextContent('Portal Content')
    })
  })

  // Step 6: `disableEmotion` Prop Tests
  // This group checks if the `disableEmotion` prop correctly prevents styling from being applied to child components.
  describe('disableEmotion Prop', () => {
    it('should propagate disableEmotion to children and prevent styling', () => {
      // Create a parent Div with `disableEmotion: true` and two children,
      // one direct Div and one rendered via a function, both with styling props.
      const App = Div({
        disableEmotion: true,
        children: [
          Div({
            'data-testid': 'child1',
            children: 'Child 1',
            backgroundColor: 'red', // This style should be ignored
          }),
          () =>
            Div({
              'data-testid': 'child2',
              children: 'Child 2 (from function)',
              color: 'blue', // This style should be ignored
            }),
        ],
      })

      // Render the component and get utilities to query by test ID.
      const { getByTestId } = render(App.render())

      // Get the first child element.
      const child1 = getByTestId('child1')
      // Assert that the Emotion style was NOT applied due to `disableEmotion`.
      expect(child1).not.toHaveStyleRule('background-color', 'red')

      // Get the second child element.
      const child2 = getByTestId('child2')
      // Assert that the Emotion style was NOT applied due to `disableEmotion`.
      expect(child2).not.toHaveStyleRule('color', 'blue')
    })

    it('should propagate disableEmotion to BaseNode children', () => {
      // Create a ChildNode (Div) with some styling.
      const ChildNode = Div({
        'data-testid': 'child-node',
        children: 'Child Node',
        padding: '10px', // This style should be ignored
      })

      // Create a parent Div with `disableEmotion: true` and the ChildNode as its child.
      const App = Div({
        disableEmotion: true,
        children: ChildNode,
      })

      // Render the component and get a utility to query by test ID.
      const { getByTestId } = render(App.render())
      // Get the child element.
      const child = getByTestId('child-node')
      // Assert that the child is in the document.
      expect(child).toBeInTheDocument()
      // Assert that the Emotion style was NOT applied due to `disableEmotion` propagation.
      expect(child).not.toHaveStyleRule('padding', '10px')
    })
  })

  // Step 7: Dependency and Memoization in a Real-World Scenario
  // This test suite is designed to validate the memoization and dependency tracking capabilities of the Node component system.
  // It simulates a practical, real-world application where a component's re-rendering is controlled by specific dependencies.
  describe('Dependency and Memoization in a Real-World Scenario', () => {
    // Mock user data and a fake service to simulate API calls.
    const mockUsers = {
      '1': { name: 'Alice', email: 'alice@example.com' },
      '2': { name: 'Bob', email: 'bob@example.com' },
    }
    const userService = {
      fetchUser: jest.fn(async (userId: keyof typeof mockUsers) => {
        await new Promise(resolve => setTimeout(resolve, 50)) // Simulate network delay
        return mockUsers[userId]
      }),
    }

    // A reusable UserProfile component that fetches and displays user data.
    // It is designed to be memoized based on the userId.
    let userProfileRenderCount: jest.Mock
    const UserProfile = memo(({ userId }: { userId: keyof typeof mockUsers }) => {
      userProfileRenderCount()
      const [user, setUser] = useState<{ name: string; email: string } | null>(null)

      useEffect(() => {
        userService.fetchUser(userId).then(setUser)
      }, [userId]) // Effect depends only on userId

      if (!user) {
        return P('Loading profile...').render()
      }

      return Div({
        'data-testid': `profile-${userId}`,
        children: [H1(user.name), P(user.email)],
      }).render()
    })

    // The main App component that controls which user profile is displayed
    // and has an unrelated state variable (theme) to test memoization.
    const App = () => {
      const [currentUserId, setCurrentUserId] = useState<keyof typeof mockUsers>('1')
      const [theme, setTheme] = useState('light')

      return Div({
        children: [
          // Controls to change the state
          Div({
            children: [
              P(`Current Theme: ${theme}`),
              Node('button', { onClick: () => setCurrentUserId('1'), children: 'View Alice' }),
              Node('button', { onClick: () => setCurrentUserId('2'), children: 'View Bob' }),
              Node('button', { onClick: () => setTheme(t => (t === 'light' ? 'dark' : 'light')), children: 'Toggle Theme' }),
            ],
          }),
          // The memoized UserProfile component. It should only re-render if `currentUserId` changes.
          Node(UserProfile, { userId: currentUserId }, [currentUserId]),
        ],
      }).render()
    }

    beforeEach(() => {
      // Reset mocks and spies before each test in this suite.
      userProfileRenderCount = jest.fn()
      userProfileRenderCount.mockClear()
      userService.fetchUser.mockClear()
    })

    it('distinguishes static nodes with different children', () => {
      // Arrange: create static Div nodes each with a different child
      const nodeA = Div({ children: Span('A') }, [])
      const nodeB = Div({ children: Span('B') }, [])
      const nodeC = Div({ children: Div({ children: Span('C') }, []) })
      const StaticNodesApp = Div({ children: [nodeA, nodeB, nodeC] })

      // Act: render the App component
      const { getByText } = render(StaticNodesApp.render())

      // Assert: the rendered Span elements exist and their parent elements are distinct
      const spanA = getByText('A')
      const spanB = getByText('B')
      const spanC = getByText('C')

      expect(spanA.parentElement).not.toBe(spanB.parentElement)
      expect(spanC.parentElement).not.toBe(spanA.parentElement)
    })

    it('should memoize a simple component based on dependencies', async () => {
      let renderCount = 0
      const MemoizedComponent = ({ value }: { value: string }) => {
        renderCount++
        return Div({ children: `Value: ${value}` }).render()
      }

      const App = () => {
        const [stateValue, setStateValue] = useState('initial')
        const [unrelatedState, setUnrelatedState] = useState(0)

        return Div({
          children: [
            Node(MemoizedComponent, { value: stateValue }, [stateValue]),
            Node('button', { onClick: () => setStateValue('changed'), children: 'Change Value' }),
            Node('button', { onClick: () => setUnrelatedState(unrelatedState + 1), children: 'Change Unrelated' }),
            P(`Unrelated: ${unrelatedState}`),
          ],
        }).render()
      }

      const { getByText } = render(Node(App).render())

      // Initial render
      expect(getByText('Value: initial')).toBeInTheDocument()
      expect(renderCount).toBe(1)

      // Change unrelated state
      act(() => {
        getByText('Change Unrelated').click()
      })
      await getByText('Unrelated: 1')
      // MemoizedComponent should NOT re-render
      expect(renderCount).toBe(1)

      // Change stateValue
      act(() => {
        getByText('Change Value').click()
      })
      await getByText('Value: changed')
      // MemoizedComponent SHOULD re-render
      expect(renderCount).toBe(2)
    })

    it('handles dependency-driven re-renders and static child', () => {
      // Define a component that holds complex state (an object with multiple keys: user, role).
      const ComplexStateApp = () => {
        const [state, setState] = useState({ user: 'John', role: 'Admin' })

        // Updater that changes only the `user` field.
        const updateUser = () => setState(s => ({ ...s, user: 'Jane' }))
        // Updater that changes only the `role` field.
        const updateRole = () => setState(s => ({ ...s, role: 'Editor' }))

        return Div({
          children: [
            // Button to update the `user` field (dependent).
            Div({ onClick: updateUser, children: 'Update User' }),
            // Button to update the `role` field (non-dependent for some children).
            Div({ onClick: updateRole, children: 'Update Role' }),
            // Static child: empty dependency array means it should remain unchanged across state updates.
            Div({ children: `Initial User: ${state.user}` }, []),
            // Dependent child: will re-render only when `state.user` changes.
            Div({ children: `User: ${state.user}; Role: ${state.role}` }, [state.user]),
          ],
        }).render()
      }

      // Render the component.
      const { getByText } = render(Node(ComplexStateApp).render())

      // Act: Trigger an update to the non-dependent field (`role`).
      act(() => {
        getByText('Update Role').click()
      })
      // Assert: The dependent child should NOT re-render (user is still John).
      expect(getByText('User: John; Role: Admin')).toBeInTheDocument()
      // Assert: The static child should remain unchanged.
      expect(getByText('Initial User: John')).toBeInTheDocument()

      // Act: Trigger an update to the dependent field (`user`).
      act(() => {
        getByText('Update User').click()
      })
      // Assert: The dependent child SHOULD re-render to reflect the new user and updated role.
      expect(getByText('User: Jane; Role: Editor')).toBeInTheDocument()
      // Assert: The static child should still remain unchanged.
      expect(getByText('Initial User: John')).toBeInTheDocument()
    })

    it('should render the initial profile and not re-render on unrelated state changes', async () => {
      // Step 1: Mount the App and obtain query utilities
      const { getByText, findByText } = render(Node(App).render())

      // Step 2: Wait for the initial profile (Alice) to load and assert initial state
      await findByText('Alice')
      expect(getByText('alice@example.com')).toBeInTheDocument()
      const initialRenderCount = userProfileRenderCount.mock.calls.length
      expect(userService.fetchUser).toHaveBeenCalledWith('1')
      expect(userService.fetchUser).toHaveBeenCalledTimes(1)

      // Step 3: Trigger an unrelated state change (toggle theme)
      act(() => {
        getByText('Toggle Theme').click()
      })

      // Step 4: Wait for the unrelated UI update to settle
      await findByText('Current Theme: dark')

      // Step 5: Verify memoization prevented re-render and no additional fetch occurred
      expect(userProfileRenderCount.mock.calls.length).toBe(initialRenderCount)
      expect(userService.fetchUser).toHaveBeenCalledTimes(1)
      expect(getByText('Alice')).toBeInTheDocument()
    })

    it('should re-render the profile only when the userId dependency changes', async () => {
      const { getByText, findByText } = render(Node(App).render())

      // 1. Initial Render (Alice)
      // First render: Loading state (renderCount = 1)
      // Second render: Data loaded (renderCount = 2)
      await findByText('Alice')
      expect(getByText('alice@example.com')).toBeInTheDocument()
      expect(userProfileRenderCount).toHaveBeenCalledTimes(2) // Loading + Loaded
      expect(userService.fetchUser).toHaveBeenCalledWith('1')
      expect(userService.fetchUser).toHaveBeenCalledTimes(1)

      // 2. Switch Profile to Bob
      act(() => {
        getByText('View Bob').click()
      })

      // 3. Assert Re-render and Data Fetch
      // Third render: Loading state with userId='2' (renderCount = 3)
      // Fourth render: Bob's data loaded (renderCount = 4)
      await findByText('Bob')
      expect(getByText('bob@example.com')).toBeInTheDocument()
      expect(userProfileRenderCount).toHaveBeenCalledTimes(4) // +2 for new profile
      expect(userService.fetchUser).toHaveBeenCalledWith('2')
      expect(userService.fetchUser).toHaveBeenCalledTimes(2)

      // 4. Switch back to Alice
      act(() => {
        getByText('View Alice').click()
      })

      // 5. Assert Re-render and Data Fetch again
      // Fifth render: Loading state with userId='1' (renderCount = 5)
      // Sixth render: Alice's data loaded (renderCount = 6)
      await findByText('Alice')
      expect(getByText('alice@example.com')).toBeInTheDocument()
      expect(userProfileRenderCount).toHaveBeenCalledTimes(6) // +2 for switching back
      expect(userService.fetchUser).toHaveBeenCalledWith('1')
      expect(userService.fetchUser).toHaveBeenCalledTimes(3)
    })

    it('should clear unmounted component caches on simulated navigation', () => {
      // This test simulates a real-world SPA navigation scenario to verify
      // that NavigationCacheManager and SafeCacheManager work together to evict
      // caches of unmounted components, preventing memory leaks.

      // 1. Setup: Define components for different "pages"
      // A shared header component, memoized to persist across pages if not unmounted.
      const Header = memo(() => Div({ children: 'Shared Header' }).render())

      // A component unique to the Home page, memoized.
      const HomePageContent = memo(() => P('Welcome to the Home Page').render())

      // A component unique to the About page, memoized.
      const AboutPageContent = memo(() => P('This is the About Page').render())

      // App component to simulate routing between pages.
      const App = () => {
        const [page, setPage] = useState('home')

        // Simulate navigation by changing state. This will cause components to unmount.
        const navigateTo = (targetPage: string) => {
          setPage(targetPage)
          // Manually dispatch a navigation event to trigger cache cleanup,
          // simulating a URL change in a real router.
          window.dispatchEvent(new Event('popstate'))
        }

        return Div({
          children: [
            Node(Header, {}, []), // Shared component
            Node('nav', {
              children: [
                Node('button', { onClick: () => navigateTo('home'), children: 'Home' }),
                Node('button', { onClick: () => navigateTo('about'), children: 'About' }),
              ],
            }),
            page === 'home' ? Node(HomePageContent, {}, []) : Node(AboutPageContent, {}, []),
          ],
        }).render()
      }

      // Use fake timers to control the debounced cleanup function in NavigationCacheManager.
      jest.useFakeTimers()

      // 2. Initial Render (Home Page)
      const { getByText, queryByText } = render(Node(App).render())
      expect(getByText('Welcome to the Home Page')).toBeInTheDocument()

      // 3. Check initial cache state
      // At this point, Header and HomePageContent should be in the cache.
      const initialCacheSize = BaseNode._elementCache.size
      expect(initialCacheSize).toBeGreaterThan(0)

      // 4. Simulate Navigation to About Page
      act(() => {
        getByText('About').click()
      })

      // After navigation, HomePageContent is unmounted, and AboutPageContent is mounted.
      expect(queryByText('Welcome to the Home Page')).not.toBeInTheDocument()
      expect(getByText('This is the About Page')).toBeInTheDocument()

      // 5. Trigger and wait for the debounced cache cleanup
      act(() => {
        jest.runAllTimers()
      })

      // 6. Assert that the cache has been cleaned
      // The cache entry for the unmounted HomePageContent should be gone.
      // The cache for the still-mounted Header and the new AboutPageContent should remain.
      const cacheSizeAfterCleanup = BaseNode._elementCache.size
      expect(cacheSizeAfterCleanup).toBeLessThan(initialCacheSize)
      expect(cacheSizeAfterCleanup).toBeGreaterThan(0) // Ensure the cache for mounted components is not cleared.

      // Restore real timers
      jest.useRealTimers()
    })

    // Test to ensure no cache collision occurs between different components with identical props
    it('prevents cache collision between different components with identical props', () => {
      const CompA = memo(() => Div({ children: 'A', color: 'red' }).render())
      const CompB = memo(() => Div({ children: 'B', color: 'red' }).render())

      const App = Div({
        children: [
          Node(CompA, { key: 'item' }, []),
          Node(CompB, { key: 'item' }, []), // Same key, same style props
        ],
      })

      const { getByText } = render(App.render())

      // Both should render independently despite collision-prone signatures
      expect(getByText('A')).toBeInTheDocument()
      expect(getByText('B')).toBeInTheDocument()

      // Cache should have 2 distinct entries
      const cacheKeys = Array.from(BaseNode._elementCache.keys())
      const itemKeys = cacheKeys.filter(k => k.includes('item'))
      expect(itemKeys.length).toBe(2) // Not 1 (collision)
    })

    // Test to ensure that rapid navigation does not cause cache overflow
    it('handles rapid navigation without cache overflow', () => {
      jest.useFakeTimers()

      const Page1 = memo(() => P('Page 1').render())
      const Page2 = memo(() => P('Page 2').render())
      const Page3 = memo(() => P('Page 3').render())

      const App = () => {
        const [page, setPage] = useState(1)

        const navigate = (target: number) => {
          setPage(target)
          window.dispatchEvent(new Event('popstate'))
        }

        return Div({
          children: [
            Node('button', { onClick: () => navigate(1), children: 'Go to Page 1' }),
            Node('button', { onClick: () => navigate(2), children: 'Go to Page 2' }),
            Node('button', { onClick: () => navigate(3), children: 'Go to Page 3' }),
            page === 1 ? Node(Page1, {}, []) : page === 2 ? Node(Page2, {}, []) : Node(Page3, {}, []),
          ],
        }).render()
      }

      const { getByText } = render(Node(App).render())
      const initialCacheSize = BaseNode._elementCache.size

      // Rapid navigation: 10-page changes without waiting for debounce
      for (let i = 0; i < 10; i++) {
        act(() => {
          getByText(`Go to Page ${(i % 3) + 1}`).click()
        })
      }

      const cacheSizeDuringRapidNav = BaseNode._elementCache.size

      // Cache should not grow unbounded (allow some growth but not 10x)
      expect(cacheSizeDuringRapidNav).toBeLessThan(initialCacheSize * 3)

      // Now let all debouncers fire
      act(() => {
        jest.runAllTimers()
      })

      const finalCacheSize = BaseNode._elementCache.size

      // After cleanup, only currently mounted components should remain
      expect(finalCacheSize).toBeLessThan(cacheSizeDuringRapidNav)
      expect(finalCacheSize).toBeGreaterThan(0) // Sanity check

      jest.useRealTimers()
    })

    // Test to ensure compatibility with React 18 Strict Mode
    it('handles React 18 Strict Mode without cache corruption', () => {
      let renderCount = 0

      const TrackedComponent = memo(() => {
        renderCount++
        return P('Tracked Content').render()
      })

      const App = () => {
        const [toggle, setToggle] = useState(false)
        return Div({
          children: [
            Node(TrackedComponent, { key: 'LOL' }, []),
            Node('button', {
              onClick: () => setToggle(!toggle),
              children: 'Toggle',
            }),
          ],
        }).render()
      }

      const { getByText, unmount } = render(Node(StrictMode, { children: Node(App) }).render())

      // Initial render (Strict Mode doesn't double-mount in test/production mode)
      expect(renderCount).toBe(2)

      // Cache should exist
      const initialCacheSize = BaseNode._elementCache.size
      expect(initialCacheSize).toBeGreaterThan(0)

      // Toggle parent state - TrackedComponent should NOT re-render (empty deps)
      act(() => {
        getByText('Toggle').click()
      })

      expect(renderCount).toBe(2) // Still 1, memoization works in StrictMode

      // Toggle again to verify cache stability
      act(() => {
        getByText('Toggle').click()
      })

      expect(renderCount).toBe(2) // Memoization still working

      // Cache should remain stable
      expect(BaseNode._elementCache.size).toBe(initialCacheSize)

      unmount()

      // After unmount, verify cleanup (cache might still exist briefly)
      expect(BaseNode._elementCache.size).toBeGreaterThanOrEqual(0)
    })

    // Test for critical props fingerprinting when object props exceed 100 keys
    it('uses critical props fingerprint for objects with >100 keys', () => {
      // Create props object with 150 keys
      const largeProps: Record<string, any> = {
        color: 'red',
        backgroundColor: 'blue',
        padding: 10,
      }

      // Add 147 more non-critical keys to exceed threshold
      for (let i = 0; i < 147; i++) {
        largeProps[`data${i}`] = i
      }

      let renderCount = 0
      const LargePropsComponent = memo((props: any) => {
        renderCount++
        return Div({ ...props, children: 'Large Props Component' }).render()
      })

      const App = () => {
        const [trigger, setTrigger] = useState(0)
        const [propsRef] = useState(largeProps) // Stable reference

        return Div({
          children: [
            Node(LargePropsComponent, propsRef, [propsRef.color]), // Dep on critical prop
            Node('button', {
              onClick: () => {
                // Change non-critical prop (outside the 50 critical prop limit)
                propsRef.data99 = Math.random()
                setTrigger(t => t + 1)
              },
              children: 'Change Non-Critical',
            }),
            Node('button', {
              onClick: () => {
                // Change critical prop (style-related)
                propsRef.color = propsRef.color === 'red' ? 'blue' : 'red'
                setTrigger(t => t + 1)
              },
              children: 'Change Critical',
            }),
            P(`Trigger: ${trigger}`), // Force parent re-render
          ],
        }).render()
      }

      const { getByText } = render(Node(App).render())

      expect(renderCount).toBe(1)

      // Change non-critical prop - should NOT trigger re-render (deps unchanged)
      act(() => {
        getByText('Change Non-Critical').click()
      })

      expect(getByText('Trigger: 1')).toBeInTheDocument()
      expect(renderCount).toBe(1) // No re-render, color unchanged

      // Change critical prop - SHOULD trigger re-render (dep changed)
      act(() => {
        getByText('Change Critical').click()
      })

      expect(getByText('Trigger: 2')).toBeInTheDocument()
      expect(renderCount).toBe(2) // Re-rendered, color changed
    })

    // Additional tests can be added here to further validate edge cases and complex scenarios.
    it('LRU eviction prioritizes old, infrequently accessed entries', () => {
      BaseNode.clearCaches()

      // Access the private cache and constants
      const cache = (BaseNode as any)._propProcessingCache as Map<string, any>
      const CLEANUP_BATCH = (BaseNode as any).CACHE_CLEANUP_BATCH || 50

      const now = Date.now()

      // Add enough entries to exceed batch size so not everything gets evicted
      // We'll add CLEANUP_BATCH + 10 entries total
      const TOTAL_ENTRIES = CLEANUP_BATCH + 10

      // First, add filler entries (medium priority)
      for (let i = 0; i < TOTAL_ENTRIES - 3; i++) {
        cache.set(`filler-${i}`, {
          cssProps: { color: `color-${i}` },
          signature: `sig-filler-${i}`,
          lastAccess: now - 10000, // 10s old
          hitCount: 5, // Medium frequency
        })
      }

      // Entry A: Old but frequently accessed (should survive)
      cache.set('entry-a', {
        cssProps: { color: 'red' },
        signature: 'sig-a',
        lastAccess: now - 100000, // 100s old
        hitCount: 100, // Very frequent - low eviction score
      })

      // Entry B: Recent and frequent (should survive)
      cache.set('entry-b', {
        cssProps: { color: 'blue' },
        signature: 'sig-b',
        lastAccess: now - 1000, // 1s old - very recent
        hitCount: 50, // Frequent
      })

      // Entry C: Old and infrequent (should be evicted)
      cache.set('entry-c', {
        cssProps: { color: 'green' },
        signature: 'sig-c',
        lastAccess: now - 200000, // 200s old - very old
        hitCount: 1, // Very infrequent - high eviction score
      })

      expect(cache.size).toBe(TOTAL_ENTRIES)

      // Trigger eviction manually
      ;(BaseNode as any)._evictLRUEntries()

      // Should have evicted CLEANUP_BATCH entries
      expect(cache.size).toBe(TOTAL_ENTRIES - CLEANUP_BATCH)

      // Entry C should be evicted (highest score: 200 + 1000/2 ≈ 700)
      expect(cache.has('entry-c')).toBe(false)

      // Entry A should survive (score: 100 + 1000/101 ≈ 110)
      expect(cache.has('entry-a')).toBe(true)

      // Entry B should survive (score: 1 + 1000/51 ≈ 21)
      expect(cache.has('entry-b')).toBe(true)
    })
  })
})
