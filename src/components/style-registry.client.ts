'use client'
import { createElement, type ReactElement, useState } from 'react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { Node } from '@src/core.node.js'
import { useServerInsertedHTML } from 'next/navigation.js'
import { consumeServerEmotionRules, getServerEmotionCache } from '@src/util/server-emotion.util.js'
import { consumeServerThemeVariablesCss } from '@src/util/server-theme.util.js'

// Emotion cache setup
function createEmotionCache() {
  if (typeof window === 'undefined') {
    return getServerEmotionCache()
  }
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

  // Track which IDs have already been inserted to prevent duplicates during streaming.
  const [inserted] = useState(() => new Set<string>())

  // During server rendering, collect styles inserted into the cache and inline them in the HTML.
  useServerInsertedHTML(() => {
    const ids = Object.keys(cache.inserted)
    const newIds = ids.filter(id => !inserted.has(id) && typeof cache.inserted[id] === 'string')
    const serverCompiledRules = consumeServerEmotionRules()
    const freshServerRules = serverCompiledRules.filter(rule => !inserted.has(rule.id))
    const themeVariablesRule = consumeServerThemeVariablesCss()
    const freshThemeRule = themeVariablesRule && !inserted.has(themeVariablesRule.id) ? [themeVariablesRule] : []

    if (newIds.length === 0 && freshServerRules.length === 0 && freshThemeRule.length === 0) {
      return null
    }

    // Mark IDs as inserted
    newIds.forEach(id => inserted.add(id))
    freshServerRules.forEach(rule => inserted.add(rule.id))
    freshThemeRule.forEach(rule => inserted.add(rule.id))

    // Ensure deterministic output by sorting ids.
    const sortedIds = Array.from(new Set([...newIds, ...freshServerRules.map(rule => rule.id), ...freshThemeRule.map(rule => rule.id)])).sort()
    const serverRuleById = new Map([...freshServerRules, ...freshThemeRule].map(rule => [rule.id, rule.cssText]))
    const styles = sortedIds
      .map(id => {
        const serverRule = serverRuleById.get(id)
        if (typeof serverRule === 'string') return serverRule
        const cacheRule = cache.inserted[id]
        return typeof cacheRule === 'string' ? cacheRule : ''
      })
      .filter(Boolean)
      .join('')
    const idsString = sortedIds.join(' ')

    // Insert a single style tag with the tracked Emotion ids.
    return createElement('style', {
      'data-emotion': `${cache.key} ${idsString}`,
      dangerouslySetInnerHTML: { __html: styles },
    })
  })

  // Provide the Emotion cache to descendants.
  return Node(CacheProvider, { value: cache, children }).render()
}

;(StyleRegistry as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true
