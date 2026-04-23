import createCache from '@emotion/cache'
import { serializeStyles } from '@emotion/serialize'
import { insertStyles } from '@emotion/utils'
import { getGlobalState } from '@src/helper/common.helper.js'
import type { CssProp } from '@src/types/node.type.js'

const SERVER_EMOTION_CACHE_KEY = Symbol.for('@meonode/ui/serverEmotionCache')
const SERVER_EMOTION_RULES_KEY = Symbol.for('@meonode/ui/serverEmotionRules')

interface ServerEmotionRulesState {
  byId: Map<string, string>
}

export function getServerEmotionCache() {
  return getGlobalState(SERVER_EMOTION_CACHE_KEY, () => createCache({ key: 'meonode-css' }))
}

function getServerEmotionRulesState(): ServerEmotionRulesState {
  return getGlobalState(SERVER_EMOTION_RULES_KEY, () => ({ byId: new Map<string, string>() }))
}

/**
 * Compiles an Emotion-compatible css object to a stable className in server paths
 * without relying on @emotion/react runtime APIs.
 */
export function compileServerEmotionClassName(css: CssProp): string | undefined {
  if (!css || typeof css === 'string' || typeof css === 'number' || typeof css === 'boolean') {
    return undefined
  }

  const cache = getServerEmotionCache()
  const serialized = serializeStyles([css as any], cache.registered)
  const stylesForSSR = insertStyles(cache as any, serialized as any, false)
  const cachedStyle = (cache.inserted as Record<string, unknown>)[serialized.name]
  const cssText = typeof stylesForSSR === 'string' ? stylesForSSR : typeof cachedStyle === 'string' ? cachedStyle : undefined

  if (cssText) {
    const state = getServerEmotionRulesState()
    if (!state.byId.has(serialized.name)) {
      state.byId.set(serialized.name, cssText)
    }
  }

  return `${cache.key}-${serialized.name}`
}

/**
 * Consumes pending server-compiled Emotion rules for injection into SSR output.
 * Rules are drained so each request only emits newly added styles once.
 */
export function consumeServerEmotionRules(): Array<{ id: string; cssText: string }> {
  const state = getServerEmotionRulesState()
  if (state.byId.size === 0) return []

  const drained = Array.from(state.byId.entries()).map(([id, cssText]) => ({ id, cssText }))
  state.byId.clear()
  return drained
}
