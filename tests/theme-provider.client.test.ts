import React from 'react'
import { createNode, ThemeProvider, type Theme, useTheme } from '@src/main.js'
import { cleanup, fireEvent, render } from '@testing-library/react'

const INITIAL_THEME: Theme = {
  mode: 'light',
  system: {
    spacing: { md: '16px' },
    colors: { primary: 'rgb(255, 0, 0)' },
  },
}

const NEXT_THEME: Theme = {
  mode: 'dark',
  system: {
    spacing: { md: '20px' },
    colors: { primary: 'rgb(0, 0, 255)' },
  },
}

const ThemeSwitcher = createNode(function ThemeSwitcher() {
  const { setTheme } = useTheme()
  return React.createElement(
    'button',
    {
      type: 'button',
      'data-testid': 'theme-switch',
      onClick: () => setTheme(NEXT_THEME),
    },
    'Switch Theme',
  )
})

function getThemeStyleTag(): HTMLStyleElement | null {
  return document.head.querySelector('style[data-meonode-theme-vars]')
}

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('style[data-meonode-theme-vars]').forEach(node => node.remove())
})

describe('ThemeProvider client CSS vars', () => {
  it('injects :root CSS variables from current theme', () => {
    const App = ThemeProvider({
      theme: INITIAL_THEME,
      children: ThemeSwitcher({}),
    })

    render(App.render())

    const themeStyleTag = getThemeStyleTag()
    expect(themeStyleTag).not.toBeNull()
    expect(themeStyleTag?.textContent).toContain(':root{')
    expect(themeStyleTag?.textContent).toContain('--meonode-theme-spacing-md:16px;')
    expect(themeStyleTag?.textContent).toContain('--meonode-theme-colors-primary:rgb(255, 0, 0);')
  })

  it('replaces :root CSS variables when theme updates', () => {
    const App = ThemeProvider({
      theme: INITIAL_THEME,
      children: ThemeSwitcher({}),
    })

    const { getByTestId } = render(App.render())
    fireEvent.click(getByTestId('theme-switch'))

    const styleTags = document.head.querySelectorAll('style[data-meonode-theme-vars]')
    expect(styleTags).toHaveLength(1)
    expect(styleTags[0]?.textContent).toContain('--meonode-theme-spacing-md:20px;')
    expect(styleTags[0]?.textContent).toContain('--meonode-theme-colors-primary:rgb(0, 0, 255);')
  })

  it('removes injected theme style tag on unmount', () => {
    const App = ThemeProvider({
      theme: INITIAL_THEME,
      children: ThemeSwitcher({}),
    })

    const { unmount } = render(App.render())
    expect(getThemeStyleTag()).not.toBeNull()

    unmount()

    expect(getThemeStyleTag()).toBeNull()
  })
})
