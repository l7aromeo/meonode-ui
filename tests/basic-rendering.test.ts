import { Component, Div, H1, P, Span, createNode, Node } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)

describe('Basic Rendering', () => {
  it('should pass through props defined in the props object as attributes, not CSS', () => {
    // Create a Div where 'height' is passed via 'props' to force it as an attribute
    const App = Div({
      children: 'Attribute Test',
      props: { height: '100px' },
      'data-testid': 'attr-test-element',
    })

    const { getByTestId } = render(App.render())
    const element = getByTestId('attr-test-element') as HTMLElement

    // Assert that the element has the 'height' attribute
    expect(element).toHaveAttribute('height', '100px')

    // Assert that it does NOT have height in style (it shouldn't be processed by Emotion)
    // Note: getComputedStyle might return default values, so we check inline style specifically
    expect(element.style.height).toBe('')
  })

  it('should pass props correctly to a component wrapped with createNode', () => {
    // Define a functional component that expects a height prop
    const Fun = ({ height }: { height: string }) => {
      return Div({
        children: `Height is ${height}`,
        'data-testid': 'fun-component',
        props: { 'data-height': height }, // Pass it through to DOM for verification
      }).render()
    }

    // Wrap it with createNode
    const MyFun = createNode(Fun)

    // Render with props passed via the 'props' object
    const App = MyFun({ props: { height: '200px' } })

    const { getByTestId } = render(App.render())
    const element = getByTestId('fun-component')

    // Verify the prop was received by the component
    expect(element).toHaveTextContent('Height is 200px')
    expect(element).toHaveAttribute('data-height', '200px')
  })

  it('should pass props correctly to a component wrapped with Node()', () => {
    // Define a functional component that expects a height prop
    const Fun = ({ height }: { height: string }) => {
      return Div({
        children: `Height is ${height}`,
        'data-testid': 'node-fun-component',
        props: { 'data-height': height },
      }).render()
    }

    // Render using Node() factory with props passed via the 'props' object
    const App = Node(Fun, { props: { height: '300px' } })

    const { getByTestId } = render(App.render())
    const element = getByTestId('node-fun-component')

    // Verify the prop was received by the component
    expect(element).toHaveTextContent('Height is 300px')
    expect(element).toHaveAttribute('data-height', '300px')
  })

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

  it('should not leak internal MeoNode processing props to rendered DOM elements', () => {
    // Create a Div with internal MeoNode props that should be filtered out during rendering
    const App = Div({
      children: 'Test Content',
      css: { color: 'red', fontSize: '16px' },
      props: { 'data-custom': 'value' }, // This maps to internal nativeProps
      disableEmotion: false,
      // Regular DOM props that SHOULD be passed through
      id: 'test-div',
      className: 'test-class',
      'data-testid': 'test-element',
    })

    const { getByTestId } = render(App.render())
    const element = getByTestId('test-element') as HTMLElement

    // Assert that the element exists and has the expected text
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Test Content')

    // Assert that regular DOM props are present
    expect(element).toHaveAttribute('id', 'test-div')
    expect(element).toHaveClass('test-class')
    expect(element).toHaveAttribute('data-testid', 'test-element')
    expect(element).toHaveAttribute('data-custom', 'value') // from props (mapped to nativeProps)

    // Assert that internal MeoNode props are NOT present as attributes
    expect(element).not.toHaveAttribute('css')
    expect(element).not.toHaveAttribute('nativeProps')
    expect(element).not.toHaveAttribute('props')
    expect(element).not.toHaveAttribute('disableEmotion')
    expect(element).not.toHaveAttribute('node') // from MeoNodeUnmounter

    // Additional check: verify that the element doesn't have any attribute with "[object Object]" value
    // This would indicate a leaked object prop
    const attributes = Array.from(element.attributes)
    const hasObjectValue = attributes.some(attr => attr.value === '[object Object]')
    expect(hasObjectValue).toBe(false)
  })
})
