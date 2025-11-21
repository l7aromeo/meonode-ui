import type { CSSProperties } from '@emotion/serialize'
import type { CssProp, Theme, ThemeSystem } from '@src/types/node.type.js'
import { ObjHelper } from '@src/helper/obj.helper.js'
import { getValueByPath } from '@src/helper/common.helper.js'

/**
 * Cache manager for theme resolution operations.
 */
class ThemeResolverCache {
  private static _instance: ThemeResolverCache | null = null
  private readonly CACHE_SIZE_LIMIT = 500
  private readonly CACHE_EVICTION_BATCH_SIZE = 50
  private readonly _resolutionCache = new Map<string, Record<string, unknown>>()
  private readonly _pathLookupCache = new Map<string, Record<string, unknown> | string | null>()
  private readonly _themeRegex = /theme\.([a-zA-Z0-9_.-]+)/g

  static getInstance(): ThemeResolverCache {
    if (!ThemeResolverCache._instance) {
      ThemeResolverCache._instance = new ThemeResolverCache()
    }
    return ThemeResolverCache._instance
  }

  getResolution<O extends Record<string, unknown>>(obj: O, theme: Theme) {
    const key = this._generateCacheKey(obj, theme)
    const result = this._resolutionCache.get(key) as O
    if (result) {
      // Move to end to mark as recently used
      this._resolutionCache.delete(key)
      this._resolutionCache.set(key, result)
    }
    return result || null
  }

  setResolution(obj: Record<string, any>, theme: Theme, result: Record<string, any>): void {
    const key = this._generateCacheKey(obj, theme)
    this._resolutionCache.set(key, result)
    if (this._resolutionCache.size > this.CACHE_SIZE_LIMIT) {
      this._evict(this._resolutionCache)
    }
  }

  getPathLookup(theme: ThemeSystem, path: string): Record<string, unknown> | string | null {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`
    const result = this._pathLookupCache.get(pathKey)
    if (result) {
      // Move to end to mark as recently used
      this._pathLookupCache.delete(pathKey)
      this._pathLookupCache.set(pathKey, result)
    }
    return result ?? null
  }

  setPathLookup(theme: ThemeSystem, path: string, value: Record<string, unknown> | string | null): void {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`
    this._pathLookupCache.set(pathKey, value)
    if (this._pathLookupCache.size > this.CACHE_SIZE_LIMIT) {
      this._evict(this._pathLookupCache)
    }
  }

  getThemeRegex(): RegExp {
    this._themeRegex.lastIndex = 0
    return this._themeRegex
  }

  shouldCache(): boolean {
    return typeof window === 'undefined'
  }

  public clear() {
    this._resolutionCache.clear()
    this._pathLookupCache.clear()
  }

  /**
   * Generate a stable cache key from object and theme, including the theme mode.
   */
  private _generateCacheKey(obj: Record<string, any>, theme: Theme): string {
    // Including theme.mode is critical for cache correctness.
    return `${ObjHelper.stringify(obj)}_${theme.mode}_${ObjHelper.stringify(theme.system)}`
  }

  private _evict(cache: Map<string, unknown>) {
    const keys = cache.keys()
    for (let i = 0; i < this.CACHE_EVICTION_BATCH_SIZE; i++) {
      const key = keys.next().value
      if (key) {
        cache.delete(key)
      } else {
        break
      }
    }
  }
}

interface FlexComponents {
  grow: number
  shrink: number
  basis: string | number
}

export class ThemeUtil {
  private static themeCache = ThemeResolverCache.getInstance()

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
  public static resolveObjWithTheme = <O extends Record<string, unknown>>(obj: O, theme?: Theme, options: { processFunctions?: boolean } = {}): O => {
    const { processFunctions = false } = options

    if (!theme || !theme.system || typeof theme.system !== 'object' || Object.keys(theme.system).length === 0 || !obj || Object.keys(obj).length === 0) {
      return obj
    }

    const themeSystem = theme.system

    if (ThemeUtil.themeCache.shouldCache()) {
      const cachedResult = ThemeUtil.themeCache.getResolution(obj, theme)
      if (cachedResult !== null) {
        return cachedResult
      }
    }

    const workStack: { value: unknown; isProcessed: boolean }[] = [{ value: obj, isProcessed: false }]
    const resolvedValues = new Map<unknown, unknown>()
    const path = new Set<unknown>() // Used for cycle detection within the current traversal path.

    const processThemeString = (value: string) => {
      const regex = ThemeUtil.themeCache.getThemeRegex()
      let hasChanged = false
      const resolved = value.replace(regex, (match, path: string) => {
        let themeValue = ThemeUtil.themeCache.getPathLookup(themeSystem, path)
        if (themeValue === null) {
          themeValue = getValueByPath(themeSystem, path)
          ThemeUtil.themeCache.setPathLookup(themeSystem, path, themeValue)
        }
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

              if (typeof newValue === 'function' && processFunctions) {
                const funcResult = (newValue as (theme: Theme) => unknown)(theme)
                newValue = typeof funcResult === 'string' && funcResult.includes('theme.') ? processThemeString(funcResult) : funcResult
              } else if (typeof newValue === 'string' && newValue.includes('theme.')) {
                newValue = processThemeString(newValue)
              }

              if (newValue !== value) {
                if (newObj === null) newObj = { ...currentValue } // Copy-on-write
                newObj[key] = newValue
              }
            }
          }
          if (newObj !== null) finalValue = newObj
        }
        resolvedValues.set(currentValue, finalValue)
      }
    }

    const result = resolvedValues.get(obj) ?? obj

    if (ThemeUtil.themeCache.shouldCache()) {
      ThemeUtil.themeCache.setResolution(obj, theme, result)
    }

    return result as O
  }

  public static clearThemeCache = () => {
    ThemeUtil.themeCache.clear()
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
