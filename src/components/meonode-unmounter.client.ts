'use client'
import { cloneElement, isValidElement, type ReactNode, useEffect, useEffectEvent } from 'react'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

/**
 * `MeoNodeUnmounter` is a client-side React component responsible for performing cleanup
 * operations when a `MeoNode` instance is unmounted from the React tree.
 *
 * It leverages `useEffectEvent` to create a stable cleanup function that is called
 * when the component unmounts. This cleanup function performs the following actions:
 * - Deletes the node from `BaseNode.elementCache` using its `stableKey`.
 * - Untracks the node's mount status via `MountTrackerUtil.untrackMount`.
 * - Unregisters the node from `BaseNode.cacheCleanupRegistry` to prevent redundant
 *   finalization callbacks.
 * - Clears the `lastSignature` of the associated `BaseNode` instance to help prevent
 *   memory leaks from retained prop objects.
 * @param {object} props The component's props.
 * @param {NodeInstance} props.node The BaseNode instance associated with this component.
 * @param {ReactNode} [props.children] The children to be rendered by this component.
 * @returns {ReactNode} The `children` passed to the component.
 */
export default function MeoNodeUnmounter({ children, ...props }: { node: NodeInstance; children?: ReactNode }): ReactNode {
  // Extract node from props, excluding it from rest
  const { node, ...rest } = props

  const onUnmount = useEffectEvent(() => {
    if (node.stableKey) {
      BaseNode.elementCache.delete(node.stableKey)

      if (MountTrackerUtil.isMounted(node.stableKey)) {
        MountTrackerUtil.untrackMount(node.stableKey)
      }

      // Unregister from FinalizationRegistry to prevent redundant callback execution
      BaseNode.cacheCleanupRegistry.unregister(node)
    }

    // Clear lastSignature to prevent memory leaks from retained prop objects
    node.lastSignature = undefined
  })

  useEffect(() => {
    // Track mount when component mounts
    if (node.stableKey) {
      MountTrackerUtil.trackMount(node.stableKey)
    }

    // Untrack when component unmounts
    return () => onUnmount()
  }, [])

  // If children is a valid React element and we have additional props (from cloneElement),
  // clone it with those props. This allows libraries like MUI to inject implicit props.
  // The `node` prop is explicitly excluded to prevent it from leaking to the DOM.
  if (isValidElement(children) && Object.keys(rest).length > 0) {
    return cloneElement(children, rest)
  }

  return children
}
