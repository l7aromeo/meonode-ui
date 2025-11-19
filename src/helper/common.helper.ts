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
} from '@src/helper/react-is.helper.js'
import type { FinalNodeProps, NodeElement, NodeInstance } from '@src/types/node.type.js'
import cssProperties from '@src/constant/css-properties.const.js'
import type { ComponentProps, CSSProperties, ElementType } from 'react'
import { NO_STYLE_TAGS, noStyleTagsSet } from '@src/constant/common.const.js'

/**
 * Retrieves a deeply nested value from an object using a dot-separated string path.
 *
 * This function traverses an object based on the provided path, which is a
 * string of keys separated by dots. It returns the value found at the end of
 * the path or `undefined` if any key in the path is not found or if the object
 * is nullish at any point during traversal.
 * @param obj The object to traverse, defaults to an empty object if not provided.
 * @param path The dot-separated path string (e.g., 'background.primary').
 * @returns The value at the specified path, or undefined if not found.
 */
export const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj)
}

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
  component?: NodeElement | NodeInstance,
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
      result[key] = props[key]
    }
  }

  return result
}

/**
 * Checks if a given tag is in the set of tags that should not receive style props.
 * @param tag The tag name to check (e.g., 'script', 'style').
 * @returns `true` if the tag is in the no-style set, otherwise `false`.
 */
export function hasNoStyleTag(tag?: NodeElement): boolean {
  if (!tag || typeof tag !== 'string') return false
  return noStyleTagsSet.has(tag.toLowerCase() as (typeof NO_STYLE_TAGS)[number])
}

/**
 * Returns a shallow copy of the object with the specified keys omitted.
 * @param obj The source object.
 * @param keys The property keys to omit.
 * @returns A new object without the omitted keys.
 */
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = {} as Omit<T, K>
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keys.includes(key as unknown as K)) {
      ;(result as any)[key] = obj[key]
    }
  }
  return result
}

/**
 * Removes keys from an object whose values are `undefined`.
 * @param obj The source object.
 * @returns A new object without keys that have `undefined` values.
 */
export function omitUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}
