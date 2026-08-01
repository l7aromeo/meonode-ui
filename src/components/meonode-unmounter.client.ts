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
 * - Deletes the node from `BaseNode.elementCache` using its render-time cache key.
 * - Untracks the node's mount status via `MountTrackerUtil.untrackMount`.
 * - Unregisters the node from `BaseNode.cacheCleanupRegistry` to prevent redundant
 *   finalization callbacks.
 * - Clears the `lastSignature` of the associated `BaseNode` instance to help prevent
 *   memory leaks from retained prop objects.
 *
 * The cache key arrives as a prop rather than being read from the node, because
 * it belongs to the render that mounted this element — a node's position is a
 * property of where it was rendered, not of the instance.
 * @param {object} props The component's props.
 * @param {NodeInstance} props.node The BaseNode instance associated with this component.
 * @param {string} props.cacheKey The `elementCache` key for this node's mount.
 * @param {ReactNode} [props.children] The children to be rendered by this component.
 * @returns {ReactNode} The `children` passed to the component.
 */
export default function MeoNodeUnmounter({ children, ...props }: { node: NodeInstance; cacheKey: string; children?: ReactNode }): ReactNode {
  // Extract node and cacheKey, excluding both from rest so neither can reach the
  // DOM through the cloneElement path below.
  const { node, cacheKey, ...rest } = props

  const onUnmount = useEffectEvent(() => {
    if (cacheKey) {
      // Delete the element cache entry
      BaseNode.elementCache.delete(cacheKey)

      if (MountTrackerUtil.isMounted(cacheKey)) {
        MountTrackerUtil.untrackMount(cacheKey)
      }

      // Unregister from FinalizationRegistry to prevent redundant callback execution
      try {
        BaseNode.cacheCleanupRegistry.unregister(node)
      } catch {
        // Ignore if not registered or not eligible
      }
    }

    // Clear lastSignature to prevent memory leaks from retained prop objects
    node.lastSignature = undefined
  })

  useEffect(() => {
    // Track mount when component mounts
    if (cacheKey) {
      MountTrackerUtil.trackMount(cacheKey)
    }

    // Untrack when component unmounts
    return () => onUnmount()
  }, [])

  // If children is a valid React element and we have additional props (from cloneElement),
  // clone it with those props. This allows libraries like MUI to inject implicit props.
  // The `node` and `cacheKey` props are explicitly excluded to prevent them from
  // leaking to the DOM.
  if (isValidElement(children) && Object.keys(rest).length > 0) {
    return cloneElement(children, rest)
  }

  return children
}
