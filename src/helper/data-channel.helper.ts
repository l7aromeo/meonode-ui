import type { DataChannel } from '@src/types/node.type.js'

/**
 * Creates a ref-based pub/sub data channel for pushing updates to subscribers
 * without triggering React re-renders in the producer.
 *
 * Used internally by the portal system to sync data from the parent component
 * to portal layers efficiently.
 * @template T The data type managed by the channel.
 * @param initial Optional initial data value.
 * @returns A DataChannel with get, set, and subscribe methods.
 */
export function createDataChannel<T = any>(initial?: T): DataChannel<T> {
  let data: T = initial as T
  const subscribers = new Set<(data: T) => void>()

  return {
    get: () => data,
    set: (next: T) => {
      data = next
      subscribers.forEach(cb => cb(data))
    },
    subscribe: (cb: (data: T) => void) => {
      subscribers.add(cb)
      return () => {
        subscribers.delete(cb)
      }
    },
  }
}
