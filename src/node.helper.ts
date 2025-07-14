'use strict'
import type { ComponentProps, CSSProperties, ElementType } from 'react'
import type { NodeElement, FinalNodeProps, NodeInstance, Theme } from '@src/node.type.js'
import {
  isContextConsumer,
  isContextProvider,
  isElement,
  isForwardRef,
  isFragment,
  isLazy,
  isMemo,
  isPortal,
  isProfiler,
  isReactClassComponent,
  isStrictMode,
  isSuspense,
  isSuspenseList,
} from '@src/react-is.helper.js'
import cssProperties from '@src/data/css-properties'

/**
 * Returns a string describing the type of a given React component or element.
 *
 * Checks for common React types (class, forwardRef, memo, etc.) and returns a string
 * such as 'class', 'forwardRef', 'memo', 'object-with-render', 'function', or other
 * React-specific types. Falls back to `typeof` or 'unknown' if not recognized.
 * @param component The React component, element type, or element-like object to check.
 * @returns A string describing the component type.
 * @example
 * getComponentType(class extends React.Component {}) // 'class'
 * getComponentType(React.forwardRef(() => <div/>)) // 'forwardRef'
 * getComponentType(React.memo(() => <div/>)) // 'memo'
 * getComponentType(() => <div/>) // 'function'
 */
export const getComponentType = (
  component?: NodeElement,
):
  | 'class'
  | 'forwardRef'
  | 'memo'
  | 'object'
  | 'function'
  | 'fragment'
  | 'portal'
  | 'profiler'
  | 'strict-mode'
  | 'suspense'
  | 'suspense-list'
  | 'context-consumer'
  | 'context-provider'
  | 'lazy'
  | 'element'
  | 'unknown'
  | string => {
  if (isForwardRef(component)) return 'forwardRef'
  if (isMemo(component)) return 'memo'
  if (isFragment(component)) return 'fragment'
  if (isPortal(component)) return 'portal'
  if (isProfiler(component)) return 'profiler'
  if (isStrictMode(component)) return 'strict-mode'
  if (isSuspense(component)) return 'suspense'
  if (isSuspenseList(component)) return 'suspense-list'
  if (isContextConsumer(component)) return 'context-consumer'
  if (isContextProvider(component)) return 'context-provider'
  if (isLazy(component)) return 'lazy'
  if (isElement(component)) return 'element'
  if (isReactClassComponent(component)) return 'class'

  return typeof component
}

/**
 * Generates a string name for an ElementType or ReactElement.
 *
 * This function attempts to extract a meaningful name from a React ElementType
 * (string, function, class, HOC) or a ReactElement instance.
 * It prioritizes `displayName` and `name` properties and unwraps HOCs like
 * `React.memo` and `React.forwardRef` to get the underlying component name.
 *
 * If a name cannot be determined, it returns a fallback like 'UnknownElementType' or 'AnonymousComponent'.
 * @param node The ElementType or ReactElement (e.g., 'div', MyComponent, <MyComponent />).
 * @returns A string representation of the element type's name.
 */
