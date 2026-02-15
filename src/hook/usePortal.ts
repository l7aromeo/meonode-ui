'use client'
import { useContext, useRef, useCallback, useEffect } from 'react'
import { PortalContext } from '@src/components/portal-provider.client.js'
import type { PortalHandle, PortalLayerProps } from '@src/types/node.type.js'

/**
 * React hook for imperative portal control.
 * Provides methods to open, update, and close portals from within the component tree.
 * Must be used within a `PortalProvider`.
 * @template T The type of data to be synchronized with the portal.
 * @param data Optional data to keep in sync with the most recently opened portal.
 * If provided, any changes to this data will automatically call `updateData`.
 * @returns An object with:
 * - `open(Component, initialData?)` — opens a portal layer and returns a PortalHandle
 * - `updateData(next)` — pushes new data to the most recently opened portal
 * - `close()` — closes the most recently opened portal
 * - `handle` — ref to the current PortalHandle
 * @example
 * ```ts
 * // With auto-sync
 * const [count, setCount] = useState(0)
 * const portal = usePortal({ count, setCount })
 *
 * const handleOpen = () => {
 *   portal.open(MyContent, { count, setCount })
 * }
 *
 * // Without auto-sync
 * const portal = usePortal()
 * ```
 */
export function usePortal<T = any>(data?: T) {
  const ctx = useContext(PortalContext)

  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider')
  }

  const handleRef = useRef<PortalHandle | null>(null)

  // Auto-sync data if provided
  useEffect(() => {
    if (data !== undefined && handleRef.current) {
      handleRef.current.updateData(data)
    }
  }, [data])

  const open = useCallback(
    <P = T>(Component: React.ComponentType<PortalLayerProps<P>>, initialData?: P): PortalHandle<P> => {
      const handle = ctx.showPortal(Component, (initialData ?? data) as P)
      handleRef.current = handle
      return handle
    },
    [ctx.showPortal, data],
  )

  const updateData = useCallback(<T>(next: T) => {
    handleRef.current?.updateData(next)
  }, [])

  const close = useCallback(() => {
    handleRef.current?.close()
    handleRef.current = null
  }, [])

  return { open, updateData, close, handle: handleRef }
}
