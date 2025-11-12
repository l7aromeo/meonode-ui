import { getValueByPath } from '@src/helper/common.helper.js'
import type { Theme, ThemeSystem } from '@src/node.type.js'
import { ObjHelper } from '@src/helper/obj.helper.js'

/**
 * Cache manager for theme resolution operations.
 */
class ThemeResolverCache {
  private static _instance: ThemeResolverCache | null = null

  private readonly _resolutionCache = new Map<string, any>()
  private readonly _pathLookupCache = new Map<string, any>()
  private readonly _themeRegex = /theme\.([a-zA-Z0-9_.-]+)/g

  static getInstance(): ThemeResolverCache {
    if (!ThemeResolverCache._instance) {
      ThemeResolverCache._instance = new ThemeResolverCache()
    }
    return ThemeResolverCache._instance
  }

  /**
   * Generate a stable cache key from object and theme, including the theme mode.
   */
  private _generateCacheKey(obj: Record<string, any>, theme: Theme): string {
    // Including theme.mode is critical for cache correctness.
    return `${ObjHelper.stringify(obj)}_${theme.mode}_${ObjHelper.stringify(theme.system)}`
  }

  getResolution(obj: Record<string, any>, theme: Theme): any | null {
    const key = this._generateCacheKey(obj, theme)
    return this._resolutionCache.get(key) || null
  }

  setResolution(obj: Record<string, any>, theme: Theme, result: any): void {
    const key = this._generateCacheKey(obj, theme)
    this._resolutionCache.set(key, result)
  }

  getPathLookup(theme: ThemeSystem, path: string): any | null {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`
    return this._pathLookupCache.get(pathKey) || null
  }

  setPathLookup(theme: ThemeSystem, path: string, value: any): void {
    const pathKey = `${ObjHelper.stringify(theme)}_${path}`
    this._pathLookupCache.set(pathKey, value)
  }

  getThemeRegex(): RegExp {
    this._themeRegex.lastIndex = 0
    return this._themeRegex
  }

  shouldCache(): boolean {
    return typeof window === 'undefined'
  }
}

const themeCache = ThemeResolverCache.getInstance()

const isPlainObject = (value: any): boolean => {
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
export const resolveObjWithTheme = (obj: Record<string, any> = {}, theme?: Theme, options: { processFunctions?: boolean } = {}) => {
  const { processFunctions = false } = options

  if (!theme || !theme.system || typeof theme.system !== 'object' || Object.keys(theme.system).length === 0 || Object.keys(obj).length === 0) {
    return obj
  }

  const themeSystem = theme.system

  if (themeCache.shouldCache()) {
    const cachedResult = themeCache.getResolution(obj, theme)
    if (cachedResult !== null) {
      return cachedResult
    }
  }

  const workStack: { value: any; isProcessed: boolean }[] = [{ value: obj, isProcessed: false }]
  const resolvedValues = new Map<any, any>()
  const path = new Set<any>() // Used for cycle detection within the current traversal path.

  const processThemeString = (value: string) => {
    const regex = themeCache.getThemeRegex()
    let hasChanged = false
    const resolved = value.replace(regex, (match, path) => {
      let themeValue = themeCache.getPathLookup(themeSystem, path)
      if (themeValue === null) {
        themeValue = getValueByPath(themeSystem, path)
        themeCache.setPathLookup(themeSystem, path, themeValue)
      }
      if (themeValue !== undefined && themeValue !== null) {
        hasChanged = true
        return typeof themeValue === 'object' && !Array.isArray(themeValue) && 'default' in themeValue ? themeValue.default : themeValue
      }
      return match
    })
    return hasChanged ? resolved : value
  }

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
      // --- Begin Phase ---
      currentWork.isProcessed = true
      path.add(currentValue)

      const children = Array.isArray(currentValue) ? currentValue : Object.values(currentValue)
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        // Only push containers that are not already in the current path (cycle detection).
        if ((isPlainObject(child) || Array.isArray(child)) && !path.has(child)) {
          workStack.push({ value: child, isProcessed: false })
        }
      }
    } else {
      // --- Complete Phase ---
      workStack.pop()
      path.delete(currentValue) // Unwind the path

      let finalValue = currentValue

      if (Array.isArray(currentValue)) {
        let newArray: any[] | null = null
        for (let i = 0; i < currentValue.length; i++) {
          const item = currentValue[i]
          const resolvedItem = resolvedValues.get(item) ?? item
          if (resolvedItem !== item) {
            if (newArray === null) newArray = [...currentValue] // Copy-on-write
            newArray![i] = resolvedItem
          }
        }
        if (newArray !== null) finalValue = newArray
      } else {
        let newObj: Record<string, any> | null = null
        for (const key in currentValue) {
          if (Object.prototype.hasOwnProperty.call(currentValue, key)) {
            const value = currentValue[key]
            let newValue = resolvedValues.get(value) ?? value

            if (typeof newValue === 'function' && processFunctions) {
              const funcResult = newValue(theme)
              newValue = typeof funcResult === 'string' && funcResult.includes('theme.') ? processThemeString(funcResult) : funcResult
            } else if (typeof newValue === 'string' && newValue.includes('theme.')) {
              newValue = processThemeString(newValue)
            }

            if (newValue !== value) {
              if (newObj === null) newObj = { ...currentValue } // Copy-on-write
              newObj![key] = newValue
            }
          }
        }
        if (newObj !== null) finalValue = newObj
      }
      resolvedValues.set(currentValue, finalValue)
    }
  }

  const result = resolvedValues.get(obj) ?? obj

  if (themeCache.shouldCache()) {
    themeCache.setResolution(obj, theme, result)
  }

  return result
}
