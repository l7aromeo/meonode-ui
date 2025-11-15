import { Component, Div, H1, P, Span } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(() => {
  cleanup()
})

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
