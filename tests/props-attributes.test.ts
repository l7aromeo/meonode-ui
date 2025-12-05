import { Div, Node, NodeInstance, type Theme, ThemeProvider } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)

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
