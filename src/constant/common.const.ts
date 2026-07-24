export const NO_STYLE_TAGS = [
  'html',
  'head',
  'meta',
  'link',
  'script',
  'style',
  'noscript',
  'template',
  'slot',
  'base',
  'param',
  'source',
  'track',
  'wbr',
  'embed',
  'object',
  'iframe',
  'frame',
  'frameset',
  'applet',
  'bgsound',
  'noembed',
  'noframes',
] as const

export const noStyleTagsSet = new Set(NO_STYLE_TAGS)
export type NO_STYLE_TAGS = typeof NO_STYLE_TAGS

export let __DEBUG__ = false

export function setDebugMode(enabled: boolean) {
  __DEBUG__ = enabled
  if (__DEBUG__) {
    console.log('[MeoNode] Debug mode enabled.')
  }
}

/**
 * Marker key used by the build-time SWC compiler to identify pre-partitioned
 * props objects (e.g. `{ __meo$: 1, c: {...}, d: {...} }`) produced for a call site.
 */
export const COMPILED_MARKER = '__meo$'

/**
 * Schema versions of the compiled marker contract that this runtime knows how
 * to consume. Compiled output with an unsupported schema version is ignored.
 */
export const SUPPORTED_COMPILER_SCHEMAS: ReadonlySet<number> = new Set([1])
