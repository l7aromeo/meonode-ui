import { SafeCacheManager } from '@src/helper/safe-cache-manager.helper.js'
import { __DEV__ } from '@src/constants/common.const.js'
import { BaseNode } from '@src/core.node.js'

/**
 * NavigationCacheManager listens for navigation events in the browser
 * and triggers safe cleanup of the element cache to prevent memory leaks.
 * It supports standard browser navigation as well as SPA routing changes.
 *
 * Framework-agnostic: Works with Next.js, React Router, etc.
 */
export class NavigationCacheManager {
  private static _instance: NavigationCacheManager | null = null
  private static _originalPushState: typeof history.pushState | null = null
  private static _originalReplaceState: typeof history.replaceState | null = null
  private static _isPatched = false

  private _isListening = false
  private _cleanupTimeout: any = null
  private _memoryCheckInterval: any = null

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): NavigationCacheManager {
    if (!this._instance) {
      this._instance = new NavigationCacheManager()
    }
    return this._instance
  }

  /**
   * Starts listening for navigation events to trigger cache cleanup.
   * This method is idempotent and safe to call multiple times.
   */
  public start() {
    if (this._isListening || typeof window === 'undefined') return

    this._isListening = true

    // Listen for standard browser navigation event
    window.addEventListener('popstate', this._handleNavigation)

    // Patch history methods to catch SPA routing changes
    this._patchHistoryMethods()

    // Optional: Start memory pressure monitoring
    this._startMemoryMonitoring()

    // Setup automatic cleanup on page unload
    this._setupAutoCleanup()

    if (__DEV__) {
      console.log('[MeoNode] NavigationCacheManager started')
    }
  }

  /**
   * Stops listening for navigation events and restores original browser APIs.
   * This is important for cleanup during HMR or when unmounting the library.
   */
  private _stop() {
    if (!this._isListening || typeof window === 'undefined') return

    window.removeEventListener('popstate', this._handleNavigation)

    // Restore original history methods
    this._unpatchHistoryMethods()

    // Clear timers
    if (this._cleanupTimeout) {
      clearTimeout(this._cleanupTimeout)
      this._cleanupTimeout = null
    }

    if (this._memoryCheckInterval) {
      clearInterval(this._memoryCheckInterval)
      this._memoryCheckInterval = null
    }

    this._isListening = false

    if (__DEV__) {
      console.log('[MeoNode] NavigationCacheManager stopped')
    }
  }

  private _handleNavigation = () => {
    // Debounce navigation events to handle rapid changes gracefully
    if (this._cleanupTimeout) clearTimeout(this._cleanupTimeout)

    this._cleanupTimeout = setTimeout(() => {
      const evictedCount = SafeCacheManager.safeCleanup()

      if (__DEV__ && evictedCount > 0) {
        console.log(`[MeoNode] Navigation detected. Safely evicted ${evictedCount} unmounted elements from cache.`)
      }
    }, 100) // Short delay to batch multiple navigation events
  }

  private _patchHistoryMethods() {
    // Guard against multiple patches (HMR safety)
    if (NavigationCacheManager._isPatched) return

    // Store original methods
    NavigationCacheManager._originalPushState = history.pushState
    NavigationCacheManager._originalReplaceState = history.replaceState

    // Patch pushState
    history.pushState = (...args) => {
      NavigationCacheManager._originalPushState!.apply(history, args)
      this._handleNavigation()
    }

    // Patch replaceState
    history.replaceState = (...args) => {
      NavigationCacheManager._originalReplaceState!.apply(history, args)
      this._handleNavigation()
    }

    NavigationCacheManager._isPatched = true

    if (__DEV__) {
      console.log('[MeoNode] History methods patched for SPA navigation detection')
    }
  }

  private _unpatchHistoryMethods() {
    if (!NavigationCacheManager._isPatched) return

    // Restore original methods
    if (NavigationCacheManager._originalPushState) {
      history.pushState = NavigationCacheManager._originalPushState
    }
    if (NavigationCacheManager._originalReplaceState) {
      history.replaceState = NavigationCacheManager._originalReplaceState
    }

    NavigationCacheManager._isPatched = false

    if (__DEV__) {
      console.log('[MeoNode] History methods restored')
    }
  }

  private _startMemoryMonitoring() {
    // Only in development or if explicitly enabled
    if (!__DEV__) return

    // Check if Performance Memory API is available (Chrome/Edge only)
    if (typeof performance === 'undefined' || !('memory' in performance)) return

    this._memoryCheckInterval = setInterval(() => {
      const mem = (performance as any).memory
      if (!mem) return

      const usedPercent = mem.usedJSHeapSize / mem.jsHeapSizeLimit

      // Trigger emergency cleanup at 85% memory usage
      if (usedPercent > 0.85) {
        const evicted = SafeCacheManager.emergencyCleanup()
        console.warn(`[MeoNode] High memory usage (${(usedPercent * 100).toFixed(1)}%). ` + `Emergency cleanup evicted ${evicted} entries.`)
      }
    }, 30000) // Check every 30 seconds
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

    // Handle visibility change (tab switching, minimize)
    // Good opportunity for lazy cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Run cleanup when tab is hidden
        setTimeout(() => {
          if (document.hidden) {
            // Still hidden after 5s
            SafeCacheManager.safeCleanup()
          }
        }, 5000)
      }
    })
    ;(window as any).__MEONODE_CLEANUP_REGISTERED = true
  }
}
