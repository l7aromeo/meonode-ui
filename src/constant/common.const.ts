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
 * props objects (e.g. `{ __meo$: 2, __meo$c: {...}, __meo$d: {...} }`) produced
 * for a call site.
 */
export const COMPILED_MARKER = '__meo$'

/**
 * Schema versions of the compiled marker contract that this runtime knows how
 * to consume. Compiled output with an unsupported schema version is ignored.
 *
 * - **1** — buckets named `c`/`d`/`k`/`dyn`. Emitted by `@meonode/compiler@0.1.x`.
 *   Retained for compatibility; unsafe to combine with object spreads, since a
 *   spread can carry a real prop named `d` (a valid SVG `<path>` attribute) that
 *   collides with the bucket key.
 * - **2** — buckets namespaced under the marker prefix, so no user prop can
 *   collide. Emitted by `@meonode/compiler@0.2.0+`.
 */
export const SUPPORTED_COMPILER_SCHEMAS: ReadonlySet<number> = new Set([1, 2])

/**
 * Per-schema names of the compiled marker's contract keys. Indexed by the schema
 * version found in {@link COMPILED_MARKER}.
 */
export const COMPILER_SCHEMA_KEYS: Readonly<Record<number, { css: string; dom: string; key: string; dyn: string }>> = {
  1: { css: 'c', dom: 'd', key: 'k', dyn: 'dyn' },
  2: { css: '__meo$c', dom: '__meo$d', key: '__meo$k', dyn: '__meo$dyn' },
}
