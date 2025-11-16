import { __DEBUG__ } from '@src/constants/common.const.js'
import { BaseNode } from '@src/core.node.js'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'

/**
 * Lightweight navigation handler that clears cache on SPA navigation.
 */
export class NavigationCacheManagerUtil {
  private constructor() {}

  private static _instance: NavigationCacheManagerUtil | null = null
  private static _originalPushState: typeof history.pushState | null = null
  private static _originalReplaceState: typeof history.replaceState | null = null
  private static _isPatched = false

  private _isListening = false
  private _cleanupTimeout: any = null

  public static getInstance(): NavigationCacheManagerUtil {
    if (!this._instance) {
      this._instance = new NavigationCacheManagerUtil()
    }
    return this._instance
  }

  /**
   * Start listening for navigation events. Idempotent.
   */
  public start() {
    if (this._isListening || typeof window === 'undefined') return

    this._isListening = true
    window.addEventListener('popstate', this._handleNavigation)
    this._patchHistoryMethods()

    // Setup automatic cleanup on page unload
    this._setupAutoCleanup()

    if (__DEBUG__) {
      console.log('[MeoNode] NavigationCacheManagerUtil started')
    }
  }

  /**
   * Stops listening for navigation events and restores original browser APIs.
   * This is important for cleanup during HMR or when unmounting the library.
   */
  private _stop() {
    if (!this._isListening || typeof window === 'undefined') return

    window.removeEventListener('popstate', this._handleNavigation)

    // Clear timers
    if (this._cleanupTimeout) {
      clearTimeout(this._cleanupTimeout)
      this._cleanupTimeout = null
    }

    this._isListening = false

    if (__DEBUG__) {
      console.log('[MeoNode] NavigationCacheManagerUtil stopped')
    }
  }

  /**
   * Debounced navigation handler. Clears mounted element cache and props cache.
   */
  private _handleNavigation = () => {
    if (this._cleanupTimeout) clearTimeout(this._cleanupTimeout)

    this._cleanupTimeout = setTimeout(() => {
      const propsSize = BaseNode.propProcessingCache.size
      let unmountedElementsCleaned = 0

      // Only clean UNMOUNTED elements
      BaseNode.elementCache.keys().forEach(key => {
        // Evict if the node is not currently mounted.
        if (!MountTrackerUtil.mountedNodes.has(key)) {
          BaseNode.elementCache.delete(key)
          unmountedElementsCleaned++
        }
      })

      // Only clear props cache if it's large enough
      if (propsSize > 200) {
        BaseNode.propProcessingCache.clear()
      }

      if (__DEBUG__) {
        console.log(`[MeoNode] Navigation: cleared ${unmountedElementsCleaned} unmounted elements, ${propsSize} props entries`)
      }
    }, 100)
  }

  /**
   * Patch history.pushState/replaceState to detect SPA navigation.
   */
  private _patchHistoryMethods() {
    if (NavigationCacheManagerUtil._isPatched) return

    NavigationCacheManagerUtil._originalPushState = history.pushState
    NavigationCacheManagerUtil._originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      NavigationCacheManagerUtil._originalPushState!.apply(history, args)
      this._handleNavigation()
    }

    history.replaceState = (...args) => {
      NavigationCacheManagerUtil._originalReplaceState!.apply(history, args)
      this._handleNavigation()
    }

    NavigationCacheManagerUtil._isPatched = true
  }

  /**
   * Setup automatic cleanup on page unload.
   * Covers HMR, navigation away, and browser close.
   */
  private _setupAutoCleanup() {
    // Only set up once
    if ((window as any).__MEONODE_CLEANUP_REGISTERED) return

    // Handle page unload (navigation away, refresh, close)
    window.addEventListener('beforeunload', () => {
      this._stop()
      BaseNode.clearCaches()
    })
    ;(window as any).__MEONODE_CLEANUP_REGISTERED = true
  }
}
