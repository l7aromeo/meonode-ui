import { BaseNode } from '@src/core.node.js'
import type { ElementCacheEntry } from '@src/types/node.type.js'
import { MountTracker } from '@src/helper/mount-tracker.helper.js'
import type { ReactElement } from 'react'

// Estimates the "size" of a React element based on its props and children.
// This is a heuristic to help with eviction decisions.
function _estimateElementSize<P extends Record<string, any>>(element: ReactElement<P> | null): number {
  if (!element) return 0
  let size = 1
  if (element.props) {
    size += Object.keys(element.props).length
    if (element.props.children) {
      const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children]
      for (const child of children) {
        if (typeof child === 'object' && child !== null && 'props' in child) {
          size += _estimateElementSize(child as ReactElement<Record<string, any>>)
        }
      }
    }
  }
  return size
}

/**
 * SafeCacheManager provides methods to clean up the element cache
 * in a way that minimizes the risk of removing elements that are still in use.
 * It uses various eviction policies to determine which entries can be safely removed.
 */
export class SafeCacheManager {
  private static _evictionPolicies = {
    /**
     * Evicts entries that are either not mounted or whose node instance has been garbage-collected.
     * This is the primary policy for preventing memory leaks from stale cache entries.
     */
    evictUnmounted: (entry: ElementCacheEntry): boolean => {
      const node = entry.nodeRef.deref()
      if (!node) {
        return true // Evict if the node instance is garbage-collected.
      }
      return !MountTracker.isMounted(node as BaseNode<any>)
    },

    /**
     * Evicts unmounted entries that are older than a specified threshold (e.g., 10 minutes).
     * This is useful for cleaning up caches during long-running sessions.
     */
    evictOldUnmounted: (entry: ElementCacheEntry): boolean => {
      const node = entry.nodeRef.deref()
      if (!node) {
        return true // Evict if GC'd
      }
      if (MountTracker.isMounted(node as BaseNode<any>)) {
        return false // Never evict mounted components with this policy.
      }

      return Date.now() - entry.createdAt > 10 * 60 * 1000 // 10 minutes
    },

    /**
     * An aggressive eviction policy for high memory pressure scenarios.
     * It preserves mounted components but otherwise evicts based on a score
     * calculated from element size and usage frequency.
     */
    emergencyEviction: (entry: ElementCacheEntry): boolean => {
      const node = entry.nodeRef.deref()
      if (!node) {
        return true // Evict if GC'd
      }
      if (MountTracker.isMounted(node as BaseNode<any>)) {
        return false // Still preserve mounted components.
      }

      // Preferentially evict large, infrequently used components.
      const sizeScore = _estimateElementSize(entry.renderedElement)
      const usageScore = 1000 / (entry.accessCount + 1) // Inversely proportional to access count.
      return sizeScore * usageScore > 1000 // Eviction threshold.
    },
  }

  /**
   * Performs a safe cleanup of the element cache.
   * It applies standard eviction policies to remove unmounted and old entries.
   * This is typically called after a navigation event.
   */
  public static safeCleanup(): number {
    const policies = [this._evictionPolicies.evictUnmounted, this._evictionPolicies.evictOldUnmounted]

    let evictedCount = 0
    for (const [cacheKey, entry] of BaseNode._elementCache.entries()) {
      // An entry is evicted if ANY policy decides it should be.
      if (policies.some(policy => policy(entry))) {
        entry.onEvict?.() // Trigger unmount tracking.
        BaseNode._elementCache.delete(cacheKey)
        evictedCount++
      }
    }

    return evictedCount
  }

  /**
   * Performs an emergency cleanup of the element cache.
   * This uses a more aggressive eviction policy and is intended to be called
   * when memory pressure is detected.
   */
  public static emergencyCleanup(): number {
    let evictedCount = 0
    for (const [cacheKey, entry] of BaseNode._elementCache.entries()) {
      if (this._evictionPolicies.emergencyEviction(entry)) {
        entry.onEvict?.()
        BaseNode._elementCache.delete(cacheKey)
        evictedCount++
      }
    }
    return evictedCount
  }
}
