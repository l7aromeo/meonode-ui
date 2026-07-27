'use client'
import { createContext, createElement, type ReactNode, useState } from 'react'
import type { Children, Theme } from '@src/types/node.type.js'
import { Node } from '@src/core.node.js'
import { buildThemeVariablesCss } from '@src/util/server-theme.util.js'

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

  // Emit the `:root{--meonode-theme-*}` block as part of this component's own
  // output, rather than registering it into module-global state for
  // `StyleRegistry` to consume at a streaming flush point. That indirection made
  // emission depend on whether registration happened before the final flush — on
  // some routes it silently didn't, leaving hundreds of `var(...)` references
  // pointing at properties that were never defined server-side. It also shared
  // one process-global map across concurrent SSR requests, and keyed the rule on
  // a constant id, so a second (or nested) theme was consumed and then dropped.
  //
  // Rendering it here fixes all of that: emission is a pure function of the
  // theme, so it cannot depend on render order or another component's timing;
  // it is request-scoped by construction; and a nested provider emits its own
  // block.
  //
  // Deliberately a plain `<style>` — *not* React's hoisted
  // `<style href precedence>` resource. A hoisted style is keyed by `href` and
  // reused in its original document position, so switching theme A -> B -> A
  // leaves B's tag *after* A's and B keeps winning the cascade, applying the
  // wrong theme. A plain element is owned by this component: React rewrites its
  // text on theme change, and removes it on unmount. CSS is document-global, so
  // `:root` applies regardless of where the tag sits.
  const themeVariablesCss = buildThemeVariablesCss(currentTheme)
  const themeVariablesStyle = themeVariablesCss
    ? createElement('style', {
        'data-meonode-theme-vars': '',
        children: themeVariablesCss,
      })
    : null

  // Prepend the style rather than nesting an array inside `children`, so the
  // shape stays a flat `Children` list.
  const composedChildren: Children = themeVariablesStyle
    ? ([themeVariablesStyle, ...(Array.isArray(children) ? children : children == null ? [] : [children])] as Children)
    : children

  return Node(ThemeContext.Provider, { value: contextValue, children: composedChildren }).render()
}

;(ThemeProvider as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true
;(ThemeProvider as { __meonodeProvidesServerTheme?: boolean }).__meonodeProvidesServerTheme = true
