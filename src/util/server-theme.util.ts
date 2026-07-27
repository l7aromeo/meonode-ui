import { getGlobalState } from '@src/helper/common.helper.js'
import type { Theme } from '@src/types/node.type.js'

const SERVER_ACTIVE_THEME_KEY = Symbol.for('@meonode/ui/serverActiveTheme')

interface ServerThemeState {
  activeTheme?: Theme
}

function toThemeVarName(path: string): string {
  return `--meonode-theme-${path.replace(/[^\w.-]/g, '-').replace(/\./g, '-')}`
}

export function getActiveServerTheme(): Theme | undefined {
  return getGlobalState<ServerThemeState>(SERVER_ACTIVE_THEME_KEY, () => ({})).activeTheme
}

export function setActiveServerTheme(theme: Theme): void {
  getGlobalState<ServerThemeState>(SERVER_ACTIVE_THEME_KEY, () => ({})).activeTheme = theme
}

/**
 * Builds the `:root{--meonode-theme-*: …}` CSS text directly from a Theme without
 * touching the server-only variable store. Safe to call on the client for pure
 * SPA flows (Vite/CRA) where there is no SSR emission to pick up.
 */
export function buildThemeVariablesCss(theme: Theme): string {
  if (!theme?.system || typeof theme.system !== 'object') return ''
  const entries: Array<[string, string]> = []
  const stack: Array<{ path: string; value: unknown }> = [{ path: '', value: theme.system }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || !current.value || typeof current.value !== 'object') continue
    const record = current.value as Record<string, unknown>

    for (const [key, rawValue] of Object.entries(record)) {
      const path = current.path ? `${current.path}.${key}` : key
      if (rawValue === null || rawValue === undefined) continue

      if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
        entries.push([toThemeVarName(path), String(rawValue)])
        continue
      }

      if (typeof rawValue === 'object') {
        const maybeDefault = (rawValue as Record<string, unknown>).default
        if (typeof maybeDefault === 'string' || typeof maybeDefault === 'number' || typeof maybeDefault === 'boolean') {
          entries.push([toThemeVarName(path), String(maybeDefault)])
        }
        stack.push({ path, value: rawValue })
      }
    }
  }

  if (entries.length === 0) return ''
  const declarations = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value};`)
    .join('')
  return `:root{${declarations}}`
}

/**
 * Module-level cache so repeat conversions of the same input object/array
 * return their previously-computed output in O(1). The cache stores both
 * `input → output` and `output → output` so that re-running the function
 * on an already-converted value short-circuits without re-walking. WeakMap
 * lets entries be reclaimed automatically when their keys are GC'd.
 */
const conversionCache = new WeakMap<object, unknown>()

/**
 * Hoisted to module scope rather than rebuilt per call. `replaceThemeTokensWithCssVars`
 * runs on every node's props on every render, so allocating a fresh `RegExp` and
 * two closures on entry was pure per-node garbage.
 *
 * Sharing one `/g` regex across calls is safe here: `String.prototype.replace`
 * with a global regex always starts at index 0 and resets `lastIndex` when it
 * finishes, and nothing between the reset and the `replace` yields (no `await`,
 * no generator), so no other call can interleave and observe a stale index. The
 * explicit reset below is belt-and-braces.
 */
const themeRegex = /theme\.([a-zA-Z0-9_.-]+)/g

const replaceString = (input: string): string => {
  if (!input.includes('theme.')) return input
  themeRegex.lastIndex = 0
  let hasChanged = false
  const next = input.replace(themeRegex, (_, path: string) => {
    hasChanged = true
    return `var(${toThemeVarName(path)})`
  })
  return hasChanged ? next : input
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null) return false
  const proto = Object.getPrototypeOf(v)
  return proto === null || proto === Object.prototype
}

const SCAN_NO_TOKENS = 0
const SCAN_FOUND_OR_UNKNOWN = 1

/**
 * Depth budget for {@link scanForThemeTokens}. Props and `css` objects are
 * shallow in practice (a media-query or pseudo-selector block nests two or three
 * levels), so this is generous. Its real job is to bound recursion: exceeding it
 * means "give up, take the slow path", which is how cyclic structures are
 * handled without allocating a `Set` to track the traversal path.
 */
const SCAN_MAX_DEPTH = 16

/**
 * Read-only, allocation-free test for whether `value` contains any string that
 * needs token conversion.
 *
 * Returns {@link SCAN_NO_TOKENS} only when it has proven there is nothing to
 * convert. Anything else — a token found, or a structure too deep to finish
 * scanning — returns {@link SCAN_FOUND_OR_UNKNOWN}, and the caller falls back to
 * the full copy-on-write walk. Collapsing "found" and "unknown" into one result
 * is intentional: both lead to the same place, and distinguishing them would only
 * invite a caller to treat "unknown" as safe.
 *
 * Mirrors the walk's traversal contract exactly, or it would reach a different
 * conclusion than the walk it is short-circuiting:
 * - Only plain objects and arrays are descended into. Class instances (refs,
 *   `Date`, React elements, MUI internals) are passed through untouched by the
 *   walk, so they cannot hide a convertible string.
 * - Only string **values** count. Keys holding tokens (e.g.
 *   `'@media (max-width: theme.breakpoint.md)'`) are deliberately not converted
 *   by the walk either — they must resolve to concrete values, since CSS
 *   variables are invalid in media features and selector text.
 * - Uses `for...in` + `hasOwnProperty` rather than `Object.values()`, because
 *   `Object.values()` allocates an array per object, which is one of the costs
 *   this path exists to avoid.
 */
function scanForThemeTokens(value: unknown, depth: number): number {
  if (typeof value === 'string') {
    return value.includes('theme.') ? SCAN_FOUND_OR_UNKNOWN : SCAN_NO_TOKENS
  }
  if (typeof value !== 'object' || value === null) return SCAN_NO_TOKENS
  if (depth >= SCAN_MAX_DEPTH) return SCAN_FOUND_OR_UNKNOWN

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (scanForThemeTokens(value[i], depth + 1) !== SCAN_NO_TOKENS) return SCAN_FOUND_OR_UNKNOWN
    }
    return SCAN_NO_TOKENS
  }

  if (!isPlainObject(value)) return SCAN_NO_TOKENS

  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue
    if (scanForThemeTokens(value[key], depth + 1) !== SCAN_NO_TOKENS) return SCAN_FOUND_OR_UNKNOWN
  }
  return SCAN_NO_TOKENS
}

/**
 * Replaces `theme.*` token strings with `var(--meonode-theme-*)` references,
 * walking arbitrary structures iteratively with copy-on-write semantics.
 *
 * Mirrors `ThemeUtil.resolveObjWithTheme`'s traversal contract:
 * - Only descends into plain objects and arrays. Class instances (refs,
 *   Date, RegExp, MUI internals, React elements, etc.) are passed through
 *   untouched so their identity and prototype chain are preserved.
 * - Copy-on-write: untouched subtrees keep their original reference, which
 *   matters when forwarding props to memoized components.
 * - Iterative with a manual work stack — safe for deeply nested trees.
 * - Detects cycles via a path Set.
 * - Only transforms string **values**, never object keys. Keys that hold
 *   theme tokens (e.g. `'@media (max-width: theme.breakpoint.md)'`) must
 *   resolve to concrete values, since CSS variables are invalid inside
 *   media features and selector text. Key resolution is left to
 *   `ThemeUtil.resolveObjWithTheme`, which has access to the live theme.
 * - Memoized via a module-level WeakMap so the same input reference (e.g.
 *   a `sx` object defined outside a render body) is converted at most once.
 */
export function replaceThemeTokensWithCssVars<T>(value: T): T {
  if (typeof value === 'string') return replaceString(value) as unknown as T
  if (!isPlainObject(value) && !Array.isArray(value)) return value

  // WeakMap fast-path: previously-converted inputs (and their outputs) hit O(1).
  const cached = conversionCache.get(value as object)
  if (cached !== undefined) return cached as T

  // Allocation-free fast path. The full walk below allocates a work-stack entry
  // per container, a Map, a Set, and an `Object.values()` array per object —
  // before it can discover there was nothing to convert. Since this function
  // runs on every node's props on every render, and since `@meonode/compiler`
  // now rewrites `theme.*` tokens at build time (so compiled call sites arrive
  // already token-free), the overwhelmingly common case is a walk that finds
  // nothing and returns its input unchanged.
  //
  // `scanForThemeTokens` answers "is there anything to do?" with zero
  // allocations. When the answer is no we return the input as-is, which is
  // exactly what the walk would have produced: it is copy-on-write, so an
  // unchanged structure already comes back by reference.
  //
  // Deliberately not cached: the fast path's inputs are mostly fresh per-render
  // objects (compiled `__meo$c`/`__meo$d` buckets, and the spread literal built
  // at core.node.ts's `elementProps`), so a WeakMap insert here would cost more
  // than the O(1) hit it could ever earn, and would retain those objects until
  // the next GC.
  if (scanForThemeTokens(value, 0) === SCAN_NO_TOKENS) return value

  const workStack: { value: unknown; isProcessed: boolean }[] = [{ value, isProcessed: false }]
  const resolvedValues = new Map<unknown, unknown>()
  const path = new Set<unknown>()

  while (workStack.length > 0) {
    const currentWork = workStack[workStack.length - 1]
    const currentValue = currentWork.value

    if (!isPlainObject(currentValue) && !Array.isArray(currentValue)) {
      workStack.pop()
      continue
    }

    if (resolvedValues.has(currentValue)) {
      workStack.pop()
      continue
    }

    if (!currentWork.isProcessed) {
      currentWork.isProcessed = true
      path.add(currentValue)

      const children = Array.isArray(currentValue) ? currentValue : Object.values(currentValue)
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if ((isPlainObject(child) || Array.isArray(child)) && !path.has(child)) {
          workStack.push({ value: child, isProcessed: false })
        }
      }
    } else {
      workStack.pop()
      path.delete(currentValue)

      let finalValue: unknown = currentValue

      if (Array.isArray(currentValue)) {
        let newArray: unknown[] | null = null
        for (let i = 0; i < currentValue.length; i++) {
          const item = currentValue[i]
          let newItem: unknown = item
          if (typeof item === 'string') {
            newItem = replaceString(item)
          } else if (isPlainObject(item) || Array.isArray(item)) {
            newItem = resolvedValues.get(item) ?? item
          }
          if (newItem !== item) {
            if (newArray === null) newArray = [...currentValue]
            newArray[i] = newItem
          }
        }
        if (newArray !== null) finalValue = newArray
      } else {
        let newObj: Record<string, unknown> | null = null
        const obj = currentValue as Record<string, unknown>
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const v = obj[key]
            let newValue: unknown = v

            if (typeof v === 'string') {
              newValue = replaceString(v)
            } else if (isPlainObject(v) || Array.isArray(v)) {
              newValue = resolvedValues.get(v) ?? v
            }

            if (newValue !== v) {
              if (newObj === null) newObj = { ...obj }
              newObj[key] = newValue
            }
          }
        }
        if (newObj !== null) finalValue = newObj
      }

      resolvedValues.set(currentValue, finalValue)
    }
  }

  const result = (resolvedValues.get(value) ?? value) as T
  conversionCache.set(value as object, result)
  // Also map the output to itself so re-converting an already-var-form value
  // (e.g. props that round-trip through this function) short-circuits.
  if (result !== (value as unknown) && typeof result === 'object' && result !== null) {
    conversionCache.set(result as unknown as object, result)
  }
  return result
}
