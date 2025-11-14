import { SafeCacheManager } from '@src/helper/safe-cache-manager.helper.js'
import { __DEV__ } from '@src/constants/common.const.js'

/**
 * NavigationCacheManager listens for navigation events in the browser
 * and triggers safe cleanup of the element cache to prevent memory leaks.
 * It supports standard browser navigation as well as SPA routing changes.
 */
export class NavigationCacheManager {
  private static _instance: NavigationCacheManager | null = null
  private _isListening = false
  private _cleanupTimeout: any = null

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

    // Listen for standard browser navigation event.
    window.addEventListener('popstate', this._handleNavigation)

    // Patch history methods to catch SPA routing changes.
    this._patchHistoryMethods()

    // Attempt to integrate with React Router if present.
    this._setupReactRouterIntegration()
  }

  /**
   * Stops listening for navigation events.
   */
  public stop() {
    if (!this._isListening || typeof window === 'undefined') return

    window.removeEventListener('popstate', this._handleNavigation)

    // Note: We are not un-patching history methods as it's complex and
    // can cause issues with other libraries. The patch is lightweight.

    if (this._cleanupTimeout) {
      clearTimeout(this._cleanupTimeout)
    }

    this._isListening = false
  }

  private _handleNavigation = () => {
    // Debounce navigation events to handle rapid changes gracefully.
    if (this._cleanupTimeout) clearTimeout(this._cleanupTimeout)

    this._cleanupTimeout = setTimeout(() => {
      const evictedCount = SafeCacheManager.safeCleanup()

      if (__DEV__) {
        console.log(`MeoNode: Navigation detected. Safely evicted ${evictedCount} unmounted elements from cache.`)
      }
    }, 100) // A short delay to batch potential multiple navigation events.
  }

  private _patchHistoryMethods() {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this._handleNavigation()
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this._handleNavigation()
    }
  }

  private _setupReactRouterIntegration() {
    // This is a speculative integration attempt for React Router.
    // It relies on specific global objects that may not always be present.
    // A more robust solution would involve context or direct history listening if available.
    if ((window as any).__REACT_ROUTER__) {
      // The following is an example of how one might patch `useNavigate`.
      // This is highly experimental and may not work with all versions of React Router.
      const reactRouter = (window as any).ReactRouter
      if (reactRouter && typeof reactRouter.useNavigate === 'function') {
        const originalUseNavigate = reactRouter.useNavigate
        reactRouter.useNavigate = function (...args: any[]) {
          const navigate = originalUseNavigate.apply(this, args)
          return function (...navArgs: any[]) {
            const result = navigate(...navArgs)
            NavigationCacheManager.getInstance()._handleNavigation()
            return result
          }
        }
      }
    }
  }
}
