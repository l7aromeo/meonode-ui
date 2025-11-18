'use client'
import { type ReactNode, useEffect, useEffectEvent } from 'react'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'
import { BaseNode } from '@src/core.node.js'
import type { NodeInstance } from '@src/types/node.type.js'

/**
 * `MeoNodeUnmounter` is a client-side React component responsible for cleaning up
 * resources associated with a rendered node when it unmounts.
 *
 * It uses a `useEffect` hook to register a cleanup function that runs when the component
 * unmounts or when its `stableKey` changes. The cleanup function checks if the node
 * identified by `stableKey` is currently tracked as mounted. If it is, it removes
 * the node from `BaseNode.elementCache` and untracks its mount status using `MountTrackerUtil`.
 * Additionally, it clears the `lastPropsRef` and `lastSignature` of the associated `BaseNode`
 * instance to prevent memory leaks from retained prop objects.
 * @param {object} props The component's props.
 * @param {NodeInstance} props.node The BaseNode instance associated with this component.
 * @param {ReactNode} [props.children] The children to be rendered by this component.
 * @returns {ReactNode} The `children` passed to the component.
 */
export default function MeoNodeUnmounter({ node, children }: { node: NodeInstance; children?: ReactNode }): ReactNode {
  const onUnmount = useEffectEvent(() => {
    if (node.stableKey && MountTrackerUtil.mountedNodes.has(node.stableKey)) {
      BaseNode.elementCache.delete(node.stableKey)
      MountTrackerUtil.untrackMount(node.stableKey)
    }
    // Explicitly clear lastPropsRef and lastSignature to prevent memory leaks
    // from retained prop objects, even if the BaseNode instance is not immediately GC'd.
    node.lastPropsRef = null
    node.lastSignature = undefined
  })

  useEffect(() => {
    return () => onUnmount()
  }, [])

  return children
}
