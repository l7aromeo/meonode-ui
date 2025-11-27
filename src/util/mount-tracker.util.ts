import { __DEBUG__ } from '@src/constant/common.const.js'

/**
 * MountTrackerUtil keeps track of which BaseNode instances are currently mounted in the DOM.
 * It provides a simple registry for mount/unmount state that other systems
 * (like NavigationCacheManager) can query for safe cache eviction.
 */
export class MountTrackerUtil {
  private constructor() {}

  private static _mountedCounts = new Map<string, number>()
  private static _unmountCallCount = new Map<string, number>() // Debug only

  /**
   * Checks if a node is currently mounted.
   */
  public static isMounted(key: string): boolean {
    return (this._mountedCounts.get(key) || 0) > 0
  }

  /**
   * Tracks a node as mounted. Increments the reference count for the stable key.
   */
  public static trackMount(key: string) {
    const count = this._mountedCounts.get(key) || 0
    this._mountedCounts.set(key, count + 1)

    if (__DEBUG__) {
      this._unmountCallCount.delete(key)
    }
  }

  /**
   * Decrements the reference count for the stable key.
   * If the count reaches zero, the node is considered fully unmounted.
   * @returns True if the node is still mounted (count > 0), false if fully unmounted.
   */
  public static untrackMount(key: string) {
    const count = this._mountedCounts.get(key) || 0
    if (count > 0) {
      const newCount = count - 1
      if (newCount === 0) {
        this._mountedCounts.delete(key)
      } else {
        this._mountedCounts.set(key, newCount)
      }
      return newCount > 0
    }

    if (__DEBUG__) {
      const debugCount = (this._unmountCallCount.get(key) || 0) + 1
      this._unmountCallCount.set(key, debugCount)
      if (debugCount > 1) {
        console.warn(
          `[MeoNode] untrackMount called ${debugCount} times for an already unmounted node: ${key}. This could indicate a memory leak or a bug in a component's lifecycle.`,
        )
      }
    }
    return false
  }

  /**
   * Cleans up all internal state of the MountTrackerUtil.
   * Removes all tracked nodes and debug counters.
   */
  public static cleanup() {
    this._mountedCounts.clear()

    if (__DEBUG__) {
      this._unmountCallCount.clear()
    }
  }
}
