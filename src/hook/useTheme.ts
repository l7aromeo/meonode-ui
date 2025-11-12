'use client'
import { useContext, useEffect } from 'react'
import { ThemeContext } from '@src/components/theme-provider.client.js'

/**
 * A hook that provides access to the theme context.
 * It also handles side effects like updating localStorage and applying the theme to the document root.
 * @returns {ThemeContextValue} The theme context value.
 * @throws {Error} If used outside a ThemeProvider.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  const { theme } = context

  useEffect(() => {
    // Sync theme mode with localStorage
    const currentTheme = localStorage.getItem('theme')
    if (!currentTheme || currentTheme !== theme.mode) {
      localStorage.setItem('theme', theme.mode)
    }

    // Apply theme to document root
    const root = document.documentElement

    if (theme.mode === 'dark') {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    } else {
      root.setAttribute('data-theme', 'light')
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    }
  }, [theme.mode, theme.system])

  return context
}
