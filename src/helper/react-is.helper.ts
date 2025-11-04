/**
 * Custom React Type Checker (TypeScript Version)
 * Provides utilities for identifying and checking React component/element types.
 * Inspired by react-is package but implemented in TypeScript with type safety.
 */

import React from 'react'

/**
 * Symbol identifiers for React internal component types
 * These are used to identify different kinds of React elements and components
 */
export const REACT_ELEMENT_TYPE = Symbol.for('react.transitional.element')
export const REACT_PORTAL_TYPE = Symbol.for('react.portal')
export const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment')
export const REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode')
export const REACT_PROFILER_TYPE = Symbol.for('react.profiler')
export const REACT_PROVIDER_TYPE = Symbol.for('react.provider')
export const REACT_CONSUMER_TYPE = Symbol.for('react.consumer')
export const REACT_CONTEXT_TYPE = Symbol.for('react.context')
export const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref')
export const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense')
export const REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list')
export const REACT_MEMO_TYPE = Symbol.for('react.memo')
export const REACT_LAZY_TYPE = Symbol.for('react.lazy')
export const REACT_VIEW_TRANSITION_TYPE = Symbol.for('react.view_transition')
export const REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference')
export const REACT_ACTIVITY_TYPE = Symbol.for('react.activity')

/**
 * Union type of all possible React internal type symbols.
 * Used to strongly type return values from type checking functions.
 */
export type ReactTypeSymbols =
  | typeof REACT_ELEMENT_TYPE
  | typeof REACT_PORTAL_TYPE
  | typeof REACT_FRAGMENT_TYPE
  | typeof REACT_STRICT_MODE_TYPE
  | typeof REACT_PROFILER_TYPE
  | typeof REACT_PROVIDER_TYPE
  | typeof REACT_CONSUMER_TYPE
  | typeof REACT_CONTEXT_TYPE
  | typeof REACT_FORWARD_REF_TYPE
  | typeof REACT_SUSPENSE_TYPE
  | typeof REACT_SUSPENSE_LIST_TYPE
  | typeof REACT_MEMO_TYPE
  | typeof REACT_LAZY_TYPE
  | typeof REACT_VIEW_TRANSITION_TYPE
  | typeof REACT_CLIENT_REFERENCE
  | typeof REACT_ACTIVITY_TYPE

/**
 * Interface describing the minimal shape of a React element-like object.
 * Used for type checking without coupling to React's internal element type.
 */
export interface ReactElementLike {
  $$typeof?: symbol
  type?: any

  [key: string]: any
}

/**
 * Determines the internal React type of an object.
 * Examines the object's $$typeof property and nested type properties
 * to identify what kind of React element or component it represents.
 * @param {unknown} object The object to check
 * @returns {boolean} - The matching React type symbol or undefined if not a React object
 */
export function typeOf(object: unknown): ReactTypeSymbols | undefined {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = (object as any).$$typeof

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE: {
        const type = (object as any).type
        switch (type) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
          case REACT_VIEW_TRANSITION_TYPE:
            return type
          default: {
            const innerType = type?.$$typeof
            switch (innerType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
              case REACT_CONSUMER_TYPE:
                return innerType
              default:
                return $$typeof
            }
          }
        }
      }
      case REACT_PORTAL_TYPE:
        return $$typeof
    }
  }
  return undefined
}

/**
 * Checks if an object is a React Context Consumer
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a Context.Consumer
 */
export const isContextConsumer = (object: unknown): boolean => typeOf(object) === REACT_CONSUMER_TYPE

/**
 * Checks if an object is a React Context Provider
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a Context.Provider
 */
export const isContextProvider = (object: unknown): boolean => typeOf(object) === REACT_PROVIDER_TYPE

/**
 * Checks if an object is a valid React element
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a React element
 */
export const isElement = (object: unknown): boolean =>
  typeof object === 'object' && object !== null && (object as ReactElementLike).$$typeof === REACT_ELEMENT_TYPE

