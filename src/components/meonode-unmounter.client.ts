'use client'
import { type ReactNode, useEffect, useEffectEvent } from 'react'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'
import { BaseNode } from '@src/core.node.js'

/**
 * `MeoNodeUnmounter` is a client-side React component responsible for cleaning up
 * resources associated with a rendered node when it unmounts.
 *
 * It uses a `useEffect` hook to register a cleanup function that runs when the component
 * unmounts or when its `stableKey` changes. The cleanup function checks if the node
 * identified by `stableKey` is currently tracked as mounted. If it is, it removes
 * the node from `BaseNode.elementCache` and untracks its mount status using `MountTrackerUtil`.
 * @param {object} props The component's props.
 * @param {string} props.stableKey A unique identifier for the rendered node.
 * @param {ReactNode} [props.children] The children to be rendered by this component.
 * @returns {ReactNode} The `children` passed to the component.
 */
export default function MeoNodeUnmounter({ stableKey, children }: { stableKey: string; children?: ReactNode }): ReactNode {
  const onUnmount = useEffectEvent(() => {
    if (MountTrackerUtil.mountedNodes.has(stableKey)) {
      BaseNode.elementCache.delete(stableKey)
      MountTrackerUtil.untrackMount(stableKey)
    }
  })

  useEffect(() => {
    return () => onUnmount()
  }, [])

  return children
}
