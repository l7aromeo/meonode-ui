'use client'
import { createElement, type ReactElement, useState } from 'react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { Node } from '@src/core.node.js'
import { useServerInsertedHTML } from 'next/navigation.js'

// Emotion cache setup
function createEmotionCache() {
  return createCache({ key: 'meonode-css' })
}

/**
 * Style registry for Emotion to support SSR/streaming in Next.js App Router.
 *
 * - Creates a single Emotion cache instance in compat mode.
 * - Uses `useServerInsertedHTML` to inline critical CSS collected during render.
 * @param children React subtree that consumes Emotion styles.
 * @returns React element that provides the cache and injects critical CSS during SSR.
 */
export default function StyleRegistry({ children }: { children: ReactElement }) {
  // Lazily create a single Emotion cache; enable compat for SSR/legacy Emotion APIs.
  const [cache] = useState(() => {
    const emotionCache = createEmotionCache()
    emotionCache.compat = true
    return emotionCache
  })

  // During server rendering, collect styles inserted into the cache and inline them in the HTML.
  useServerInsertedHTML(() => {
    // Ensure deterministic output by sorting ids.
    const sortedIds = Object.keys(cache.inserted).sort()
    const styles = sortedIds.map(id => cache.inserted[id]).join('')
    const ids = sortedIds.join(' ')

    if (!styles) {
      return null
    }

    // Insert a single style tag with the tracked Emotion ids.
    return createElement('style', {
      'data-emotion': `${cache.key} ${ids}`,
      dangerouslySetInnerHTML: { __html: styles },
    })
  })

  // Provide the Emotion cache to descendants.
  return Node(CacheProvider, { value: cache, children }).render()
}
