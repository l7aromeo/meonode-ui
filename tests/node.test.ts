import { Activity, Component, Div, Fragment, H1, Node, type NodeInstance, P, Portal, Root, Span, Suspense, Text, type Theme, ThemeProvider } from '@src/main.js'
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

  // Step 7: Dependency and Memoization Tests
  // This suite validates the memoization and dependency tracking system, ensuring components only re-render when their specified dependencies change.
  describe('Dependency and Memoization', () => {
    it('non-reactive children should not update on parent state change', () => {
      // Define an App component that manages a `count` state.
      // It renders a reactive child (updates with `count`) and a non-reactive child (empty dependency array).
      const App = () => {
        const [count, setCount] = useState(0)
        return Div({
          'data-testid': 'root-node',
          onClick: () => setCount(count + 1), // Increment count on click
          children: [
            Div({ children: `Reactive ${count}` }), // Reactive child
            Div({ children: `Non Reactive ${count}` }, []), // Non-reactive child
          ],
        }).render()
      }

      // Render the App component.
      const { getByTestId, getByText } = render(Node(App).render())
      // Get the root node to trigger the click event.
      const rootNode = getByTestId('root-node')

      // Act: Click the root node to change the parent's state.
      act(() => {
        rootNode.click()
      })

      // Assert: The reactive child should show the updated count.
      expect(getByText('Reactive 1')).toBeInTheDocument()
      // Assert: The non-reactive child should still show the initial count.
      expect(getByText('Non Reactive 0')).toBeInTheDocument()
    })

    it('should only update child with single dependency when parent has multiple states', () => {
      // Define an App component with two independent state variables (count1, count2).
      // It renders buttons to update each count and two children, each dependent on only one count.
      const App = () => {
        const [count1, setCount1] = useState(0)
        const [count2, setCount2] = useState(0)

        return Div({
          children: [
            Div({ onClick: () => setCount1(c => c + 1), children: 'Increment Count 1' }),
            Div({ onClick: () => setCount2(c => c + 1), children: 'Increment Count 2' }),
            Div({ children: `Count 1 is ${count1}` }, [count1]), // Dependent on count1
            Div({ children: `Count 2 is ${count2}` }, [count2]), // Dependent on count2
          ],
        }).render()
      }

      // Render the App component.
      const { getByText } = render(Node(App).render())

      // Act: Click the button to increment count2.
      act(() => {
        getByText('Increment Count 2').click()
      })

      // Assert: The child dependent on count1 should NOT have re-rendered.
      expect(getByText('Count 1 is 0')).toBeInTheDocument()
      // Assert: The child dependent on count2 SHOULD have re-rendered.
      expect(getByText('Count 2 is 1')).toBeInTheDocument()

      // Act: Click the button to increment count1.
      act(() => {
        getByText('Increment Count 1').click()
      })

      // Assert: The child dependent on count1 SHOULD have re-rendered.
      expect(getByText('Count 1 is 1')).toBeInTheDocument()
      // Assert: The child dependent on count2 should remain unchanged (unless count2 was clicked again).
      expect(getByText('Count 2 is 1')).toBeInTheDocument()
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

    it('distinguishes static nodes with different children', () => {
      // Create two static Div nodes, each with a different Span child.
      const nodeA = Div({ children: Span('A') }, [])
      const nodeB = Div({ children: Span('B') }, [])
      // Create an App component that renders both static nodes.
      const StaticNodesApp = Div({ children: [nodeA, nodeB] })

      // Render the App component.
      const { getByText } = render(StaticNodesApp.render())
      // Get the rendered Span elements.
      const spanA = getByText('A')
      const spanB = getByText('B')
      // Assert that the parent elements of the two spans are different,
      // confirming that even static nodes with different content are distinct instances.
      expect(spanA.parentElement).not.toBe(spanB.parentElement)
    })

    it('keeps HOC child static when given empty dependencies', () => {
      // Define a Higher-Order Component (HOC) that simply renders its children in a Div.
      const HocComp = Component(({ children }) => Div({ children }))
      // Define an App component that manages a `count` state and renders an HOC-wrapped child.
      // The HOC child is given an empty dependency array, making it static.
      const HocApp = () => {
        const [count, setCount] = useState(0)
        return Div({
          'data-testid': 'root-node-hoc',
          onClick: () => setCount(c => c + 1), // Increment count on click
          children: HocComp({ children: `Count ${count}` }, []), // Static HOC child
        }).render()
      }

      // Render the App component.
      const { getByTestId, getByText } = render(Node(HocApp).render())
      // Act: Click the root node to change the parent's state.
      act(() => {
        getByTestId('root-node-hoc').click()
      })
      // Assert: The static HOC child should still display its initial content,
      // as it did not re-render despite the parent's state change.
      expect(getByText('Count 0')).toBeInTheDocument()
    })
  })
})
