'use strict'
import type { CSSProperties } from 'react'
import type { NodeInstance, Theme } from '@src/node.type.js'
import { getValueByPath } from '@src/common.helper'

/**
 * Type guard to check if an object is a NodeInstance.
 *
 * A NodeInstance is expected to be a non-null object with:
 * - an 'element' property,
 * - a 'render' method,
 * - a 'toPortal' method,
 * - and an 'isBaseNode' property.
 * @param obj The object to check.
 * @returns True if the object is a NodeInstance, false otherwise.
 */
export const isNodeInstance = (obj: unknown): obj is NodeInstance<any> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'element' in obj &&
    typeof (obj as NodeInstance<any>).render === 'function' &&
    typeof (obj as NodeInstance<any>).toPortal === 'function' &&
    'isBaseNode' in obj
  )
}

/**
 * Resolves theme variable references in an object's values recursively.
 * Handles nested objects and prevents circular references.
 * Theme variables are referenced using the format "theme.path.to.value".
 * @param obj The object whose values should be resolved against the theme
 * @param theme Optional theme object containing variable definitions
 * @returns A new object with all theme variables resolved to their values
 */
export const resolveObjWithTheme = (obj: Record<string, any> = {}, theme?: Theme) => {
  // Early return if no theme or empty object
  if (!theme || Object.keys(obj).length === 0) {
    return obj
  }

  const excludedKeys = new Set(['ref', 'key'])

  /**
   * Recursively resolves theme variables in an object, tracking visited objects
   * to prevent infinite recursion with circular references.
   */
  const resolveRecursively = (currentObj: Record<string, unknown>, visited: Set<Record<string, unknown>>): Record<string, unknown> => {
    // Skip functions and non-plain objects to prevent unintended flattening or
    // modification of complex instances like React components, DOM elements, or Date objects.
    if (!currentObj || typeof currentObj !== 'object' || Array.isArray(currentObj) || Object.getPrototypeOf(currentObj) !== Object.prototype) {
      return currentObj
    }

    // Prevent processing the same object multiple times
    if (visited.has(currentObj)) {
      return currentObj
    }

    // Track this object to detect circular references
    visited.add(currentObj)

    for (const key in currentObj) {
      try {
        const value = currentObj[key]

        // Conditions for direct assignment (no resolution or deep processing needed)
        if (
          excludedKeys.has(key) ||
          typeof value === 'function' ||
          (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) ||
          (typeof value === 'string' && !value.includes('theme.')) ||
          (typeof value !== 'object' && typeof value !== 'string' && typeof value !== 'function')
        ) {
          continue
        }

        // Resolve theme variables in string values
        if (typeof value === 'string' && value.includes('theme.')) {
          let processedValue = value
          processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
            const themeValue = getValueByPath(theme, path)
            // Only convert string/number theme values
            if (themeValue !== undefined && themeValue !== null) {
              if (typeof themeValue === 'object' && !Array.isArray(themeValue) && 'default' in themeValue) {
                return themeValue.default
              }
              return themeValue
            }
            return match // Keep original if no valid theme value found
          })
          currentObj[key] = processedValue
        }
        // Recursively process nested objects
        else {
          currentObj[key] = resolveRecursively(value as Record<string, unknown>, visited)
        }
      } catch {
        /* empty */
      }
    }

    return currentObj
  }

  return resolveRecursively(obj, new Set())
}

/**
 * Resolves default styles for a given CSSProperties object.
 * This method ensures that certain default styles, such as `minHeight`, `minWidth`,
 * and `flexShrink`, are applied based on the provided style properties.
 *
 * - If the element is a flex container:
 * - Sets `flexShrink` to 0 for specific scenarios:
 * - Column-based layout without wrapping.
 * - Row-based layout without wrapping (a default direction is assumed to be 'row').
 * - If the element is not a flex container:
 * - Defaults `flexShrink` to 0.
 * @param style The CSSProperties object containing style definitions.
 * @returns An object with resolved default styles.
 */
export const resolveDefaultStyle = (style: CSSProperties) => {
  const { flex, ...restStyle } = style
  const isFlexContainer = restStyle.display === 'flex'
  const hasOverflow = !!(restStyle.overflow || restStyle.overflowY || restStyle.overflowX)
  const isWrapping = restStyle.flexFlow?.includes('wrap') || restStyle.flexWrap === 'wrap'

  let flexShrink = undefined

  if (isFlexContainer) {
    if (!hasOverflow) {
      const isColumnDirection = restStyle.flexDirection === 'column' || restStyle.flexDirection === 'column-reverse'
      const isRowDirectionOrDefault = restStyle.flexDirection === 'row' || restStyle.flexDirection === 'row-reverse' || !restStyle.flexDirection

      // Scenario 1: Column-based layout
      if (isColumnDirection && !isWrapping) {
        flexShrink = 0
      }
      // Scenario 2: Row-based layout without wrapping, this assumes 'row' is the default if flexDirection is not set.
      else if (isRowDirectionOrDefault && !isWrapping) {
        flexShrink = 0
      }
    }
  } else {
    // If it's not a flex container, default flex-shrink to 0
    flexShrink = 0
  }

  return { flex, flexShrink, minHeight: 0, minWidth: 0, ...restStyle }
}
