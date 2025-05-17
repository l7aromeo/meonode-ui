'use strict'
import type { ComponentProps, CSSProperties, ElementType } from 'react'
import type { NodeElement, OriginalNodeProps } from '@src/node.type.js'
import cssPropertiesJson from '@src/json/css-properties.json' with { type: 'json' }
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

/**
 * The list of CSS property names imported from the JSON file.
 * Used for validation and filtering of CSS-related props.
 */
const cssProperties = cssPropertiesJson.properties

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
  | 'object-with-render'
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
 * Generates a string name for an ElementType.
 *
 * This function attempts to extract a meaningful name from a React ElementType,
 * which can be a string (for intrinsic elements like 'div'), a function (for
 * functional components), or an object (for components created with `React.memo`,
 * `React.forwardRef`, etc.). It prioritizes `displayName` and `name` properties
 * for functions and unwraps higher-order components to get the underlying name.
 *
 * If a name cannot be determined, it returns 'UnknownElementType'.
 * @typeParam ElementType - The type of the React element.
 * @param elementType The ElementType (e.g., 'div', MyComponent function/class).
 * @returns A string representation of the element type.
 */
export function getElementTypeName(elementType: NodeElement): string {
  switch (true) {
    case typeof elementType === 'string':
      return elementType

    case typeof elementType === 'function' && 'displayName' in elementType:
      return elementType.displayName || elementType.name || 'AnonymousComponent'

    case typeof elementType === 'object' && elementType !== null: {
      if ((elementType as any).displayName) {
        return (elementType as any).displayName
      }

      const innerType = (elementType as any).type || (elementType as any).render

      switch (true) {
        case typeof innerType === 'function':
          return innerType.displayName || innerType.name || 'WrappedComponent'

        case typeof innerType === 'string':
          return innerType

        case typeof (elementType as any).render === 'function' && (elementType as any).prototype?.isReactComponent:
          return (elementType as any).name || 'ClassComponent'

        default:
          return 'ObjectComponent'
      }
    }

    default:
      return 'UnknownElementType'
  }
}

/**
 * Converts kebab-case CSS property names to camelCase, preserving CSS custom properties.
 * Converts kebab-case CSS property names to their camelCase equivalents
 * Preserves CSS custom properties that start with --
 * @param prop The CSS property name to convert
 * @returns The camelCase property name
 * @example
 * ```ts
 * toCamelCase('background-color') // 'backgroundColor'
 * toCamelCase('--custom-prop') // '--custom-prop'
 * ```
 */
const toCamelCase = (prop: string): string => {
  if (prop.startsWith('--')) return prop // Preserve CSS variables
  return prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

/**
 * A set of valid CSS property names in camelCase, used for validation.
 */
const cssPropertySet: Set<string> = new Set(cssProperties.map(toCamelCase))

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
    if (cssPropertySet.has(key)) {
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
export function getDOMProps<E extends ElementType, T extends ComponentProps<E>>(props: T): Partial<OriginalNodeProps> {
  const result: Partial<OriginalNodeProps> = {}

  for (const key in props) {
    if (!cssPropertySet.has(key)) {
      result[key as keyof NonNullable<OriginalNodeProps>] = props[key]
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
export function getValueByPath(obj: Record<string, any> = {}, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}
