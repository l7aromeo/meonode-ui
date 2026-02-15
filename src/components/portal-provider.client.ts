'use client'
import { createContext, type ReactNode, useState, useRef, useCallback, useMemo } from 'react'
import type { Children, PortalContextValue, PortalStackEntry, PortalHandle, PortalLayerProps } from '@src/types/node.type.js'
import { Node } from '@src/core.node.js'
import { createDataChannel } from '@src/helper/data-channel.helper.js'

export const PortalContext = createContext<PortalContextValue | null>(null)

/**
 * Provides portal context to the component tree.
 * Manages the portal stack state and exposes methods for opening/closing portals.
 * Must wrap any components that use `usePortal()` or `PortalHost`.
 * @param children The children to render.
 * @returns The rendered component tree with portal context.
 */
export default function PortalProvider({ children }: { children?: Children }): ReactNode {
  const [stack, setStack] = useState<PortalStackEntry[]>([])
  const idCounter = useRef(0)

  const showPortal = useCallback(<T>(Component: React.ComponentType<PortalLayerProps<T>>, initialData?: T): PortalHandle<T> => {
    const id = ++idCounter.current
    const channel = createDataChannel<T>(initialData)

    setStack(prev => [...prev, { id, Component: Component as React.ComponentType<PortalLayerProps>, channel }])

    return {
      id,
      updateData: (next: T) => channel.set(next),
      close: () => setStack(prev => prev.filter(l => l.id !== id)),
    }
  }, [])

  const hidePortal = useCallback(() => {
    setStack(prev => prev.slice(0, -1))
  }, [])

  const hidePortalById = useCallback((id: number) => {
    setStack(prev => prev.filter(l => l.id !== id))
  }, [])

  const hideAll = useCallback(() => {
    setStack([])
  }, [])

  const value = useMemo<PortalContextValue>(
    () => ({ stack, showPortal, hidePortal, hidePortalById, hideAll }),
    [stack, showPortal, hidePortal, hidePortalById, hideAll],
  )

  return Node(PortalContext.Provider, { value, children }).render()
}
