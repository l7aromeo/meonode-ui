import { Div, type Theme, ThemeProvider } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

afterEach(cleanup)

describe('Theme Key Resolution', () => {
  it('should resolve theme values in object keys (e.g. media queries)', () => {
    const myTheme: Theme = {
      mode: 'light',
      system: {
        breakpoint: {
          lg: '1024px',
        },
      },
    }

    const App = ThemeProvider({
      theme: myTheme,
      children: Div({
        children: 'Media Query Content',
        css: {
          '@media (max-width: theme.breakpoint.lg)': {
            color: 'red',
          },
        },
      }),
    })

    const { getByText } = render(App.render())
    const element = getByText('Media Query Content')

    // We expect the media query to be resolved to '@media (max-width: 1024px)'
    // The matcher `toHaveStyleRule` supports media options.
    expect(element).toHaveStyleRule('color', 'red', {
      media: '(max-width: 1024px)',
    })
  })

  it('should resolve multiple theme values in multiple keys', () => {
    const myTheme: Theme = {
      mode: 'light',
      system: {
        breakpoint: {
          sm: '640px',
          lg: '1024px',
        },
        spacing: {
          md: '16px',
        },
      },
    }

    const App = ThemeProvider({
      theme: myTheme,
      children: Div({
        children: 'Complex Media Query Content',
        css: {
          padding: 'theme.spacing.md',
          '@media (max-width: theme.breakpoint.lg)': {
            color: 'blue',
            fontSize: '18px',
          },
          '@media (max-width: theme.breakpoint.sm)': {
            color: 'green',
            fontSize: '14px',
          },
        },
      }),
    })

    const { getByText } = render(App.render())
    const element = getByText('Complex Media Query Content')

    // Check base styles
    expect(element).toHaveStyleRule('padding', '16px')

    // Check media query resolutions
    expect(element).toHaveStyleRule('color', 'blue', {
      media: '(max-width: 1024px)',
    })
    expect(element).toHaveStyleRule('font-size', '18px', {
      media: '(max-width: 1024px)',
    })
    expect(element).toHaveStyleRule('color', 'green', {
      media: '(max-width: 640px)',
    })
    expect(element).toHaveStyleRule('font-size', '14px', {
      media: '(max-width: 640px)',
    })
  })
})
