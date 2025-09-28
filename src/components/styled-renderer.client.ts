'use client'

import { type JSX, type ReactNode, useContext } from 'react'
import { jsx } from '@emotion/react'
import type { CssProp, NodeElement } from '@src/node.type.js'
import { resolveObjWithTheme } from '@src/helper/theme.helper.js'
import { ThemeContext } from '@src/components/theme-provider.client.js'
import { resolveDefaultStyle } from '@src/helper/node.helper.js'

export interface StyledRendererProps<E extends NodeElement> {
  element: E
  children?: ReactNode
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

  let finalCss = css
  let finalOtherProps = otherProps

  if (theme) {
    // Process `css` prop in "aggressive" mode, allowing functions
    finalCss = resolveObjWithTheme(css, theme, { processFunctions: true })

    // Process all other props in "safe" mode, ignoring functions
    finalOtherProps = resolveObjWithTheme(otherProps, theme, { processFunctions: false })
  }

  const cssForEmotion = resolveDefaultStyle(finalCss)

  return jsx(element as keyof JSX.IntrinsicElements, { ...finalOtherProps, css: cssForEmotion }, children)
}

StyledRenderer.displayName = 'Styled'
