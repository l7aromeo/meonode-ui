'use client'

import React, { type JSX } from 'react'
import { jsx } from '@emotion/react'
import type { CSSInterpolation } from '@emotion/serialize'

interface StyledRendererProps {
  element: keyof JSX.IntrinsicElements
  children: React.ReactNode
  css: CSSInterpolation
  [key: string]: any
}

export default function StyledRenderer({ element, css, children, ...props }: StyledRendererProps) {
  return jsx(element, { ...props, css }, children)
}
