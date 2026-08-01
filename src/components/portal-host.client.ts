'use client'
import { useContext, createElement, Fragment, type ReactNode } from 'react'
import { PortalContext } from '@src/components/portal-provider.client.js'
import { useDataChannel } from '@src/hook/useDataChannel.js'
import type { PortalStackEntry } from '@src/types/node.type.js'
import { NodeUtil } from '@src/util/node.util.js'

/**
 * Renders a single portal layer, subscribing to its data channel.
 * Passes `{ data, depth, close }` props to the user's component.
 * @internal
 */
function PortalLayerRenderer({ layer, index, onClose }: { layer: PortalStackEntry; index: number; onClose: () => void }): ReactNode {
  const data = useDataChannel(layer.channel)
  const { Component } = layer
  const depth = index + 1

  // The layer component may return a node rather than a React element — that is
  // the shape every sample on the portal-system docs page uses, and what the
  // `Component` HOC already normalises. Handing a `BaseNode` straight to React
  // throws "Objects are not valid as a React child", so it is rendered here.
  //
  // Wrapped in a stable component rather than rendered inline: calling the
  // layer here would make it part of this component rather than its own, and
  // any hooks it uses would belong to `PortalLayerRenderer` instead.
  return createElement(NodeAwareLayer, { Component, data, depth, close: onClose } as never)
}

/**
 * Invokes a portal layer component and normalises a node return into a React
 * element. Kept as its own component so the layer keeps its own hook scope.
 * @internal
 */
function NodeAwareLayer({ Component, ...layerProps }: { Component: (p: never) => unknown; data: unknown; depth: number; close: () => void }): ReactNode {
  const result = Component(layerProps as never)
  return NodeUtil.isNodeInstance(result) ? result.render() : (result as ReactNode)
}
NodeAwareLayer.displayName = 'NodeAwareLayer'
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
