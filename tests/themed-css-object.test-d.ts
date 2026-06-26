/**
 * Compile-time verification for ThemedCSSObject / CssProp scenarios.
 * Run: bunx tsc --noEmit (included in project typecheck).
 */
import type { CssProp } from '@src/types/node.type'
import { Div } from '@src/components/html.node'

// --- Annotated CssProp (baseline) ---
export const cssAnnotated: CssProp = {
  position: 'relative',
  '&::before': {
    position: 'absolute',
    top: 0,
    left: 0,
  },
}

// --- Inline on node (nested literal widening regression) ---
export const nestedPositionNode = Div({
  css: {
    position: 'relative',
    '& img': {
      position: 'absolute',
      inset: 0,
    },
  },
})

// --- Theme token strings (WithThemeToken on mapped CSS keys) ---
export const themeTokenNode = Div({
  css: {
    color: 'theme.base.content',
    padding: 'theme.spacing.md',
    '&:hover': {
      backgroundColor: 'theme.primary.default',
    },
  },
})

// --- Theme callback on direct styled prop ---
export const directCallbackNode = Div({
  backgroundColor: ({ system }) => system.primary.default,
  padding: 'theme.spacing.md',
})

// --- Theme callback inside css (top + nested property) ---
export const cssCallbackNode = Div({
  css: {
    backgroundColor: ({ system }) => system.primary.default,
    '&:hover': {
      backgroundColor: ({ system }) => system.primary.hover,
      color: ({ system }) => system.primary.content,
    },
  },
})

// --- Whole nested block as theme callback ---
export const blockCallbackNode = Div({
  css: {
    '&:hover': ({ system }) => ({
      backgroundColor: system.primary.default,
      position: 'absolute',
    }),
  },
})

// --- Deep nesting + media + keyframes ---
export const deepNestedCssNode = Div({
  css: {
    '&:hover': {
      '& img': {
        position: 'absolute',
        objectFit: 'cover',
      },
    },
    '@media (max-width: 768px)': {
      display: 'block',
      '& img': {
        position: 'static',
      },
    },
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
})

// --- CssProp variable reused ---
export const hoverBlock: CssProp = {
  '&:hover': {
    position: 'absolute',
    backgroundColor: ({ system }) => system.primary.default,
  },
}

export const hoverBlockNode = Div({ css: hoverBlock })
