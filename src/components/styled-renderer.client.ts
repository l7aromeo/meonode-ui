'use client'

import { type JSX, type ReactNode } from 'react'
import { jsx } from '@emotion/react'
import type { CSSInterpolation } from '@emotion/serialize'
import type { NodeElement } from '@src/node.type.js'

export interface StyledRendererProps<E extends NodeElement> {
  element: E
  children?: ReactNode
  css?: CSSInterpolation
}

export default function StyledRenderer<E extends NodeElement, TProps extends Record<string, any>>({
  element,
  children,
  ...props
}: StyledRendererProps<E> & TProps) {
  return jsx(element as keyof JSX.IntrinsicElements, props, children)
}

StyledRenderer.displayName = 'Styled'
