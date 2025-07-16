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
export const resolveObjWithTheme = (obj: Record<string, any> = {}, theme?: Theme) => {
  if (!theme || (!!theme && typeof theme === 'object' && Object.keys(theme).length === 0) || Object.keys(obj).length === 0) {
    return obj
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

        processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
          const themeValue = getValueByPath(theme, path)

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

  // Initial call, ensure `obj` could be an array as well
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
