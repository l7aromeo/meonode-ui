'use client'

import { type ReactElement, useCallback, useEffect, useRef } from 'react'
import type { NodeElementType, NodePortal } from '@src/node.type.js'
import { Node } from '@src/main.js'

export function usePortal<T extends any[]>(deps: T = [] as unknown as T) {
  const state = useRef<{ portal?: NodePortal; component?: NodeElementType; props?: any }>({})

  const createComponent = useCallback(<P>(fn: (props: P) => ReactElement) => {
    state.current.component = fn
    return new Proxy(fn, {
      apply: (target, thisArg, [props]) => {
        state.current.props = props
        return target.call(thisArg, props)
      },
    })
  }, [])

  useEffect(() => {
    const { portal, component, props } = state.current
    if (portal && component) {
      portal.update(Node(component, props))
    }
  }, deps)

  useEffect(() => () => state.current.portal?.unmount(), [])

  return {
    portal: state.current.portal,
    setPortal: (p: NodePortal) => (state.current.portal = p),
    createComponent,
  }
}
