import type { CSSProperties } from '@emotion/serialize'
import type { CssProp, Theme } from '@src/types/node.type.js'
import { getValueByPath } from '@src/helper/common.helper.js'
import { isLengthProperty, isSelectorOrAtRule, lengthVarRef } from '@src/util/css-unit.util.js'

interface FlexComponents {
  grow: number
  shrink: number
  basis: string | number
}

/**
 * Hoisted to module scope rather than rebuilt per call. `resolveObjWithTheme`
 * runs once per styled node per render (via `StyledRenderer` and the server
 * class-name path), so allocating a fresh `RegExp` and two closures on entry
 * was pure per-node garbage.
 *
 * Sharing one `/g` regex across calls is safe: `String.prototype.replace` with
 * a global regex always starts at index 0 and resets `lastIndex` when it
 * finishes, and nothing between the reset and the `replace` yields, so no other
 * call can interleave and observe a stale index. The explicit reset in
 * {@link processThemeString} is belt-and-braces.
 */
const THEME_REGEX = /theme\.([a-zA-Z0-9_.-]+)/g

const toThemeVarName = (p: string) => `--meonode-theme-${p.replace(/[^\w.-]/g, '-').replace(/\./g, '-')}`

/**
 * Keys (selectors, media queries) must always resolve to concrete values — CSS
 * vars are invalid inside media features and selector text. Only values obey
 * `themeStringsMode`, which is why `asVar` is a parameter rather than being
 * read from the options.
 * @param value The string to rewrite.
 * @param asVar Emit `var(--meonode-theme-*)` instead of the resolved value.
 * @param themeSystem The active theme's `system` object, for path lookups.
 * @param property The CSS property this value was written against, when known.
 * A length property references the paired `--len` variant, so a numeric token
 * arrives with its unit rather than as a bare number the browser would reject.
 * Chosen from the property alone, never the token's value, so the server path —
 * which may have no theme in scope — makes the identical choice and the Emotion
 * class hash stays the same across SSR and CSR.
 * @returns The rewritten string, or `value` itself when nothing changed.
 */
const processThemeString = (value: string, asVar: boolean, themeSystem: Record<string, unknown>, property?: string): string => {
  THEME_REGEX.lastIndex = 0
  const wantsLength = property !== undefined && isLengthProperty(property)
  let hasChanged = false
  const resolved = value.replace(THEME_REGEX, (match, path: string) => {
    if (asVar) {
      hasChanged = true
      const varName = toThemeVarName(path)
      return wantsLength ? lengthVarRef(varName) : `var(${varName})`
    }
    const themeValue = getValueByPath(themeSystem, path)
    if (themeValue !== undefined && themeValue !== null) {
      hasChanged = true
      if (typeof themeValue === 'object') {
        if (!Array.isArray(themeValue) && 'default' in themeValue) {
          return themeValue.default as string
        }
        throw new Error('The provided theme path is invalid!')
      }
      return themeValue
    }
    return match
  })
  return hasChanged ? resolved : value
}

/**
 * `Object.keys(x).length === 0` allocates the whole key array just to read its
 * length. This is on the entry guard of a per-node-per-render function, so it
 * ran twice per styled node for no reason. `for...in` + `hasOwnProperty` counts
 * exactly the same keys (own enumerable string keys) and exits on the first one.
 * @param value The object to test.
 * @returns `true` when the object has no own enumerable string keys.
 */
const isEmptyObject = (value: object): boolean => {
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return false
  }
  return true
}

const SCAN_NO_WORK = 0
const SCAN_WORK_OR_UNKNOWN = 1

/**
 * Depth budget for {@link scanForThemeWork}. `css` objects are shallow in
 * practice (a media-query or pseudo-selector block nests two or three levels),
 * so this is generous. Its real job is to bound recursion: exceeding it means
 * "give up, take the full walk", which is how cyclic structures are handled
 * without allocating a `Set` to track the traversal path.
 */
const SCAN_MAX_DEPTH = 16

/**
 * Read-only, allocation-free test for whether {@link ThemeUtil.resolveObjWithTheme}
 * would change anything.
 *
 * Returns {@link SCAN_NO_WORK} only when it has proven there is nothing to do.
 * Anything else — a token found, a callable to invoke, or a structure too deep
 * to finish scanning — returns {@link SCAN_WORK_OR_UNKNOWN} and the caller falls
 * back to the full copy-on-write walk. Collapsing "found" and "unknown" into one
 * result is intentional: both lead to the same place, and distinguishing them
 * would only invite a caller to treat "unknown" as safe.
 *
 * Mirrors the walk's contract exactly, or it would reach a different conclusion
 * than the walk it short-circuits:
 * - Only plain objects and arrays are descended into, matching the walk's
 *   `isPlainObject || Array.isArray` guard. Class instances are passed through
 *   untouched by the walk, so they cannot hide convertible content.
 * - **Keys** are checked as well as values: the walk rewrites a key containing
 *   `theme.` (e.g. `'@media (max-width: theme.breakpoint.md)'`).
 * - Function values count as work when `processFunctions` is set, because the
 *   walk calls them and substitutes the result. When it is not set, the walk
 *   leaves them alone, so they are not work.
 * @param value The value to scan.
 * @param processFunctions Whether the caller will invoke callable values.
 * @param depth Current recursion depth, against {@link SCAN_MAX_DEPTH}.
 * @returns {@link SCAN_NO_WORK} or {@link SCAN_WORK_OR_UNKNOWN}.
 */
