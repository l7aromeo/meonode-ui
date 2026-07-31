import { __DEBUG__ } from '@src/constant/common.const.js'
import { BaseNode } from '@src/core.node.js'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'

declare global {
  interface Window {
    __MEONODE_CLEANUP_REGISTERED?: boolean
  }
}

/**
 * Lightweight navigation handler that clears cache on SPA navigation.
 */
export class NavigationCacheManagerUtil {
  private constructor() {}

  private static _instance: NavigationCacheManagerUtil | null = null
  private static _originalPushState: typeof history.pushState | null = null
  private static _originalReplaceState: typeof history.replaceState | null = null

  /**
   * The wrappers this class installed. Kept so `_unpatchHistoryMethods` can tell
   * "still ours" from "someone patched on top of us" and only restore the former
   * — blindly assigning the originals back would silently uninstall a router's
   * own history patch if it wrapped ours afterwards.
   */
  private static _patchedPushState: typeof history.pushState | null = null
  private static _patchedReplaceState: typeof history.replaceState | null = null
  private static _isPatched = false

  private _isListening = false
  private _cleanupTimeout: NodeJS.Timeout | null = null

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
    NavigationCacheManagerUtil._unpatchHistoryMethods()

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

    const cacheSize = BaseNode.elementCache.size
    const debounceMs = cacheSize < 100 ? 50 : cacheSize < 500 ? 100 : 200

    this._cleanupTimeout = setTimeout(() => {
      let unmountedElementsCleaned = 0

      // Only clean UNMOUNTED elements
      BaseNode.elementCache.keys().forEach(key => {
        // Evict if the node is not currently mounted.
        if (!MountTrackerUtil.isMounted(key)) {
          BaseNode.elementCache.delete(key)
          unmountedElementsCleaned++
        }
      })

      if (__DEBUG__) {
        console.log(`[MeoNode] Navigation: cleared ${unmountedElementsCleaned} unmounted elements`)
      }
    }, debounceMs)
  }

  /**
   * Patch history.pushState/replaceState to detect SPA navigation.
   */
  private _patchHistoryMethods() {
    if (NavigationCacheManagerUtil._isPatched) return

    // Read through `window` rather than the bare global. `start()` only proves
    // `window` exists, and the two are not always the same thing: a jsdom
    // instance installed as `globalThis.window` gives a `window.history` while
    // the bare `history` identifier is undefined, which threw a
    // `ReferenceError` out of the first node construction in the process.
    //
    // Environments without History at all (workers, some webviews) degrade
    // instead of throwing: `popstate` is still listened for, so the cache is
    // still cleared on back/forward, only `pushState`/`replaceState` go
    // undetected.
    const historyApi = window.history
    if (typeof historyApi?.pushState !== 'function' || typeof historyApi.replaceState !== 'function') {
      if (__DEBUG__) {
        console.warn('[MeoNode] History API unavailable; SPA navigation via pushState will not evict cached elements.')
      }
      return
    }

    NavigationCacheManagerUtil._originalPushState = historyApi.pushState
    NavigationCacheManagerUtil._originalReplaceState = historyApi.replaceState

    const pushState: typeof historyApi.pushState = (...args) => {
      NavigationCacheManagerUtil._originalPushState!.apply(historyApi, args)
      this._handleNavigation()
    }

    const replaceState: typeof historyApi.replaceState = (...args) => {
      NavigationCacheManagerUtil._originalReplaceState!.apply(historyApi, args)
      this._handleNavigation()
    }

    historyApi.pushState = pushState
    historyApi.replaceState = replaceState

    NavigationCacheManagerUtil._patchedPushState = pushState
    NavigationCacheManagerUtil._patchedReplaceState = replaceState
    NavigationCacheManagerUtil._isPatched = true
  }

  /**
   * Undo `_patchHistoryMethods`, putting the native implementations back.
   *
   * Restores each method only when the live value is still the wrapper this
   * class installed. If something patched over ours after the fact, its wrapper
   * stays and we drop our references instead — losing our own eviction hook is
   * far cheaper than tearing out an unrelated one.
   */
  private static _unpatchHistoryMethods() {
    if (!this._isPatched) return

    const historyApi = typeof window === 'undefined' ? undefined : window.history
    if (historyApi) {
      if (this._originalPushState && historyApi.pushState === this._patchedPushState) {
        historyApi.pushState = this._originalPushState
      }
      if (this._originalReplaceState && historyApi.replaceState === this._patchedReplaceState) {
        historyApi.replaceState = this._originalReplaceState
      }
    }

    this._originalPushState = null
    this._originalReplaceState = null
    this._patchedPushState = null
    this._patchedReplaceState = null
    this._isPatched = false
  }

  /**
   * Setup automatic cleanup on page unload.
   * Covers HMR, navigation away, and browser close.
   */
  private _setupAutoCleanup() {
    // Only set up once
    if (window.__MEONODE_CLEANUP_REGISTERED) return

    // Handle page unload (navigation away, refresh, close)
    window.addEventListener('beforeunload', () => {
      this._stop()
      BaseNode.clearCaches()
    })
    window.__MEONODE_CLEANUP_REGISTERED = true
  }
}
