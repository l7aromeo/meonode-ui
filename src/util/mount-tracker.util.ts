import { __DEBUG__ } from '@src/constants/common.const.js'

/**
 * MountTrackerUtil keeps track of which BaseNode instances are currently mounted in the DOM.
 * It provides a simple registry for mount/unmount state that other systems
 * (like NavigationCacheManager) can query for safe cache eviction.
 */
export class MountTrackerUtil {
  private constructor() {}

  public static mountedNodes = new Set<string>()
  private static _unmountCallCount = new Map<string, number>() // Debug only

  /**
   * Tracks a node as mounted. Adds its stable key and a WeakRef to the node to the map of mounted nodes.
   */
  public static trackMount(key: string) {
    this.mountedNodes.add(key)

    if (__DEBUG__) {
      this._unmountCallCount.delete(key)
    }
  }

  /**
   * Removes its stable key from the set of mounted nodes.
   * In development mode, it also tracks multiple unmount calls for debugging purposes.
   * @returns True if the node was previously tracked as mounted and is now removed, false otherwise.
   */
  public static untrackMount(key: string) {
    const wasMounted = this.mountedNodes.delete(key)

    if (__DEBUG__) {
      if (!wasMounted) {
        const count = (this._unmountCallCount.get(key) || 0) + 1
        this._unmountCallCount.set(key, count)
        if (count > 1) {
          console.warn(
            `[MeoNode] untrackMount called ${count} times for an already unmounted node: ${key}. This could indicate a memory leak or a bug in a component's lifecycle.`,
          )
        }
      }
    }
    return wasMounted
  }

  /**
   * Cleans up all internal state of the MountTrackerUtil.
   * Removes all tracked nodes and debug counters.
   */
  public static cleanup() {
    this.mountedNodes.clear()

    if (__DEBUG__) {
      this._unmountCallCount.clear()
    }
  }
}
