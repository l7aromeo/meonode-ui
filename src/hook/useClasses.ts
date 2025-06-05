import { type CSSProperties, useEffect, useMemo } from 'react'

// Manages styles for server-side rendering (SSR)
let serverStyles: string[] = []
let serverRuleIndex = 0

/**
 * Retrieves the concatenated CSS string for server-side rendering.
 * @returns {string} The CSS string.
 */
export function getServerStyles(): string {
  return serverStyles.join('\n')
}

// Manages styles for client-side rendering
let styleSheet: CSSStyleSheet | undefined
if (typeof document !== 'undefined') {
  // Ensures a style tag with id '__sx' exists in the document head
  const styleTag =
    document.head.querySelector<HTMLStyleElement>('#__sx') ||
    (() => {
      const tag = document.createElement('style')
      tag.id = '__sx'
      document.head.appendChild(tag)
      return tag
    })()

  styleSheet = styleTag.sheet as CSSStyleSheet
}

// Global index for generating unique class names
let ruleIndex = 0
// Cache for mapping style objects to generated class names
const sxCache = new Map<string, string>()
// Reference count for each cached style, used for knowing when to remove styles
const refCountMap = new Map<string, number>()
// Maps cache keys to the array of CSS rules it generated
const ruleMap = new Map<string, string[]>()

// Type definitions for CSS values and style objects
type CSSValue = string | number
interface NestedStyle extends CSSProperties {
  [key: string]: CSSValue | NestedStyle | undefined
}
interface StyleObject extends NestedStyle {
  [key: string]: CSSValue | StyleObject | undefined
}

// Set of CSS properties that do not require a 'px' unit when their value is a number
const unitlessProperties = new Set([
  'animationIterationCount',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
])

/**
 * Custom React hook to generate and manage CSS classes from a style object.
 * Supports nesting, pseudo-selectors, and at-rules (@media, @container, @supports).
 * Handles both client-side and server-side rendering.
 * @param {StyleObject} sxObject The style object defining the CSS.
 * @param {any[]} deps Dependencies for memoization, similar to `useEffect` or `useMemo`.
 * @returns {string} The generated CSS class name.
 */
export function useClasses(sxObject: StyleObject, deps: any[] = []): string {
  // Generates a stable cache key based on the style object and dependencies
  const cacheKey = useMemo(() => {
    return `${stableStringify(sxObject)}::${stableStringify(deps)}`
  }, [sxObject, deps])

  // Manages the reference count for the generated style, cleaning up when no longer used.
  useEffect(() => {
    // Increment reference count when component mounts or dependencies change
    refCountMap.set(cacheKey, (refCountMap.get(cacheKey) || 0) + 1)

    // Decrement reference count and clean up styles when component unmounts
    return () => {
      const count = refCountMap.get(cacheKey) || 1
      if (count === 1) {
        removeStyleRules(cacheKey)
        sxCache.delete(cacheKey)
        refCountMap.delete(cacheKey)
      } else {
        refCountMap.set(cacheKey, count - 1)
      }
    }
  }, [cacheKey])

  // Returns the cached class name if the style has already been generated
  if (sxCache.has(cacheKey)) {
    return sxCache.get(cacheKey)!
  }

  // Generates a new unique class name
  const className = `sx-${ruleIndex++}`
  const rules: string[] = [] // Stores the generated CSS rules
  const topLevelStyles: StyleObject = {} // Stores styles directly applicable to the base class or its nested selectors
  const mediaBlocks: Record<string, StyleObject> = {} // Stores raw style objects for @media rules
  const containerBlocks: Record<string, StyleObject> = {} // Stores raw style objects for @container rules
  const supportsBlocks: Record<string, StyleObject> = {} // Stores raw style objects for @supports rules

  // First pass: Separates top-level styles from at-rules
  for (const key in sxObject) {
    const value = sxObject[key]
    if (key.startsWith('@media')) {
      mediaBlocks[key] = value as StyleObject
    } else if (key.startsWith('@container')) {
      containerBlocks[key] = value as StyleObject
    } else if (key.startsWith('@supports')) {
      supportsBlocks[key] = value as StyleObject
    } else {
      // Collects all other styles to be processed for the base class
      topLevelStyles[key] = value
    }
  }

  // Collects all rules for the base class and its nested selectors
  rules.push(...collectRules(topLevelStyles, `.${className}`))

  // Processes at-rule blocks, calling collectRules internally for their content
  processAtRuleBlocks(mediaBlocks, rules, className)
  processAtRuleBlocks(containerBlocks, rules, className)
  processAtRuleBlocks(supportsBlocks, rules, className)

  // Injects styles based on the rendering environment
  if (typeof document === 'undefined') {
    // Server-side rendering: stores CSS and returns a server-specific class name
    const serverClassName = `sx-${serverRuleIndex++}`
    const serverCss = rules.map(rule => rule.replace(new RegExp(className, 'g'), serverClassName)).join('\n')
    serverStyles.push(serverCss)
    sxCache.set(cacheKey, serverClassName)
    return serverClassName
  } else if (styleSheet) {
    // Client-side injection: inserts rules into the stylesheet
    injectStyles(rules)
  }

  // Caches the generated rules and class name
  ruleMap.set(cacheKey, rules)
  sxCache.set(cacheKey, className)
  return className
}

/**
 * Recursively collects CSS rules from a style object.
 * Handles direct properties, nested selectors (prefixed with '&'), and warns about deeply nested at-rules.
 * @param {StyleObject} sxBlock The style object to process.
 * @param {string} currentSelector The current CSS selector context.
 * @returns {string[]} An array of complete CSS rules.
 */