function scanForThemeWork(value: unknown, processFunctions: boolean, depth: number): number {
  if (typeof value === 'string') {
    return value.includes('theme.') ? SCAN_WORK_OR_UNKNOWN : SCAN_NO_WORK
  }
  if (typeof value === 'function') {
    return processFunctions ? SCAN_WORK_OR_UNKNOWN : SCAN_NO_WORK
  }
  if (typeof value !== 'object' || value === null) return SCAN_NO_WORK
  if (depth >= SCAN_MAX_DEPTH) return SCAN_WORK_OR_UNKNOWN

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (scanForThemeWork(value[i], processFunctions, depth + 1) !== SCAN_NO_WORK) return SCAN_WORK_OR_UNKNOWN
    }
    return SCAN_NO_WORK
  }

  if (!ThemeUtil.isPlainObject(value)) return SCAN_NO_WORK

  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue
    if (key.includes('theme.')) return SCAN_WORK_OR_UNKNOWN
    if (scanForThemeWork(value[key], processFunctions, depth + 1) !== SCAN_NO_WORK) return SCAN_WORK_OR_UNKNOWN
  }
  return SCAN_NO_WORK
}

export class ThemeUtil {
  private constructor() {}

  /**
   * Parses a CSS flex shorthand property into its individual components.
   *
   * The CSS flex property is a shorthand for flex-grow, flex-shrink, and flex-basis.
   * This parser handles the most common flex shorthand patterns to extract the shrink value
   * when it's explicitly set by the user.
   *
   * Supported patterns:
   * - Keywords: 'none' | 'auto' | 'initial'
   * - Single number: '1' → {grow: 1, shrink: 1, basis: '0%'}
   * - Full shorthand: '1 0 auto' → {grow: 1, shrink: 0, basis: 'auto'}
   * @param flex The CSS flex property value to parse
   * @returns FlexComponents object with parsed values, or null if unparseable
   * @example
   * parseFlexShorthand('none') // → {grow: 0, shrink: 0, basis: 'auto'}
   * parseFlexShorthand('1') // → {grow: 1, shrink: 1, basis: '0%'}
   * parseFlexShorthand('1 0 auto') // → {grow: 1, shrink: 0, basis: 'auto'}
   */
  public static parseFlexShorthand(flex: CSSProperties['flex']): FlexComponents | null {
    // Early returns for invalid inputs
    if (flex === null || flex === undefined) return null

    // Handle numeric flex values (e.g., flex: 1)
    if (typeof flex === 'number') {
      return { grow: flex, shrink: 1, basis: '0%' }
    }

    if (typeof flex !== 'string') return null

    const normalized = flex.trim().toLowerCase()
    if (!normalized) return null

    // Handle CSS keyword values
    switch (normalized) {
      case 'none':
        return { grow: 0, shrink: 0, basis: 'auto' }
      case 'auto':
        return { grow: 1, shrink: 1, basis: 'auto' }
      case 'initial':
        return { grow: 0, shrink: 1, basis: 'auto' }
      default:
        // For complex shorthand strings, return null to avoid parsing errors
        // The browser will handle the original flex value correctly
        return null
    }
  }

