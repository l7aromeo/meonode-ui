'use client'

import { type JSX, type ReactNode, useContext } from 'react'
import { jsx } from '@emotion/react'
import type { CSSInterpolation } from '@emotion/serialize'
import type { NodeElement } from '@src/node.type.js'
import { resolveObjWithTheme } from '@src/helper/theme.helper.js'
import { ThemeContext } from '@src/components/theme-provider.client.js'
import { resolveDefaultStyle } from '@src/helper/node.helper.js'

export interface StyledRendererProps<E extends NodeElement> {
  element: E
  children?: ReactNode
  css: CSSInterpolation
}

/**
 * A client-side component that renders a styled element using Emotion.
 * It resolves theme values and applies default styles.
 * @template E The type of the HTML element to render.
 * @template TProps The type of the props for the component.
 * @param {StyledRendererProps<E> & TProps} props The props for the component.
 * @returns {JSX.Element} The rendered JSX element.
 */
export default function StyledRenderer<E extends NodeElement, TProps extends Record<string, any>>({
  element,
  children,
  ...props
}: StyledRendererProps<E> & TProps) {
  const context = useContext(ThemeContext)
  const theme = context?.theme
  let finalProps = props

  if (theme) finalProps = resolveObjWithTheme(props, theme.system)
  const css = resolveDefaultStyle(finalProps.css)

  return jsx(element as keyof JSX.IntrinsicElements, { ...finalProps, css }, children)
}

StyledRenderer.displayName = 'Styled'
