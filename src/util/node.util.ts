import React, { type ComponentProps, type ElementType, type ReactNode, createElement, isValidElement } from 'react'
import type {
  FunctionRendererProps,
  NodeElement,
  NodeElementType,
  NodeFunction,
  NodeInstance,
  NodeProps,
  DependencyList,
  FinalNodeProps,
  Children,
} from '@src/types/node.type.js'
import { isForwardRef, isMemo, isReactClassComponent } from '@src/helper/react-is.helper.js'
import { getCSSProps, getDOMProps, getElementTypeName, omitUndefined, getGlobalState } from '@src/helper/common.helper.js'
import { __DEBUG__ } from '@src/constant/common.const.js'
import { BaseNode } from '@src/core.node.js'

const FUNCTION_SIGNATURE_CACHE_KEY = Symbol.for('@meonode/ui/NodeUtil/functionSignatureCache')

/**
 * NodeUtil provides a collection of static utility methods and properties
 * used internally by BaseNode for various tasks such as hashing, shallow comparison,
 * and stable element ID generation. This centralizes common helper functions,
 * improving modularity and maintainability of the core library.
 */
export class NodeUtil {
  private constructor() {}

  // Determines if the current environment is server-side (Node.js) or client-side (browser).
  public static isServer = typeof window === 'undefined'

  // Unique ID generation for elements
  private static get _functionSignatureCache() {
    return getGlobalState(FUNCTION_SIGNATURE_CACHE_KEY, () => new WeakMap<object, string>())
  }

  // Critical props for signature generation and shallow comparison
  private static readonly CRITICAL_PROPS = new Set(['css', 'className', 'disableEmotion', 'props'])

  // Cache for function prop toString() hashes to avoid repeated expensive serialization
  private static _propFuncCache = new WeakMap<(...args: any[]) => any, string>()

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
  public static isNodeInstance = (obj: unknown): obj is NodeInstance => obj instanceof BaseNode

  /**
   * Determines if a given string `k` is a valid CSS style property.
   * This check is performed only on the client-side by checking if the property exists in `document.body.style`.
   * On the server-side, it always returns `false`.
   * @param k The string to check.
   * @returns True if the string is a valid CSS style property, false otherwise.
   */
  public static isStyleProp = !NodeUtil.isServer && typeof document !== 'undefined' ? (k: string) => k in document.body.style : () => false

  /**
   * Combines FNV-1a and djb2 hash functions for a more robust signature.
   * This hybrid approach provides better distribution than either algorithm alone.
   * @param str The string to hash.
   * @returns A combined hash string in base-36 format.
   */
  public static hashString(str: string): string {
    let h1 = 2166136261 // FNV offset basis
    let h2 = 5381 // djb2 init

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      // FNV-1a
      h1 ^= char
      h1 = Math.imul(h1, 16777619)
      // djb2
      h2 = Math.imul(h2, 33) ^ char
    }

