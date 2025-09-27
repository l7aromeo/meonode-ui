'use client'

import { createElement, type ReactElement, useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { Node } from '@src/core.node.js'

function createEmotionCache() {
  return createCache({ key: 'meonode-css' })
}

export default function StyleRegistry({ children }: { children: ReactElement }) {
  const [cache] = useState(() => {
    const emotionCache = createEmotionCache()
    emotionCache.compat = true
    return emotionCache
  })

  useServerInsertedHTML(() => {
    const sortedIds = Object.keys(cache.inserted).sort()
    const styles = sortedIds.map(id => cache.inserted[id]).join('')
    const ids = sortedIds.join(' ')

    if (!styles) {
      return null
    }

    return createElement('style', {
      'data-emotion': `${cache.key} ${ids}`,
      dangerouslySetInnerHTML: { __html: styles },
    })
  })

  return Node(CacheProvider, { value: cache, children }).render()
}
