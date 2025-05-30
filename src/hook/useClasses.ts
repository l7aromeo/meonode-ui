import { useEffect, useMemo } from 'react'

// Server-side rendering support
let serverStyles: string[] = []
let serverRuleIndex = 0

export function getServerStyles(): string {
  return serverStyles.join('\n')
}

// Client-side style management
let styleSheet: CSSStyleSheet | undefined
if (typeof document !== 'undefined') {
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

let ruleIndex = 0
const sxCache = new Map<string, string>()
const refCountMap = new Map<string, number>()
const ruleMap = new Map<string, string[]>()

// Improved type definitions
type CSSValue = string | number
interface NestedStyle {
  [key: string]: CSSValue | NestedStyle
}
interface StyleObject extends NestedStyle {
  [key: string]: CSSValue | StyleObject
}

// Unitless CSS properties
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

export function useClasses(sxObject: StyleObject, deps: any[] = []): string {
  // Stable cache key generation
  const cacheKey = useMemo(() => {
    return `${stableStringify(sxObject)}::${stableStringify(deps)}`
  }, [sxObject, deps])

  // Manage reference counting
  useEffect(() => {
    refCountMap.set(cacheKey, (refCountMap.get(cacheKey) || 0) + 1)

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

  // Return cached className if available
  if (sxCache.has(cacheKey)) {
    return sxCache.get(cacheKey)!
  }

  // Generate new className
  const className = `sx-${ruleIndex++}`
  const rules: string[] = []
  const baseStyles: StyleObject = {}
  const mediaBlocks: Record<string, string[]> = {}
  const containerBlocks: Record<string, string[]> = {}
  const supportsBlocks: Record<string, string[]> = {}

  // Process style object
  for (const key in sxObject) {
    const value = sxObject[key]

    // Handle nested selectors
    if (key.startsWith('&')) {
      const selector = key.replace(/&/g, `.${className}`)
      const css = toCssString(value as StyleObject)
      if (css) rules.push(`${selector} { ${css} }`)
    }
    // Handle media queries
    else if (key.startsWith('@media')) {
      processAtRuleBlock(key, value as StyleObject, className, mediaBlocks)
    }
    // Handle container queries
    else if (key.startsWith('@container')) {
      processAtRuleBlock(key, value as StyleObject, className, containerBlocks)
    }
    // Handle feature queries
    else if (key.startsWith('@supports')) {
      processAtRuleBlock(key, value as StyleObject, className, supportsBlocks)
    }
    // Handle base styles
    else {
      baseStyles[key] = value
    }
  }

  // Add base styles
  const baseCss = toCssString(baseStyles)
  if (baseCss) {
    rules.unshift(`.${className} { ${baseCss} }`)
  }

  // Process at-rule blocks
  processAtRuleBlocks(mediaBlocks, rules)
  processAtRuleBlocks(containerBlocks, rules)
  processAtRuleBlocks(supportsBlocks, rules)

  // Inject styles
  if (typeof document === 'undefined') {
    // Server-side rendering
    const serverClassName = `sx-${serverRuleIndex++}`
    const serverCss = rules.map(rule => rule.replace(new RegExp(className, 'g'), serverClassName)).join('\n')
    serverStyles.push(serverCss)
    sxCache.set(cacheKey, serverClassName)
    return serverClassName
  } else if (styleSheet) {
    // Client-side injection
    injectStyles(rules)
  }

  // Cache and return
  ruleMap.set(cacheKey, rules)
  sxCache.set(cacheKey, className)
  return className
}

// Helper function to process at-rule blocks
function processAtRuleBlock(atRule: string, block: StyleObject, className: string, blocksMap: Record<string, string[]>) {
  if (!blocksMap[atRule]) blocksMap[atRule] = []

  for (const key in block) {
    const value = block[key]
    const nestedClassName = `.${className}`

    if (key.startsWith('&')) {
      const selector = key.replace(/&/g, nestedClassName)
      const css = toCssString(value as StyleObject)
      if (css) blocksMap[atRule].push(`${selector} { ${css} }`)
    } else {
      const css = toCssString({ [key]: value })
      if (css) blocksMap[atRule].push(`${nestedClassName} { ${css} }`)
    }
  }
}

// Helper to finalize at-rule blocks
function processAtRuleBlocks(blocksMap: Record<string, string[]>, output: string[]) {
  for (const [atRule, rules] of Object.entries(blocksMap)) {
    if (rules.length) {
      output.push(`${atRule} { ${rules.join(' ')} }`)
    }
  }
}

// Inject styles using CSSStyleSheet API
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

// Remove unused style rules
function removeStyleRules(cacheKey: string) {
  const rules = ruleMap.get(cacheKey)
  if (!rules || !styleSheet) return

  // Find and remove rules in reverse order
  for (let i = styleSheet.cssRules.length - 1; i >= 0; i--) {
    const rule = styleSheet.cssRules[i]
    if (rules.includes(rule.cssText)) {
      styleSheet.deleteRule(i)
    }
  }

  ruleMap.delete(cacheKey)
}

// Convert style objects to CSS strings with nesting support
function toCssString(obj: StyleObject): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      // Handle nested objects recursively
      if (typeof value === 'object' && value !== null) {
        return toCssString(value)
      }

      // Handle numeric values
      if (typeof value === 'number' && !isUnitlessProperty(key)) {
        return `${camelToKebab(key)}: ${value}px;`
      }

      return `${camelToKebab(key)}: ${value};`
    })
    .join(' ')
}

// Check if property is unitless
function isUnitlessProperty(prop: string): boolean {
  return unitlessProperties.has(prop)
}

// Stable JSON stringification
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

// Convert camelCase to kebab-case
function camelToKebab(str: string): string {
  return str
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// Global style cleanup function
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
