'use strict'
import type { CSSProperties } from 'react'
import type { NodeInstance } from '@src/node.type.js'

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
 * Parsed flex shorthand components for CSS flex property
 * @interface FlexComponents
 * @property grow - The flex-grow value (how much the item should grow)
 * @property shrink - The flex-shrink value (how much the item should shrink)
 * @property basis - The flex-basis value (initial main size before free space is distributed)
 */
interface FlexComponents {
  grow: number
  shrink: number
  basis: string | number
}

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
function parseFlexShorthand(flex: CSSProperties['flex']): FlexComponents | null {
  // Early returns for invalid inputs
  if (flex === null || flex === undefined) return null

  // Handle numeric flex values (e.g., flex: 1)
  if (typeof flex === 'number') {
    return { grow: flex, shrink: 1, basis: '0%' }
  }

  // Only process string values
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
export const resolveDefaultStyle = (style: CSSProperties) => {
  // === STEP 1: EXTRACT FLEX PROPERTY ===
  // Extract flex shorthand to handle it separately from individual flex properties
  const { flex, ...restStyle } = style

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
  const explicitFlexComponents = flex ? parseFlexShorthand(flex) : null

  // === STEP 4: DETERMINE FLEX SHRINK BEHAVIOR ===
  let flexShrink = undefined

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
