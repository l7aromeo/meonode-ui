'use client'

import React, { type JSX } from 'react'
import { type CSSObject, jsx } from '@emotion/react'

interface StyledRendererProps {
  element: keyof JSX.IntrinsicElements
  children: React.ReactNode
  css?: CSSObject
  [key: string]: any
}

export default function StyledRenderer({ element, css = {}, children, ...props }: StyledRendererProps) {
  return jsx(element, { ...props, css }, children)
}
