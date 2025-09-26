'use client'

import { type ReactElement, useCallback, useEffect, useRef } from 'react'
import type { NodeElementType, NodePortal, PortalProps } from '@src/node.type.js'
import { Node } from '@src/core.node.js'

export function usePortal<T extends any[]>(deps: T = [] as unknown as T) {
  const state = useRef<{ portal?: NodePortal; component?: NodeElementType; props?: any }>({})

  const createComponent = useCallback(<P extends Record<string, any>>(fn: (props: PortalProps<P>) => ReactElement) => {
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

  useEffect(
    () => () => {
      state.current.portal?.unmount()
      state.current.portal = undefined
      state.current.component = undefined
      state.current.props = undefined
    },
    [],
  )

  return {
    portal: state.current.portal,
    setPortal: (p: NodePortal) => (state.current.portal = p),
    createComponent,
  }
}
