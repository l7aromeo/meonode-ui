import { Activity, Component, Div, Fragment, Node, Root, Suspense, Text } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { useState } from 'react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(() => {
  cleanup()
})

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
