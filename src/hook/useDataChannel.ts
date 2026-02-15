'use client'
import { useState, useEffect } from 'react'
import type { DataChannel } from '@src/types/node.type.js'

/**
 * React hook that subscribes to a DataChannel and returns the current snapshot.
 * Re-renders the component whenever the channel pushes new data via `set()`.
 * @template T The data type of the channel.
 * @param channel The data channel to subscribe to, or null/undefined.
 * @returns The current data value, or undefined if no channel is provided.
 */
export function useDataChannel<T>(channel: DataChannel<T> | null | undefined): T | undefined {
  const [snapshot, setSnapshot] = useState<T | undefined>(() => channel?.get())

  useEffect(() => {
    if (!channel) return
    setSnapshot(channel.get())
    return channel.subscribe(setSnapshot)
  }, [channel])

  return snapshot
}