function collectRules(sxBlock: StyleObject, currentSelector: string): string[] {
  const rules: string[] = []
  const currentDeclarations: StyleObject = {} // Stores direct CSS properties for the current selector

  for (const key in sxBlock) {
    const value = sxBlock[key]

    if (typeof value === 'object' && value !== null) {
      if (key.startsWith('&')) {
        // Handles nested selectors (e.g., '&:hover', '& span')
        const newSelector = key.replace(/&/g, currentSelector)
        rules.push(...collectRules(value as StyleObject, newSelector))
      } else if (key.startsWith('@')) {
        // Warns about deeply nested at-rules, as they are processed at top-level or directly under the base class.
        console.warn(
          `Nested at-rule found at key "${key}" within selector "${currentSelector}". Current implementation processes at-rules at the top level or directly under the base class.`,
        )
      } else {
        // Flattens plain nested objects into the current selector's declarations
        Object.assign(currentDeclarations, value)
      }
    } else {
      // Collects direct CSS properties for the current selector
      currentDeclarations[key] = value
    }
  }

  // Generates the CSS rule for the current selector's direct properties
  const cssDeclarations = toCssDeclarations(currentDeclarations)
  if (cssDeclarations) {
    rules.unshift(`${currentSelector} { ${cssDeclarations} }`) // Adds current selector's rule to the beginning
  }

  return rules
}

/**
 * Processes at-rule blocks (@media, @container, @supports) and adds their rules to the output.
 * @param {Record<string, StyleObject>} blocksMap A map where keys are at-rules (e.g., '@media (min-width: 768px)') and values are their style objects.
 * @param {string[]} output The array to which generated CSS rules are added.
 * @param {string} baseClassName The base class name to which the at-rule styles apply.
 */
function processAtRuleBlocks(blocksMap: Record<string, StyleObject>, output: string[], baseClassName: string) {
  for (const [atRule, block] of Object.entries(blocksMap)) {
    // Collects rules for the at-rule's content, using the base class name for context
    const rulesForAtRule = collectRules(block, `.${baseClassName}`)
    if (rulesForAtRule.length) {
      output.push(`${atRule} { ${rulesForAtRule.join(' ')} }`)
    }
  }
}

/**
 * Injects an array of CSS rules into the document's stylesheet.
 * @param {string[]} rules An array of complete CSS rule strings.
 */
function injectStyles(rules: string[]) {
  if (!styleSheet) return

  for (const rule of rules) {
    try {
      styleSheet.insertRule(rule, styleSheet.cssRules.length)
    } catch (error) {
      console.error(`Failed to insert CSS rule: ${rule}`, error)
    }
  }
}

/**
 * Removes CSS rules associated with a specific cache key from the stylesheet.
 * @param {string} cacheKey The cache key identifying the rules to remove.
 */
function removeStyleRules(cacheKey: string) {
  const rules = ruleMap.get(cacheKey)
  if (!rules || !styleSheet) return

  // Iterates in reverse to safely delete rules without affecting indices
  for (let i = styleSheet.cssRules.length - 1; i >= 0; i--) {
    const rule = styleSheet.cssRules[i]
    if (rules.includes(rule.cssText)) {
      styleSheet.deleteRule(i)
    }
  }

  ruleMap.delete(cacheKey)
}

/**
 * Converts a flat style object into a CSS declaration string (e.g., "prop: value;").
 * Automatically appends 'px' to number values for non-unitless properties.
 * @param {StyleObject} obj The flat style object containing CSS property-value pairs.
 * @returns {string} The CSS declaration string.
 */
function toCssDeclarations(obj: StyleObject): string {
  const declarations: string[] = []
  for (const key in obj) {
    const value = obj[key]
    // Warns if a nested object is encountered, as this function expects flat properties.
    if (typeof value === 'object' && value !== null) {
      console.warn(`toCssDeclarations received a nested object for key "${key}". This function only processes flat CSS property-value pairs.`)
      continue
    }
    if (typeof value === 'number' && !isUnitlessProperty(key)) {
      declarations.push(`${camelToKebab(key)}: ${value}px;`)
    } else {
      declarations.push(`${camelToKebab(key)}: ${value};`)
    }
  }
  return declarations.join(' ')
}

/**
 * Checks if a given CSS property is unitless.
 * @param {string} prop The CSS property name (camelCase).
 * @returns {boolean} True if the property is unitless, false otherwise.
 */
function isUnitlessProperty(prop: string): boolean {
  return unitlessProperties.has(prop)
}

/**
 * Generates a stable JSON string representation of an object.
 * Ensures consistent stringification regardless of property order, useful for cache keys.
 * @param {any} obj The object to stringify.
 * @returns {string} The stable JSON string.
 */
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`
  }

  const sortedKeys = Object.keys(obj).sort()
  const items = sortedKeys.map(key => `"${key}":${stableStringify(obj[key])}`)

  return `{${items.join(',')}}`
}

/**
 * Converts a camelCase string to kebab-case.
 * @param {string} str The camelCase string.
 * @returns {string} The kebab-case string.
 */
function camelToKebab(str: string): string {
  return str
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Clears all generated styles and resets the internal state.
 * Useful for development or testing environments to ensure a clean slate.
 */
export function purgeStyles() {
  if (styleSheet) {
    while (styleSheet.cssRules.length > 0) {
      styleSheet.deleteRule(0)
    }
  }

  serverStyles = []
  sxCache.clear()
  ruleMap.clear()
  refCountMap.clear()
  ruleIndex = 0
  serverRuleIndex = 0
}
