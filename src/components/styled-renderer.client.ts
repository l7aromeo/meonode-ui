'use client'
import { type ElementType, type JSX, type ReactNode, useContext } from 'react'
import { jsx } from '@emotion/react'
import type { CssProp, NodeElement } from '@src/types/node.type.js'
import { ThemeContext } from '@src/components/theme-provider.client.js'
import { ThemeUtil } from '@src/util/theme.util.js'
import { reportThemeIssues } from '@src/util/theme-diagnostics.util.js'
import { isValidElementType } from '@src/helper/react-is.helper.js'

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

  // `as` is consumed (never spread onto the DOM). It swaps the render target,
  // mirroring the swap done in `core.node.ts`. This is belt-and-braces: the core
  // path already strips `as` and forwards the resolved element, but if `as` ever
  // reaches here we honor it instead of leaking it as a bogus attribute.
  // `isValidElementType` narrows `asTarget` to `ElementType`, so no cast is needed there.
  const { css, as: asTarget, ...otherProps } = props
  let renderTarget = element as ElementType
  if (asTarget != null && isValidElementType(asTarget)) {
    renderTarget = asTarget
  }

  // `otherProps` arrive already var-converted from `core.node.ts`
  // (`replaceThemeTokensWithCssVars` runs on every node's `elementProps`),
  // so no further processing is needed here. `css` still needs resolution
  // to execute any callable theme refs and to expand string tokens that
  // may have been provided directly via `css` rather than via `elementProps`.
  const finalCss: CssProp = theme ? ThemeUtil.resolveObjWithTheme(css, theme, { processFunctions: true, themeStringsMode: 'vars' }) : css

  // Development only: the last point where the live theme and the fully
  // resolved declarations are both in hand, so a token that names a variable
  // the theme never defines can still be reported before it silently
  // disappears into Emotion. No-ops in production.
  reportThemeIssues(finalCss, theme)

  const cssForEmotion = ThemeUtil.resolveDefaultStyle(finalCss)

  return jsx(renderTarget, { ...otherProps, css: cssForEmotion }, children)
}

StyledRenderer.displayName = 'Styled'
;(StyledRenderer as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true
