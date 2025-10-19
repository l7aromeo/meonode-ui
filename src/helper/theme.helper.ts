import { getValueByPath } from '@src/helper/common.helper.js'
import type { Theme, ThemeSystem } from '@src/node.type.js'
import { ObjHelper } from '@src/helper/obj.helper.js'

/**
 * Cache manager for theme resolution operations.
 * Provides singleton-based caching with different strategies for server vs client environments.
 */
class ThemeResolverCache {
  private static _instance: ThemeResolverCache | null = null

  private readonly _resolutionCache = new Map<string, any>()
  private readonly _pathLookupCache = new Map<string, any>()
  private readonly _themeRegex = /theme\.([a-zA-Z0-9_.-]+)/g

  // Track cache statistics for performance monitoring
  private _stats = {
    hits: 0,
    misses: 0,
    pathHits: 0,
    pathMisses: 0,
  }

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the cache manager
   */
  static getInstance(): ThemeResolverCache {
    if (!ThemeResolverCache._instance) {
      ThemeResolverCache._instance = new ThemeResolverCache()
    }
    return ThemeResolverCache._instance
  }

  /**
   * Generate a stable cache key from object and theme
   */
  private _generateCacheKey(obj: Record<string, any>, theme: ThemeSystem): string {
    // Use a more efficient key generation for better performance
    return `${ObjHelper.stringify(obj)}_${ObjHelper.stringify(theme)}`
  }

  /**
   * Check if resolution result exists in cache
   */
  getResolution(obj: Record<string, any>, theme: ThemeSystem): any | null {
    const key = this._generateCacheKey(obj, theme)

    if (this._resolutionCache.has(key)) {
      this._stats.hits++
      return this._resolutionCache.get(key)
    }

    this._stats.misses++
    return null
  }

  /**
   * Store resolution result in cache
   */
  setResolution(obj: Record<string, any>, theme: ThemeSystem, result: any): void {
    const key = this._generateCacheKey(obj, theme)
    this._resolutionCache.set(key, result)
  }

  /**
   * Get cached theme path lookup
   */
  getPathLookup(theme: ThemeSystem, path: string): any | null {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`

    if (this._pathLookupCache.has(pathKey)) {
      this._stats.pathHits++
      return this._pathLookupCache.get(pathKey)
    }

    this._stats.pathMisses++
    return null
  }

  /**
   * Cache theme path lookup result
   */
  setPathLookup(theme: ThemeSystem, path: string, value: any): void {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`
    this._pathLookupCache.set(pathKey, value)
  }

  /**
   * Get the shared regex instance (reused for performance)
   */
  getThemeRegex(): RegExp {
    // Reset lastIndex to ensure consistent behavior
    this._themeRegex.lastIndex = 0
    return this._themeRegex
  }

  /**
   * Check if we should use caching (server-side only for RSC optimization)
   */
  shouldCache(): boolean {
    return typeof window === 'undefined'
  }
}

// Module-level cache instance
const themeCache = ThemeResolverCache.getInstance()

/**
 * Resolves theme variable references in an object's values recursively.
 * This function performs a "smart merge" to maintain object reference identity
 * for parts of the object that do not contain resolved theme variables or
 * other modifications. Only creates new objects or properties when a change occurs.
 * Handles nested objects and arrays, and prevents circular references.
 * Theme variables are referenced using the format "theme.path.to.value".
 * @param obj The object (or array) whose values should be resolved against the theme. Defaults to an empty object.
 * @param theme The theme object containing variable definitions. Optional.
 * @param options Options to control processing behavior.
 * - processFunctions: If true, functions within the object will be executed with the theme as an argument.
 * If false, functions will be ignored. Defaults to false.
 * @returns A new object (or array) with all theme variables resolved to their corresponding values,
 * or the original object (or array) if no changes were necessary.
 */
export const resolveObjWithTheme = (obj: Record<string, any> = {}, theme?: Theme, options: { processFunctions?: boolean } = {}) => {
  const { processFunctions = false } = options

  if (!theme || (!!theme && typeof theme === 'object' && Object.keys(theme).length === 0) || Object.keys(obj).length === 0) {
    return obj
  }

  // Ensure theme has a valid system property
  const themeSystem = theme?.system
  if (!themeSystem || typeof themeSystem !== 'object' || Object.keys(themeSystem).length === 0) {
    return obj
  }

  // Check cache first (only on server-side for RSC optimization)
  if (themeCache.shouldCache()) {
    // Note: Caching is based on the input object. If processFunctions changes behavior,
    // a more complex cache key may be needed in the future.
    const cachedResult = themeCache.getResolution(obj, themeSystem)
    if (cachedResult !== null) {
      return cachedResult
    }
  }

  const resolveRecursively = (currentObj: any, visited: Set<any>): any => {
    if (currentObj === null || typeof currentObj !== 'object') {
      return currentObj
    }

    if (visited.has(currentObj)) {
      return currentObj
    }

    visited.add(currentObj)

    const processThemeString = (value: string) => {
      let processedValue = value
      let valueResolved = false
      const regex = themeCache.getThemeRegex()

      processedValue = processedValue.replace(regex, (match, path) => {
        let themeValue = themeCache.getPathLookup(themeSystem, path)
        if (themeValue === null) {
          themeValue = getValueByPath(themeSystem, path)
          themeCache.setPathLookup(themeSystem, path, themeValue)
        }

        if (themeValue !== undefined && themeValue !== null) {
          valueResolved = true
          if (typeof themeValue === 'object' && !Array.isArray(themeValue) && 'default' in themeValue) {
            return themeValue.default
          }
          return themeValue
        }
        return match
      })

      return valueResolved ? processedValue : value
    }

    if (Array.isArray(currentObj)) {
      let resolvedArray: any[] = currentObj
      let changed = false
      for (let i = 0; i < currentObj.length; i++) {
        const value = currentObj[i]
        const newValue = resolveRecursively(value, visited)
        if (newValue !== value) {
          if (!changed) {
            resolvedArray = [...currentObj]
            changed = true
          }
          resolvedArray[i] = newValue
        } else if (changed) {
          resolvedArray[i] = value
        }
      }
      return resolvedArray
    }

    let resolvedObj: Record<string, any> = currentObj
    let changed = false

    for (const key in currentObj) {
      const value = currentObj[key]
      let newValue: any = value

      if (typeof value === 'function') {
        if (processFunctions) {
          const funcResult = value(theme)
          newValue = resolveRecursively(funcResult, visited)
        } else {
          newValue = value // Ignore function
        }
      } else if (
        (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) ||
        (typeof value !== 'object' && typeof value !== 'string')
      ) {
        newValue = value // Ignore non-plain objects and primitives other than strings
      } else if (typeof value === 'string' && value.includes('theme.')) {
        newValue = processThemeString(value)
      } else if (typeof value === 'object' && value !== null) {
        newValue = resolveRecursively(value, visited)
      }

      if (newValue !== value) {
        if (!changed) {
          resolvedObj = { ...currentObj }
          changed = true
        }
        resolvedObj[key] = newValue
      } else if (changed) {
        resolvedObj[key] = value
      }
    }
    return resolvedObj
  }

  const result = resolveRecursively(obj, new Set())

  if (themeCache.shouldCache()) {
    themeCache.setResolution(obj, themeSystem, result)
  }

  return result
}