    return `${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}`
  }

  /**
   * Generates a fast structural hash for CSS objects without full serialization.
   * This is an optimized hashing method that samples the first 10 keys for performance.
   * @param css The CSS object to hash.
   * @returns A hash string representing the CSS object structure.
   */

  /**
   * Generates a fast structural hash for CSS objects without full serialization.
   * This is an optimized hashing method that samples the first 10 keys for performance.
   * @param css The CSS object to hash.
   * @returns A hash string representing the CSS object structure.
   */
  private static hashCSS(css: Record<string, unknown>): string {
    // Fast structural hash without full serialization
    const keys = Object.keys(css)
    let hash = keys.length

    for (let i = 0; i < Math.min(keys.length, 10); i++) {
      // Sample first 10
      const key = keys[i]
      const val = css[key]
      const charCode = key.charCodeAt(0)
      hash = (hash << 5) - hash + charCode
      hash = hash & hash // Convert to 32bit int

      if (typeof val === 'string') {
        hash = (hash << 5) - hash + val.length
      }
    }

    return hash.toString(36)
  }

  /**
   * Creates a unique, stable signature from the element type and props.
   * This signature includes the element's type to prevent collisions between different components
   * and handles primitive values in arrays and objects for better caching.
   * On server environments, returns undefined as signatures are not needed for server-side rendering.
   * @param element The element type to include in the signature.
   * @param props The props object to include in the signature.
   * @returns A unique signature string or undefined on the server.
   */
  public static createPropSignature(element: NodeElementType, props: Record<string, unknown>): string | undefined {
    if (NodeUtil.isServer) return undefined

    const elementId = getElementTypeName(element)

    const keys = Object.keys(props)
    // Optimization: Only sort if there's more than one key to ensure stability
    if (keys.length > 1) {
      keys.sort()
    }
    const signatureParts: string[] = [`${elementId}:`]

    if (typeof element === 'function') {
      let funcSignature = NodeUtil._functionSignatureCache.get(element)
      if (!funcSignature) {
        funcSignature = NodeUtil.hashString(element.toString())
        NodeUtil._functionSignatureCache.set(element, funcSignature)
      }
      signatureParts.push(funcSignature)
    }

    for (const key of keys) {
      const val = props[key]
      let valStr: string

      const valType = typeof val
      if (valType === 'string' || valType === 'number' || valType === 'boolean') {
        valStr = `${key}:${val};`
      } else if (val === null) {
        valStr = `${key}:null;`
      } else if (val === undefined) {
        valStr = `${key}:undefined;`
      } else if (key === 'css' && typeof val === 'object') {
        valStr = `css:${this.hashCSS(val as Record<string, unknown>)};`
      } else if (Array.isArray(val)) {
        // Hash primitive values in arrays for better cache hits
        const primitives = val.filter(v => {
          const t = typeof v
          return t === 'string' || t === 'number' || t === 'boolean' || v === null
        })
        if (primitives.length === val.length) {
          // All primitives - use actual values
          valStr = `${key}:[${primitives.join(',')}];`
        } else {
          // Mixed or all non-primitives - use structure only
          valStr = `${key}:[${val.length}];`
        }
      } else if (val && (val as NodeInstance).isBaseNode) {
        valStr = `${key}:${(val as NodeInstance).stableKey};`
      } else if (valType === 'function') {
        let hash = NodeUtil._propFuncCache.get(val as (...args: any[]) => any)
        if (!hash) {
          hash = NodeUtil.hashString(val.toString())
          NodeUtil._propFuncCache.set(val as (...args: any[]) => any, hash)
        }
        valStr = `${key}:${hash};`
      } else {
        // Include sorted keys for object structure signature
        const objKeys = Object.keys(val as Record<string, unknown>).sort()
        valStr = `${key}:{${objKeys.join(',')}};`
      }
      signatureParts.push(valStr)
    }

    return NodeUtil.hashString(signatureParts.join(','))
  }

  /**
   * Extracts "critical" props from a given set of props. Critical props are those
   * that are frequently used for styling or event handling, such as `on*` handlers,
   * `aria-*` attributes, `data-*` attributes, `css`, `className`, and `style`.
   * This method is used to optimize prop processing by focusing on props that are
   * most likely to influence rendering or behavior.
   * @param props The original props object.
   * @param keys The keys to process from the props object.
   * @returns An object containing only the critical props with an added count property.
   */
  public static extractCriticalProps(props: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const critical: Record<string, unknown> = { _keyCount: keys.length }
    let count = 0

    for (const k of keys) {
      if (count >= 50) break

      // Fast path: direct Set check first (O(1))
      if (NodeUtil.CRITICAL_PROPS.has(k)) {
        critical[k] = props[k]
        count++
        continue
      }

      // Inline prefix checks using charCode (faster than startsWith for short prefixes)
      const firstChar = k.charCodeAt(0)

      // Check 'on' prefix (111 = 'o', 110 = 'n')
      if (firstChar === 111 && k.charCodeAt(1) === 110) {
        critical[k] = props[k]
        count++
        continue
      }

      // Check 'aria' prefix (97 = 'a', 114 = 'r', 105 = 'i')
      if (firstChar === 97 && k.charCodeAt(1) === 114 && k.charCodeAt(2) === 105 && k.charCodeAt(3) === 97) {
        critical[k] = props[k]
        count++
        continue
      }

      // Check 'data' prefix (100 = 'd', 97 = 'a', 116 = 't')
      if (firstChar === 100 && k.charCodeAt(1) === 97 && k.charCodeAt(2) === 116 && k.charCodeAt(3) === 97) {
        critical[k] = props[k]
        count++
        continue
      }

      // Style prop check last (most expensive), only for smaller objects
      if (keys.length <= 100 && NodeUtil.isStyleProp(k)) {
        critical[k] = props[k]
        count++
      }
    }

    return critical
  }

  /**
   * The main prop processing pipeline. It separates cacheable and non-cacheable props,
   * generates a signature for caching, and assembles the final props object.
   * This method applies optimizations like fast-path for simple props and hybrid caching strategy.
   * @param rawProps The original props to process.
   * @param stableKey The stable key used for child normalization (optional).
   * @returns The processed props object ready for rendering.
   */
  public static processProps(rawProps: Partial<NodeProps> = {}, stableKey?: string): FinalNodeProps {
    const { ref, key, children, css, props: nativeProps = {}, disableEmotion, ...restRawProps } = rawProps

    // --- Fast Path Optimization ---
    if (Object.keys(restRawProps).length === 0 && !css) {
      return omitUndefined({
        ref,
        key,
        disableEmotion,
        nativeProps: omitUndefined(nativeProps),
        children: NodeUtil._processChildren(children, disableEmotion),
      })
    }

    // --- Hybrid Caching Strategy ---
    const cacheableProps: Record<string, unknown> = {}
    const nonCacheableProps: Record<string, unknown> = {}

    // 1. Categorize props into cacheable (primitives) and non-cacheable (objects/functions).
    // Optimization: Use Object.keys loop instead of for..in for better performance and safety
    const keys = Object.keys(restRawProps)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = (restRawProps as Record<string, unknown>)[key]
      const type = typeof value
      if (type === 'string' || type === 'number' || type === 'boolean') {
        cacheableProps[key] = value
      } else {
        nonCacheableProps[key] = value
      }
    }

    // 2. Pass element type to signature generation (still used for stableKey generation elsewhere, but not for caching here)
    // We removed caching, so we just compute CSS props directly.
    const cachedCssProps = getCSSProps(cacheableProps)

    // 3. Process non-cacheable props on every render to ensure correctness for functions and objects.
    const nonCachedCssProps = getCSSProps(nonCacheableProps)
    const domProps = getDOMProps(restRawProps) // DOM props are always processed fresh.

    // 4. Assemble the final CSS object.
    const finalCssProps = { ...cachedCssProps, ...nonCachedCssProps, ...css }

    // --- Child Normalization ---
    const normalizedChildren = NodeUtil._processChildren(children, disableEmotion, stableKey)

    // --- Final Assembly ---
    return omitUndefined({
      ref,
      key,
      css: finalCssProps,
      ...domProps,
      disableEmotion,
      nativeProps: omitUndefined(nativeProps),
      children: normalizedChildren,
    })
  }

  /**
   * Processes and normalizes children of the node.
   * Converts raw children (React elements, primitives, or other BaseNodes) into a consistent format.
   * Applies optimizations for single and multiple children scenarios.
   * @param children The raw children to process.
   * @param disableEmotion If true, emotion styling will be disabled for these children.
   * @param parentStableKey The stable key of the parent node, used for generating unique keys for children.
   * @returns The processed children in normalized format.
   */
  private static _processChildren(children: Children, disableEmotion?: boolean, parentStableKey?: string): Children {
    if (!children) return undefined
    if (typeof children === 'function') return children

    // Fast path for non-array (single child)
    if (!Array.isArray(children)) {
      return NodeUtil.processRawNode(children, disableEmotion, parentStableKey)
    }

    // Fast path for single element array
    if (children.length === 1) {
      return NodeUtil.processRawNode(children[0], disableEmotion, `${parentStableKey}_0`)
    }

    // General case: multiple children
    return children.map((child, index) => NodeUtil.processRawNode(child, disableEmotion, `${parentStableKey}_${index}`))
  }

  /**
   * Determines if a given `NodeInstance` should be cached.
   * Caching is enabled only on the client-side and if the node has both a `stableKey`
   * (indicating it's a stable, identifiable element) and `dependencies` (suggesting its render
   * output might be stable across re-renders if dependencies don't change).
   * @param node The `NodeInstance` to check for cacheability.
   * @returns `true` if the node should be cached, `false` otherwise.
   */
  public static shouldCacheElement<E extends NodeInstance>(node: E): node is E & { stableKey: string; dependencies: DependencyList } {
    return !NodeUtil.isServer && !!node.stableKey && !!node.dependencies
  }

  /**
   * Determines if a node should update based on its dependency array.
   * Uses a shallow comparison, similar to React's `useMemo` and `useCallback`.
   * On server environments, always returns true since SSR has no concept of re-renders.
   * @param prevDeps Previous dependency array to compare.
   * @param newDeps New dependency array to compare.
   * @param parentBlocked Flag indicating if the parent is blocked from updating.
   * @returns True if the node should update, false otherwise.
   */
  public static shouldNodeUpdate(prevDeps: DependencyList | undefined, newDeps: DependencyList | undefined, parentBlocked: boolean): boolean {
    // SSR has no concept of re-renders, so deps system doesn't apply
    if (NodeUtil.isServer) {
      return true
    }

    if (parentBlocked) {
      return false
    }
    // No deps array means always update.
    if (newDeps === undefined) {
      return true
    }
    // First render for this keyed component, or no previous deps.
    if (prevDeps === undefined) {
      return true
    }
    // Length change means update.
    if (newDeps.length !== prevDeps.length) {
      return true
    }
    // Shallow compare deps. If any have changed, update.
    for (let i = 0; i < newDeps.length; i++) {
      if (!Object.is(newDeps[i], prevDeps[i])) return true
    }

    // Deps are the same, no update needed.
    return false
  }

  /**
   * The core normalization function for a single child. It takes any valid `NodeElement`
   * (primitive, React element, function, `BaseNode` instance) and converts it into a standardized `BaseNode`
   * instance if it isn't one already. This ensures a consistent structure for the iterative renderer.
   * Handles various node types including primitives, BaseNode instances, function-as-children, React elements,
   * component classes, and component instances.
   * @param node The node element to process and normalize.
   * @param disableEmotion If true, emotion styling will be disabled for this node.
   * @param stableKey The stable key for positional information in parent-child relationships.
   * @returns The normalized node element in BaseNode format.
   */
  public static processRawNode(node: NodeElement, disableEmotion?: boolean, stableKey?: string): NodeElement {
    // Primitives and null/undefined are returned as-is.
    if (node === null || node === undefined || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return node

    // If it's already a BaseNode, clone it with a positional key if available.
    if (NodeUtil.isNodeInstance(node)) {
      const needsCloning = stableKey || (disableEmotion && !node.rawProps.disableEmotion)
      if (needsCloning) {
        // Create a new BaseNode instance.
        const newNode = new BaseNode(node.element, node.rawProps, node.dependencies)

        // Augment the internal stableKey with positional information.
        // This is purely for BaseNode's internal caching, not for React's 'key' prop.
        newNode.stableKey = `${stableKey}:${newNode.stableKey}`

        if (disableEmotion && !newNode.rawProps.disableEmotion) {
          newNode.rawProps.disableEmotion = true
        }
        return newNode
      }
      return node
    }

    // Handle function-as-a-child (render props).
    if (NodeUtil.isFunctionChild(node)) {
      return new BaseNode(NodeUtil.functionRenderer as NodeElementType, { props: { render: node, disableEmotion } }, undefined)
    }

    // Handle standard React elements.
    if (isValidElement(node)) {
      // Only extract style if it's a DOM element (string type)
      // For components, treat style as a normal prop
      if (typeof node.type === 'string') {
        const { style: childStyleObject, ...otherChildProps } = node.props as ComponentProps<ElementType>
        const combinedProps = { ...otherChildProps, ...(childStyleObject || {}) }
        return new BaseNode(
          node.type as ElementType,
          {
            ...combinedProps,
            ...(node.key !== null && node.key !== undefined ? { key: node.key } : {}),
            disableEmotion,
          },
          undefined,
        )
      }

      // For components, pass props as is
      return new BaseNode(
        node.type as ElementType,
        {
          ...(node.props as any),
          ...(node.key !== null && node.key !== undefined ? { key: node.key } : {}),
          disableEmotion,
        },
        undefined,
      )
    }

    // Handle component classes and memos.
    if (isReactClassComponent(node) || isMemo(node) || isForwardRef(node)) {
      return new BaseNode(node as ElementType, { disableEmotion }, undefined)
    }

    // Handle component instances.
    if (node instanceof React.Component) {
      return NodeUtil.processRawNode(node.render(), disableEmotion, stableKey)
    }

    return node
  }

  /**
   * A helper to reliably identify if a given function is a "function-as-a-child" (render prop)
   * rather than a standard Function Component.
   * Distinguishes between render prop functions and component functions by checking for React component signatures.
   * @param node The node to check.
   * @returns True if the node is a function-as-a-child, false otherwise.
   */
  public static isFunctionChild<E extends NodeElementType>(node: NodeElement): node is NodeFunction<E> {
    if (typeof node !== 'function' || isReactClassComponent(node) || isMemo(node) || isForwardRef(node)) return false
    try {
      return !(node.prototype && typeof node.prototype.render === 'function')
    } catch (error) {
      if (__DEBUG__) {
        console.error('MeoNode: Error checking if a node is a function child.', error)
      }
      return true
    }
  }

  /**
   * A special internal React component used to render "function-as-a-child" (render prop) patterns.
   * When a `BaseNode` receives a function as its `children` prop, it wraps that function
   * inside this `functionRenderer` component. This component then executes the render function
   * and processes its return value, normalizing it into a renderable ReactNode.
   *
   * This allows `BaseNode` to support render props while maintaining its internal processing
   * and normalization logic for the dynamically generated content.
   * @param render The function-as-a-child to execute.
   * @param disableEmotion Inherited flag to disable Emotion styling for children.
   * @returns The processed and rendered output of the render function, or null if an error occurs.
   */
  public static functionRenderer<E extends NodeElementType>({ render, disableEmotion }: FunctionRendererProps<E>): ReactNode | null | undefined {
    let result: NodeElement
    try {
      // Execute the render prop function to get its output.
      result = render()
    } catch (error) {
      if (__DEBUG__) {
        console.error('MeoNode: Error executing function-as-a-child.', error)
      }
      // If the render function throws, treat its output as null to prevent crashes.
      result = null
    }

    // Handle null, undefined, or primitive types results directly, as they are valid React render outputs.
    if (result === null || result === undefined || typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return result
    }

    // If the result is already a BaseNode instance, process it.
    if (NodeUtil.isNodeInstance(result)) {
      // If emotion is disabled for the parent and not explicitly re-enabled on the child,
      // create a new BaseNode with emotion disabled and render it.
      if (disableEmotion && !result.rawProps.disableEmotion) return new BaseNode(result.element, { ...result.rawProps, disableEmotion: true }).render()
      // Otherwise, render the existing BaseNode directly.
      return result.render()
    }

    // If the result is an array, it likely contains multiple children.
    if (Array.isArray(result)) {
      // Helper to generate a stable key for array items, crucial for React's reconciliation.
      const safeGetKey = (item: unknown, index: number) => {
        try {
          // Attempt to get a meaningful name for the element type.
          return `${getElementTypeName(item)}-${index}`
        } catch (error) {
          if (__DEBUG__) {
            console.error('MeoNode: Could not determine element type name for key in function-as-a-child.', error)
          }
          // Fallback to a generic key if type name cannot be determined.
          return `item-${index}`
        }
      }
      // Map over the array, processing each item and assigning a key.
      return result.map((item, index) =>
        NodeUtil.renderProcessedNode({ processedElement: NodeUtil.processRawNode(item, disableEmotion), passedKey: safeGetKey(item, index), disableEmotion }),
      )
    }

    // If the result is a React component instance (e.g., `new MyClassComponent()`).
    if (result instanceof React.Component) {
      return NodeUtil.renderProcessedNode({ processedElement: NodeUtil.processRawNode(result.render(), disableEmotion), disableEmotion })
    }

    // For any other non-primitive, non-array result, process it as a single NodeElement.
    const processedResult = NodeUtil.processRawNode(result as NodeElement, disableEmotion)
    // If processing yields a valid element, render it.
    if (processedResult) return NodeUtil.renderProcessedNode({ processedElement: processedResult, disableEmotion })
    // Fallback: return the original result if it couldn't be processed into a renderable node.
    return result as ReactNode
  }

  /**
   * Renders a processed `NodeElement` into a ReactNode.
   * This helper is primarily used by `functionRenderer` to handle the output of render props,
   * ensuring that `BaseNode` instances are correctly rendered and other React elements or primitives
   * are passed through. It also applies `disableEmotion` and `key` props as needed.
   *
   * This method is part of the child processing pipeline, converting internal `NodeElement` representations
   * into actual React elements that can be rendered by React.
   * @param processedElement The processed node element to render.
   * @param passedKey Optional key to apply to the rendered element.
   * @param disableEmotion Flag to disable emotion styling if needed.
   * @returns The rendered ReactNode.
   */
  public static renderProcessedNode({
    processedElement,
    passedKey,
    disableEmotion,
  }: {
    processedElement: NodeElement
    passedKey?: string
    disableEmotion?: boolean
  }) {
    // Initialize an object to hold common props that might be applied to the new BaseNode.
    const commonBaseNodeProps: Partial<NodeProps<ElementType>> = {}
    // If a `passedKey` is provided, add it to `commonBaseNodeProps`.
    // This key is typically used for React's reconciliation process.
    if (passedKey !== undefined) commonBaseNodeProps.key = passedKey

    // If the processed element is already a BaseNode instance.
    if (NodeUtil.isNodeInstance(processedElement)) {
      // Get the existing key from the raw props of the BaseNode.
      const existingKey = processedElement.rawProps?.key
      // Apply the `disableEmotion` flag to the raw props of the BaseNode.
      processedElement.rawProps.disableEmotion = disableEmotion
      // If the existing key is the same as the passed key, render the existing BaseNode directly.
      // This avoids unnecessary re-creation of the BaseNode instance.
      if (existingKey === passedKey) return processedElement.render()
      // Otherwise, create a new BaseNode instance, merging existing raw props with common props, then render it.
      return new BaseNode(processedElement.element, { ...processedElement.rawProps, ...commonBaseNodeProps }).render()
    }
    // If the processed element is a React class component (e.g., `class MyComponent extends React.Component`).
    // Create a new BaseNode for it, applying common props and `disableEmotion`, then render.
    if (isReactClassComponent(processedElement)) return new BaseNode(processedElement, { ...commonBaseNodeProps, disableEmotion }).render()
    // If the processed element is an instance of a React component (e.g., `new MyComponent()`).
    // Directly call its `render` method.
    if (processedElement instanceof React.Component) return processedElement.render()
    // If the processed element is a function (likely a functional component or a render prop that returned a component type).
    // Create a React element directly using `createElement`, passing the `passedKey`.
    if (typeof processedElement === 'function') return createElement(processedElement as ElementType, { key: passedKey })
    // For any other type (primitives, null, undefined, etc.), return it as a ReactNode.
    return processedElement as ReactNode
  }
}
