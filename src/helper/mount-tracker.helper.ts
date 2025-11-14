import { BaseNode } from '@src/core.node.js'
import { __DEV__ } from '@src/constants/common.const.js'

/**
 * MountTracker keeps track of which BaseNode instances are currently mounted in the DOM.
 * It listens for navigation events to trigger cleanup of unmounted nodes from the cache.
 */
export class MountTracker {
  private static _mountedNodes = new Set<string>()
  private static _navigationListener: (() => void) | null = null

  public static trackMount(node: BaseNode<any>) {
    this._mountedNodes.add(node._stableKey)
    this._ensureNavigationListener()
  }

  public static trackUnmount(node: BaseNode<any>) {
    this._mountedNodes.delete(node._stableKey)
  }

  public static isMounted(node: BaseNode<any>): boolean {
    return this._mountedNodes.has(node._stableKey)
  }

  private static _ensureNavigationListener() {
    if (this._navigationListener || typeof window === 'undefined') return

    // Single listener for all navigation events
    this._navigationListener = () => this._onNavigation()

    // SPA navigation detection
    window.addEventListener('popstate', this._navigationListener)

    // Override pushState/replaceState
    const originalPushState = history.pushState
    history.pushState = function (this: History, ...args: Parameters<typeof history.pushState>) {
      originalPushState.apply(this, args)
      MountTracker._navigationListener?.()
    }

    const originalReplaceState = history.replaceState
    history.replaceState = function (this: History, ...args: Parameters<typeof history.replaceState>) {
      originalReplaceState.apply(this, args)
      MountTracker._navigationListener?.()
    }
  }

  private static _onNavigation() {
    // Only clear cache for UNMOUNTED nodes
    const nodesToClear: string[] = []

    for (const [cacheKey] of BaseNode._elementCache.entries()) {
      // Create a mock node to check if it's mounted
      // This is safe because we're only checking mount status
      if (!this._mountedNodes.has(cacheKey)) {
        nodesToClear.push(cacheKey)
      }
    }

    // Clear only unmounted nodes
    nodesToClear.forEach(key => BaseNode._elementCache.delete(key))

    if (__DEV__) {
      console.log(`MeoNode: Cleared ${nodesToClear.length} unmounted elements on navigation`)
    }
  }

  public static cleanup() {
    if (this._navigationListener) {
      window.removeEventListener('popstate', this._navigationListener)
      this._navigationListener = null
    }
    this._mountedNodes.clear()
  }
}