/**
 * Checks if an object is a React forwardRef component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a forwardRef component
 */
export const isForwardRef = (object: unknown): boolean => typeOf(object) === REACT_FORWARD_REF_TYPE

/**
 * Checks if an object is a React Fragment
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a Fragment
 */
export const isFragment = (object: unknown): boolean => typeOf(object) === REACT_FRAGMENT_TYPE

/**
 * Checks if an object is a React lazy component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a lazy component
 */
export const isLazy = (object: unknown): boolean => typeOf(object) === REACT_LAZY_TYPE

/**
 * Checks if an object is a React memo component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a memo component
 */
export const isMemo = (object: unknown): boolean => typeOf(object) === REACT_MEMO_TYPE

/**
 * Checks if an object is a React portal
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a portal
 */
export const isPortal = (object: unknown): boolean => typeOf(object) === REACT_PORTAL_TYPE

/**
 * Checks if an object is a React Profiler
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is a Profiler
 */
export const isProfiler = (object: unknown): boolean => typeOf(object) === REACT_PROFILER_TYPE

/**
 * Checks if an object is a React StrictMode component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is StrictMode
 */
export const isStrictMode = (object: unknown): boolean => typeOf(object) === REACT_STRICT_MODE_TYPE

/**
 * Checks if an object is a React Suspense component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is Suspense
 */
export const isSuspense = (object: unknown): boolean => typeOf(object) === REACT_SUSPENSE_TYPE

/**
 * Checks if an object is a React SuspenseList component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if `object` is SuspenseList
 */
export const isSuspenseList = (object: unknown): boolean => typeOf(object) === REACT_SUSPENSE_LIST_TYPE

/**
 * Checks if an object is a React ViewTransition component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is ViewTransition
 */
export const isViewTransition = (object: unknown): boolean => typeOf(object) === REACT_VIEW_TRANSITION_TYPE

/**
 * Checks if an object is a React Activity component
 * @param {unknown} object Object to check
 * @returns {boolean} - True if object is Activity
 */
export const isActivity = (object: unknown): boolean => typeOf(object) === REACT_ACTIVITY_TYPE

/**
 * Set of known valid React special element types.
 * Used for quick validation of element types in isValidElementType().
 * Includes Fragment, Profiler, StrictMode, Suspense and SuspenseList.
 */
const knownValidSymbols = new Set([
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_VIEW_TRANSITION_TYPE,
])

/**
 * Checks if a type is a valid React element type that can be rendered.
 * This includes strings (for DOM elements), functions (for components),
 * and various React-specific types like Fragment, Context, etc.
 * @param {any} type The type to validate
 * @returns {boolean} - True if the type can be rendered as a React element
 */
export const isValidElementType = <T>(type: T): boolean => {
  if (typeof type === 'string' || typeof type === 'number' || typeof type === 'bigint' || typeof type === 'function') return true
  if (knownValidSymbols.has(type as symbol)) return true
  if (typeof type === 'object' && type !== null) {
    const $$typeof = (type as any).$$typeof
    return (
      $$typeof === REACT_LAZY_TYPE ||
      $$typeof === REACT_MEMO_TYPE ||
      $$typeof === REACT_CONTEXT_TYPE ||
      $$typeof === REACT_CONSUMER_TYPE ||
      $$typeof === REACT_FORWARD_REF_TYPE ||
      $$typeof === REACT_CLIENT_REFERENCE ||
      $$typeof === REACT_PROVIDER_TYPE
    )
  }
  return false
}

/**
 * Type guard that checks if a component is a React class component.
 * Examines the component's prototype for the isReactComponent marker property
 * that React adds to all class components.
 * @param {unknown} component Component to check
 * @returns {boolean} - True if component is a React class component
 */
export const isReactClassComponent = (component: unknown): component is React.ComponentType => {
  if (typeof component !== 'function') {
    return false
  }
  // Check for `isReactComponent` flag which is set on class components.
  // Also handles components created with React.createClass.
  const prototype = component.prototype
  return !!(prototype && prototype.isReactComponent)
}