export function getElementTypeName(node: unknown): string {
  function getDisplayName(component: any, fallback: string): string {
    const name = component?.displayName || component?.name
    if (!!name && name !== 'render') return name
    return fallback
  }

  if (node === null || node === undefined) return 'UnknownElementType'

  const anyNode = node as any
  const type = getComponentType(anyNode)

  switch (type) {
    case 'string':
      return node as string

    case 'class':
      return getDisplayName(anyNode, 'ClassComponent')

    case 'function':
      return getDisplayName(anyNode, 'AnonymousFunctionComponent')

    case 'forwardRef':
      return getDisplayName(anyNode, '') || getDisplayName(anyNode.render, '') || 'ForwardRefComponent'

    case 'memo':
      return getDisplayName(anyNode, '') || (anyNode.type ? getElementTypeName(anyNode.type) : 'MemoComponent')

    case 'element':
      return getElementTypeName(anyNode.type)

    case 'fragment':
      return 'Fragment'

    case 'portal':
      return 'Portal'

    case 'profiler':
      return getDisplayName(anyNode, 'Profiler')

    case 'strict-mode':
      return 'StrictMode'

    case 'suspense':
      return getDisplayName(anyNode, 'Suspense')

    case 'suspense-list':
      return 'SuspenseList'

    case 'context-consumer':
      return anyNode._context?.displayName ? `${anyNode._context.displayName}.Consumer` : 'ContextConsumer'

    case 'context-provider':
      return anyNode._context?.displayName ? `${anyNode._context.displayName}.Provider` : 'ContextProvider'

    case 'lazy':
      return getDisplayName(anyNode, 'LazyComponent')

    case 'object':
      if (getDisplayName(anyNode, '')) return getDisplayName(anyNode, '')
      if (typeof anyNode.render === 'function') {
        return getDisplayName(anyNode.render, 'ObjectWithRender')
      }
      if (anyNode.type && anyNode.type !== node) {
        return `Wrapped<${getElementTypeName(anyNode.type)}>`
      }
      return getDisplayName(anyNode, 'ObjectComponent')

    case 'symbol':
      if (typeof node === 'symbol') {
        return (
          node.description
            ?.replace(/^react\./, '')
            .split('.')
            .map(part => part[0]?.toUpperCase() + part.slice(1))
            .join('') || node.toString()
        )
      }
      return 'SymbolComponent'

    case 'unknown':
      return 'UnknownElementType'

    default:
      return `UnsupportedType<${type}>`
  }
}

/**
 * A set of valid CSS property names in camelCase, including CSS custom properties, used for validation.
 * This set contains all CSS properties including non-standard vendor prefixed properties.
 */
export const CSSPropertySet: Set<string> = new Set(cssProperties)

/**
 * Filters an object to only include valid CSS properties
 * @param props The object containing potential CSS properties
 * @returns An object containing only valid CSS properties
 * @example
 * ```ts
 * getCSSProps({
 *   backgroundColor: 'red',
 *   invalid: true
 * }) // { backgroundColor: 'red' }
 * ```
 */
export function getCSSProps<T extends Record<string, any>>(props: T): Partial<CSSProperties> {
  const result: Partial<CSSProperties> = {}

  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key) && CSSPropertySet.has(key)) {
      result[key as keyof CSSProperties] = props[key]
    }
  }

  return result
}

/**
 * Filters component props to include only valid DOM properties and attributes.
 *
 * This function iterates through the provided props and retains only those that
 * are not CSS properties (as determined by `cssPropertySet`). This is useful for
 * separating style-related props from standard DOM attributes when rendering
 * elements.
 * @ty E - The type of the React element.
 * @typeParam T - The type of the component props.
 * @param props The component props to filter.
 * @returns An object containing only valid DOM props.
 */
export function getDOMProps<E extends ElementType, T extends ComponentProps<E>>(props: T): Partial<FinalNodeProps> {
  const result: Partial<FinalNodeProps> = {}

  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key) && !CSSPropertySet.has(key)) {
      result[key as keyof NonNullable<FinalNodeProps>] = props[key]
    }
  }

  return result
}

/**
 * Retrieves a deeply nested value from an object using a dot-separated string path.
 *
 * This function traverses an object based on the provided path, which is a
 * string of keys separated by dots. It returns the value found at the end of
 * the path or `undefined` if any key in the path is not found or if the object
 * is nullish at any point during traversal.
 * @param obj The object to traverse. Defaults to an empty object if not provided.
 * @param path The dot-separated path string (e.g., 'background.primary').
 * @returns The value at the specified path, or undefined if not found.
 */
export function getValueByPath(obj: Record<string, any> = {}, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

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

    // Prevent processing same object multiple times
    if (visited.has(currentObj)) {
      return currentObj
    }

    // Track this object to detect circular references
    visited.add(currentObj)

    const resolvedObj: Record<string, unknown> = {}

    for (const key in currentObj) {
      const value = currentObj[key]

      // Skip functions and non-plain objects to prevent unintended flattening or
      // modification of complex instances like React components, DOM elements, or Date objects.
      if (
        typeof value === 'function' ||
        (value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) ||
        key === 'ref'
      ) {
        resolvedObj[key] = value
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
        resolvedObj[key] = processedValue
      }
      // Recursively process nested objects
      else {
        resolvedObj[key] = resolveRecursively(value as Record<string, unknown>, visited)
      }
    }

    return resolvedObj
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
