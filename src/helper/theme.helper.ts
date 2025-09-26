import { getValueByPath } from '@src/helper/common.helper.js'
import type { ThemeSystem } from '@src/node.type.js'
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
 * @returns A new object (or array) with all theme variables resolved to their corresponding values,
 * or the original object (or array) if no changes were necessary.
 */
export const resolveObjWithTheme = (obj: Record<string, any> = {}, theme?: ThemeSystem) => {
  if (!theme || (!!theme && typeof theme === 'object' && Object.keys(theme).length === 0) || Object.keys(obj).length === 0) {
    return obj
  }

  // Check cache first (only on server-side for RSC optimization)
  if (themeCache.shouldCache()) {
    const cachedResult = themeCache.getResolution(obj, theme)
    if (cachedResult !== null) {
      return cachedResult
    }
  }

  /**
   * Recursively resolves theme variables within an object or array.
   * It tracks visited objects to prevent infinite recursion caused by circular references.
   * This function implements a "smart merge" to preserve object/array identity for unchanged parts.
   * @param currentObj The current object or array being processed in the recursion.
   * @param visited A Set to keep track of objects that have already been visited to detect circular references.
   * @returns The processed object/array with theme variables resolved, or the original `currentObj`
   * if no changes were made to it or its direct children (excluding deeper nested changes).
   */
  const resolveRecursively = (currentObj: any, visited: Set<any>): any => {
    // Base cases for non-objects/null, or already visited objects (circular reference)
    if (currentObj === null || typeof currentObj !== 'object') {
      return currentObj
    }

    if (visited.has(currentObj)) {
      return currentObj
    }

    visited.add(currentObj)

    // Handle Arrays
    if (Array.isArray(currentObj)) {
      let resolvedArray: any[] = currentObj
      let changed = false

      for (let i = 0; i < currentObj.length; i++) {
        const value = currentObj[i]
        const newValue = resolveRecursively(value, visited) // Recursively process each element

        if (newValue !== value) {
          if (!changed) {
            resolvedArray = [...currentObj] // Create a shallow copy only if a change is detected
            changed = true
          }
          resolvedArray[i] = newValue
        } else if (changed) {
          // If a change has already occurred, ensure we copy the original values
          resolvedArray[i] = value
        }
      }
      return resolvedArray
    }

    // Handle Plain Objects (only process objects created with {})
    let resolvedObj: Record<string, any> = currentObj
    let changed = false

    for (const key in currentObj) {
      // Ensure it's an own property
      const value = currentObj[key]
      let newValue: any = value

      if (
        typeof value === 'function' ||
        (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) || // Exclude plain objects and arrays
        (typeof value !== 'object' && typeof value !== 'string')
      ) {
        newValue = value
      } else if (typeof value === 'string' && value.includes('theme.')) {
        let processedValue = value
        let valueResolved = false

        // Use cached regex instance
        const regex = themeCache.getThemeRegex()

        processedValue = processedValue.replace(regex, (match, path) => {
          // Check path lookup cache first
          let themeValue = themeCache.getPathLookup(theme!, path)

          if (themeValue === null) {
            // Not in cache, perform lookup and cache result
            themeValue = getValueByPath(theme!, path)
            themeCache.setPathLookup(theme!, path, themeValue)
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

        if (valueResolved && processedValue !== value) {
          newValue = processedValue
        } else {
          newValue = value
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects or arrays
        newValue = resolveRecursively(value, visited)
      }

      if (newValue !== value) {
        if (!changed) {
          resolvedObj = { ...currentObj } // Create a shallow copy only if a change is detected
          changed = true
        }
        resolvedObj[key] = newValue
      } else if (changed) {
        // If a change has already occurred, ensure we copy the original values
        resolvedObj[key] = value
      }
    }

    return resolvedObj
  }

  // Perform the resolution
  const result = resolveRecursively(obj, new Set())

  // Cache the result (only on server-side)
  if (themeCache.shouldCache()) {
    themeCache.setResolution(obj, theme, result)
  }

  return result
}