  public static isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
  }

  /**
   * Resolves theme variable references in an object's values iteratively.
   * This function uses a manual work stack to traverse the object, which prevents
   * "Maximum call stack size exceeded" errors for deeply nested objects.
   * It performs a "smart merge" by using a copy-on-write strategy, creating new
   * objects/arrays only when a value inside them has changed. This preserves
   * object references for unchanged parts of the tree, which is critical for
   * React's reconciliation and memoization.
   */
  public static resolveObjWithTheme = <O extends Record<string, unknown>>(
    obj: O,
    theme?: Theme,
    options: { processFunctions?: boolean; themeStringsMode?: 'resolve' | 'vars' } = {},
  ): O => {
    const { processFunctions = false, themeStringsMode = 'resolve' } = options

    if (!theme || !theme.system || typeof theme.system !== 'object' || isEmptyObject(theme.system) || !obj || isEmptyObject(obj)) {
      return obj
    }

    const themeSystem = theme.system

    // Allocation-free fast path. The walk below allocates a work-stack entry per
    // container, a Map, a Set, and an `Object.values()` array per object before it
    // can discover there was nothing to resolve. This runs once per styled node per
    // render, and since `@meonode/compiler` rewrites `theme.*` tokens at build time,
    // compiled call sites arrive with nothing left to resolve — so the overwhelmingly
    // common case is a walk that finds nothing and returns its input unchanged.
    //
    // Returning `obj` here is exactly what the walk would produce: it is
    // copy-on-write, so an unchanged structure already comes back by reference.
    if (scanForThemeWork(obj, processFunctions, 0) === SCAN_NO_WORK) return obj

    const workStack: { value: unknown; isProcessed: boolean }[] = [{ value: obj, isProcessed: false }]
    const resolvedValues = new Map<unknown, unknown>()
    const path = new Set<unknown>() // Used for cycle detection within the current traversal path.

    while (workStack.length > 0) {
      const currentWork = workStack[workStack.length - 1]
      const currentValue = currentWork.value

      if (!ThemeUtil.isPlainObject(currentValue) && !Array.isArray(currentValue)) {
        workStack.pop()
        continue
      }

      if (resolvedValues.has(currentValue)) {
        workStack.pop()
        continue
      }

      if (!currentWork.isProcessed) {
        // --- Begin Phase ---
        currentWork.isProcessed = true
        path.add(currentValue)

        const children = Array.isArray(currentValue) ? currentValue : Object.values(currentValue)
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i]
          // Only push containers that are not already in the current path (cycle detection).
          if ((ThemeUtil.isPlainObject(child) || Array.isArray(child)) && !path.has(child)) {
            workStack.push({ value: child, isProcessed: false })
          }
        }
      } else {
        // --- Complete Phase ---
        workStack.pop()
        path.delete(currentValue) // Unwind the path

        let finalValue = currentValue

        if (Array.isArray(currentValue)) {
          let newArray: unknown[] | null = null
          for (let i = 0; i < currentValue.length; i++) {
            const item = currentValue[i]
            const resolvedItem = resolvedValues.get(item) ?? item
            if (resolvedItem !== item) {
              if (newArray === null) newArray = [...currentValue] // Copy-on-write
              newArray[i] = resolvedItem
            }
          }
          if (newArray !== null) finalValue = newArray
        } else {
          let newObj: Record<string, unknown> | null = null
          for (const key in currentValue) {
            if (Object.prototype.hasOwnProperty.call(currentValue, key)) {
              const value = currentValue[key]
              let newValue = resolvedValues.get(value) ?? value
              let newKey = key

              // Resolve theme variables in the key itself (e.g., media queries)
              if (typeof key === 'string' && key.includes('theme.')) {
                newKey = processThemeString(key, false, themeSystem)
              }

              const valueAsVar = themeStringsMode === 'vars'
              // A selector or at-rule key names no property, so a token
              // directly under one keeps the plain variable.
              const valueProperty = isSelectorOrAtRule(newKey) ? undefined : newKey
              if (typeof newValue === 'function' && processFunctions) {
                const funcResult = (newValue as (theme: Theme) => unknown)(theme)
                newValue =
                  typeof funcResult === 'string' && funcResult.includes('theme.')
                    ? processThemeString(funcResult, valueAsVar, themeSystem, valueProperty)
                    : funcResult
              } else if (typeof newValue === 'string' && newValue.includes('theme.')) {
                newValue = processThemeString(newValue, valueAsVar, themeSystem, valueProperty)
              }

              if (newValue !== value || newKey !== key) {
                if (newObj === null) newObj = { ...currentValue } // Copy-on-write
                if (newKey !== key) {
                  // Key changed, remove old key and add new one
                  delete newObj[key]
                }
                newObj[newKey] = newValue
              }
            }
          }
          if (newObj !== null) finalValue = newObj
        }
        resolvedValues.set(currentValue, finalValue)
      }
    }

    const result = resolvedValues.get(obj) ?? obj
    return result as O
  }

  /**
   * Resolves default CSS styles to fix common flexbox layout issues.
   *
   * PRIMARY PURPOSE: Fix the flexbox scrolling problem
   * ================================================
   *
   * THE PROBLEM:
   * By default, flex items have `min-width: auto` and `min-height: auto`, which means they
   * cannot shrink below their content size. This prevents scrollable containers from working
   * properly when they are flex items.
   *
   * THE SOLUTION:
   * 1. Set `minHeight: 0` and `minWidth: 0` to allow flex items to shrink
   * 2. Control `flexShrink` behavior based on context to prevent unwanted shrinking
   * 3. Respect user's explicit values to avoid overriding intentional styling
   *
   * FLEX SHRINK BEHAVIOR RULES:
   * ===========================
   *
   * For FLEX CONTAINERS:
   * - If overflow is NOT handled AND no wrapping → flexShrink: 0 (prevent shrinking)
   * - If overflow is handled OR wrapping enabled → flexShrink: undefined (allow default)
   *
   * For NON-FLEX CONTAINERS (flex items):
   * - Always → flexShrink: 0 (prevent unwanted shrinking)
   *
   * NESTED SCENARIOS:
   * ================
   * An element can be both a flex container AND a flex item simultaneously.
   * This function handles this correctly by checking if the element itself is a container,
   * not whether it's inside a flex context.
   *
   * EXPLICIT VALUE PRESERVATION:
   * ===========================
   * - If user sets `flexShrink` explicitly → never override
   * - If user sets `flex` shorthand → extract and use the shrink value from it
   * - Otherwise → apply smart defaults based on context
   * @param style The input CSSProperties object to process
   * @returns Processed CSSProperties with resolved defaults
   * @example
   * // Fix scrollable flex item
   * resolveDefaultStyle({
   *   overflow: 'auto',
   *   height: '200px'
   * })
   * // → { overflow: 'auto', height: '200px', flexShrink: 0, minHeight: 0, minWidth: 0 }
   * @example
   * // Flex container with wrapping (allows shrinking)
   * resolveDefaultStyle({
   *   display: 'flex',
   *   flexWrap: 'wrap'
   * })
   * // → { display: 'flex', flexWrap: 'wrap', minHeight: 0, minWidth: 0 }
   */
  public static resolveDefaultStyle = (style: CssProp) => {
    if (style === null || style === undefined || typeof style === 'string' || typeof style === 'number' || typeof style === 'boolean') return {}

    // === STEP 1: EXTRACT FLEX PROPERTY ===
    // Extract flex shorthand to handle it separately from individual flex properties
    const { flex, ...restStyle } = style as CSSProperties

    // === STEP 2: ANALYZE LAYOUT CONTEXT ===
    // Determine what kind of element we're dealing with
    const isFlexContainer = restStyle.display === 'flex' || restStyle.display === 'inline-flex'

    // Check if overflow is set (any overflow value indicates potential scrolling)
    const hasOverflow = !!(restStyle.overflow || restStyle.overflowY || restStyle.overflowX)

    // Check if flex wrapping is enabled (allows items to wrap to new lines)
    const isWrapping = restStyle.flexFlow?.includes('wrap') || restStyle.flexWrap === 'wrap' || restStyle.flexWrap === 'wrap-reverse'

    // === STEP 3: CHECK FOR EXPLICIT USER VALUES ===
    // Respect user's explicit flexShrink setting
    const hasExplicitFlexShrink = 'flexShrink' in style && style.flexShrink !== undefined

    // Extract shrink value from flex shorthand if provided
    const explicitFlexComponents = flex ? ThemeUtil.parseFlexShorthand(flex) : null

    // === STEP 4: DETERMINE FLEX SHRINK BEHAVIOR ===
    let flexShrink: number | undefined = undefined

    // Only set flexShrink if user hasn't explicitly provided it
    if (!hasExplicitFlexShrink) {
      // If flex shorthand contains a shrink value, use that
      if (explicitFlexComponents) {
        flexShrink = explicitFlexComponents.shrink
      } else {
        // Apply context-based defaults
        if (isFlexContainer) {
          // FLEX CONTAINER LOGIC:
          // Only prevent shrinking when container is constrained (no overflow handling, no wrapping)
          if (!hasOverflow) {
            const isColumnDirection = restStyle.flexDirection === 'column' || restStyle.flexDirection === 'column-reverse'
            const isRowDirectionOrDefault = restStyle.flexDirection === 'row' || restStyle.flexDirection === 'row-reverse' || !restStyle.flexDirection

            // Scenario 1: Column-based layout without wrapping
            if (isColumnDirection && !isWrapping) {
              flexShrink = 0
            }
            // Scenario 2: Row-based layout without wrapping (row is default direction)
            else if (isRowDirectionOrDefault && !isWrapping) {
              flexShrink = 0
            }
          }
        } else {
          // NON-FLEX CONTAINER LOGIC:
          // Default flex-shrink to 0 to prevent unwanted shrinking of flex items
          flexShrink = 0
        }
      }
    }

    // === STEP 5: RETURN RESOLVED STYLES ===
    // Combine all processed styles with essential defaults
    return {
      flex, // Preserve original flex shorthand
      flexShrink, // Apply computed or explicit flexShrink
      minHeight: 0, // Fix flex item scrolling issues
      minWidth: 0, // Fix flex item scrolling issues
      ...restStyle, // User styles take precedence over defaults
    }
  }
}
