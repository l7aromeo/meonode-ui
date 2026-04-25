'use client'
import { type JSX, type ReactNode, useContext } from 'react'
import { jsx } from '@emotion/react'
import type { CssProp, NodeElement } from '@src/types/node.type.js'
import { ThemeContext } from '@src/components/theme-provider.client.js'
import { ThemeUtil } from '@src/util/theme.util.js'

export interface StyledRendererProps<E extends NodeElement> {
  element: E
  children: ReactNode
  css: CssProp
}

/**
 * A client-side component that renders a styled element using Emotion.
 * It resolves theme values and applies default styles.
 * @template E The type of the HTML element to render.
 * @template TProps The type of the props for the component.
 * @param element The HTML element to render (e.g., 'div', 'span').
 * @param children Optional children to be rendered inside the element.
 * @param props
 * @returns {JSX.Element} The rendered JSX element.
 */
export default function StyledRenderer<E extends NodeElement, TProps extends Record<string, any>>({
  element,
  children,
  ...props
}: StyledRendererProps<E> & TProps): JSX.Element {
  const context = useContext(ThemeContext)
  const theme = context?.theme

  const { css, ...otherProps } = props

  let finalCss: CssProp = css
  let finalOtherProps: Record<string, unknown> = otherProps

  if (theme) {
    // Process `css` prop in "aggressive" mode, allowing functions
    finalCss = ThemeUtil.resolveObjWithTheme(css, theme, { processFunctions: true, themeStringsMode: 'vars' })

    // Process all other props (e.g. MUI `sx`, `style`) in vars mode too so the
    // rendered output matches the server's `replaceThemeTokensWithCssVars`
    // pass — both sides emit `var(--meonode-theme-*)` for the same input,
    // which keeps Emotion class hashes identical across SSR/CSR.
    finalOtherProps = ThemeUtil.resolveObjWithTheme(otherProps, theme, { processFunctions: false, themeStringsMode: 'vars' })
  }

  const cssForEmotion = ThemeUtil.resolveDefaultStyle(finalCss)

  return jsx(element as keyof JSX.IntrinsicElements, { ...finalOtherProps, css: cssForEmotion }, children)
}

StyledRenderer.displayName = 'Styled'
;(StyledRenderer as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true
