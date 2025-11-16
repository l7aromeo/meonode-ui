import { Div, Node, type Theme, ThemeProvider } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)

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
