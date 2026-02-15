'use client'
import { useContext, createElement, Fragment, type ReactNode } from 'react'
import { PortalContext } from '@src/components/portal-provider.client.js'
import { useDataChannel } from '@src/hook/useDataChannel.js'
import type { PortalStackEntry } from '@src/types/node.type.js'

/**
 * Renders a single portal layer, subscribing to its data channel.
 * Passes `{ data, depth, close }` props to the user's component.
 * @internal
 */
function PortalLayerRenderer({ layer, index, onClose }: { layer: PortalStackEntry; index: number; onClose: () => void }): ReactNode {
  const data = useDataChannel(layer.channel)
  const { Component } = layer
  const depth = index + 1

  return createElement(Component, { data, depth, close: onClose } as any)
}
PortalLayerRenderer.displayName = 'PortalLayerRenderer'

/**
 * Renders the portal stack. Place this component where portal layers should appear in the DOM.
 * Renders nothing when the stack is empty.
 * Must be used within a `PortalProvider`.
 */
export default function PortalHost(): ReactNode {
  const ctx = useContext(PortalContext)

  if (!ctx) {
    throw new Error('PortalHost must be used within a PortalProvider')
  }

  const { stack, hidePortalById } = ctx

  if (stack.length === 0) return null

  return createElement(
    Fragment,
    null,
    ...stack.map((layer, i) =>
      createElement(PortalLayerRenderer, {
        key: layer.id,
        layer,
        index: i,
        onClose: () => hidePortalById(layer.id),
      }),
    ),
  )
}
PortalHost.displayName = 'PortalHost'
