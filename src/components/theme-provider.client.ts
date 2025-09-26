'use client'
import { createContext, type ReactNode, useState } from 'react'
import type { Children, Theme } from '@src/node.type.js'
import { createNode, Node } from '@src/core.node.js'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * The internal implementation of the ThemeProvider component.
 * @param {object} props The props for the component.
 * @param {Children} [props.children] The children to render.
 * @param {Theme} props.theme The theme to provide.
 * @returns {ReactNode} The rendered component.
 * @private
 */
export function _ThemeProvider({ children, theme }: { children?: Children; theme: Theme }): ReactNode {
  const [currentTheme, setTheme] = useState<Theme>(theme)

  if (!theme) {
    throw new Error('`theme` prop must be defined')
  }

  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    setTheme: theme => {
      document.cookie = `theme=${theme.mode}`
      setTheme(theme)
    },
  }

  return Node(ThemeContext.Provider, { value: contextValue, children }).render()
}

/**
 * A component that provides a theme to its children.
 */
export const ThemeProvider = createNode(_ThemeProvider)
