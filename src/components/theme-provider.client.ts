'use client'
import { createContext, type ReactNode, useState } from 'react'
import type { Children, Theme } from '@src/types/node.type.js'
import { Node } from '@src/core.node.js'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme | ((theme: Theme) => Theme)) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * The internal implementation of the ThemeProvider component.
 * @param {object} props The props for the component.
 * @param {Children} [props.children] The children to render.
 * @param {Theme} props.theme The theme to provide.
 * @returns {ReactNode} The rendered component.
 */
export default function ThemeProvider({ children, theme }: { children?: Children; theme: Theme }): ReactNode {
  const [currentTheme, setTheme] = useState<Theme>(theme)

  if (!theme) {
    throw new Error('`theme` prop must be defined')
  }

  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    setTheme: theme => {
      if (typeof theme === 'function') {
        theme = theme(currentTheme)
      }
      document.cookie = `theme=${theme.mode}; path=/;`
      setTheme(theme)
    },
  }

  return Node(ThemeContext.Provider, { value: contextValue, children }).render()
}
