import React, { type ComponentProps, type ElementType, type ReactNode, createElement, isValidElement } from 'react'
import type {
  FunctionRendererProps,
  NodeElement,
  NodeElementType,
  NodeFunction,
  NodeInstance,
  NodeProps,
  DependencyList,
  NodePortal,
  FinalNodeProps,
  Children,
} from '@src/types/node.type.js'
import { isForwardRef, isMemo, isReactClassComponent } from '@src/helper/react-is.helper.js'
import { getCSSProps, getDOMProps, getElementTypeName, omitUndefined } from '@src/helper/common.helper.js'
import { __DEBUG__ } from '@src/constants/common.const.js'
import { BaseNode } from '@src/core.node.js'
import { createRoot } from 'react-dom/client'

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
  private static _functionSignatureCache = new WeakMap<object, string>()

  // Cache configuration
  private static readonly CACHE_SIZE_LIMIT = 500
  private static readonly CACHE_CLEANUP_BATCH = 50 // Clean up 50 entries at once when limit hit

  // Critical props for signature generation and shallow comparison
  private static readonly CRITICAL_PROP_PREFIXES = new Set(['on', 'aria', 'data'])
  private static readonly CRITICAL_PROPS = new Set(['css', 'className', 'disableEmotion', 'props'])

  // Portal infrastructure using WeakMap for memory-safe management
  public static portalInfrastructure = new WeakMap<
    NodeInstance,
    {
      domElement: HTMLDivElement
      reactRoot: NodePortal & { render(children: React.ReactNode): void }
    }
  >()

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
  public static isNodeInstance = (obj: unknown): obj is NodeInstance => {
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
   * Determines if a given string `k` is a valid CSS style property.
   * This check is performed only on the client-side by checking if the property exists in `document.body.style`.
   * On the server-side, it always returns `false`.
   * @param k The string to check.
   */
  public static isStyleProp = !NodeUtil.isServer && typeof document !== 'undefined' ? (k: string) => k in document.body.style : () => false

  /**
   * Combines FNV-1a and djb2 hash functions for a more robust signature.
   * @method hashString
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
      h2 = (h2 * 33) ^ char
    }

    return `${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}`
  }

  /**
   * Performs a shallow equality check between two objects.
   * @method shallowEqual
   */
  public static shallowEqual(a: Record<string, any>, b: Record<string, any>): boolean {
    if (a === b) return true

    let countA = 0
    let countB = 0

    for (const key in a) {
      if (!(key in b) || a[key] !== b[key]) return false
      countA++
    }

    for (const _key in b) countB++

    return countA === countB
  }

  /**
   * Creates a unique, stable signature from the element type and props.
   * This signature includes the element's type to prevent collisions between different components
   * and handles primitive values in arrays and objects for better caching.
   * @method createPropSignature
   */
  public static createPropSignature(element: NodeElementType, props: Record<string, any>): string | undefined {
    if (NodeUtil.isServer) return undefined

    const elementId = getElementTypeName(element)

    const keys = Object.keys(props).sort()
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
      } else if (val && val.isBaseNode) {
        valStr = `${key}:${(val as NodeInstance).stableKey};`
      } else {
        // Include sorted keys for object structure signature
        const objKeys = Object.keys(val).sort()
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
   */
  public static extractCriticalProps(props: Record<string, any>, keys: string[]): Record<string, any> {
    const critical: Record<string, any> = { _keyCount: keys.length }
    let count = 0

    for (const k of keys) {
      if (count >= 50) break

      if (NodeUtil.CRITICAL_PROPS.has(k) || NodeUtil.isStyleProp(k) || Array.from(NodeUtil.CRITICAL_PROP_PREFIXES).some(prefix => k.startsWith(prefix))) {
        critical[k] = props[k]
        count++
      }
    }

    return critical
  }

  /**
   * Retrieves computed CSS props from the cache with LRU tracking.
   * Access time and hit count are tracked for smarter eviction.
   * @method getCachedCssProps
   */
  public static getCachedCssProps(cacheableProps: Record<string, any>, signature?: string): { cssProps: Record<string, any> } {
    if (NodeUtil.isServer || !signature) return { cssProps: getCSSProps(cacheableProps) }

    const cached = BaseNode.propProcessingCache.get(signature)

    if (cached) {
      // Update LRU metadata
      cached.lastAccess = Date.now()
      cached.hitCount++
      return { cssProps: cached.cssProps }
    }

    const cssProps = getCSSProps(cacheableProps)
    BaseNode.propProcessingCache.set(signature, {
      cssProps,
      signature,
      lastAccess: Date.now(),
      hitCount: 1,
    })

    // Batch cleanup for better performance
    if (BaseNode.propProcessingCache.size > NodeUtil.CACHE_SIZE_LIMIT && !BaseNode.scheduledCleanup) {
      BaseNode.scheduledCleanup = true

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(
          () => {
            NodeUtil._evictLRUEntries()
            BaseNode.scheduledCleanup = false
          },
          { timeout: 2000 },
        )
      } else {
        setTimeout(() => {
          NodeUtil._evictLRUEntries()
          BaseNode.scheduledCleanup = false
        }, 100)
      }
    }

    return { cssProps }
  }

  /**
   * Implements an LRU eviction strategy that removes multiple entries at once.
   * It uses a scoring system where older and less frequently used entries have a higher eviction priority.
   * @method _evictLRUEntries
   */
  private static _evictLRUEntries(): void {
    const now = Date.now()
    const entries: Array<{ key: string; score: number }> = []

    // Calculate eviction scores for all entries
    for (const [key, value] of BaseNode.propProcessingCache.entries()) {
      const age = now - value.lastAccess
      const frequency = value.hitCount

      // Score: older age + lower frequency = higher score (more likely to evict)
      // Normalize: age in seconds, frequency as inverse
      const score = age / 1000 + 1000 / (frequency + 1)
      entries.push({ key, score })
    }

    // Sort by score (highest = most evictable)
    entries.sort((a, b) => b.score - a.score)

    // Remove top N entries
    const toRemove = Math.min(NodeUtil.CACHE_CLEANUP_BATCH, entries.length)
    for (let i = 0; i < toRemove; i++) {
      BaseNode.propProcessingCache.delete(entries[i].key)
    }
  }

  /**
   * The main prop processing pipeline. It separates cacheable and non-cacheable props,
   * generates a signature for caching, and assembles the final props object.
   * @method processProps
   */
  public static processProps(element: NodeElementType, rawProps: Partial<NodeProps<NodeElementType>> = {}, stableKey?: string): FinalNodeProps {
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
    const cacheableProps: Record<string, any> = {}
    const nonCacheableProps: Record<string, any> = {}

    // 1. Categorize props into cacheable (primitives) and non-cacheable (objects/functions).
    for (const key in restRawProps) {
      if (Object.prototype.hasOwnProperty.call(restRawProps, key)) {
        const value = (restRawProps as Record<string, unknown>)[key]
        const type = typeof value
        if (type === 'string' || type === 'number' || type === 'boolean') {
          cacheableProps[key] = value
        } else {
          nonCacheableProps[key] = value
        }
      }
    }

    // 2. Pass element type to signature generation
    const signature = NodeUtil.createPropSignature(element, cacheableProps)
    const { cssProps: cachedCssProps } = NodeUtil.getCachedCssProps(cacheableProps, signature)

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
   * @param children The raw children to process.
   * @param disableEmotion If true, emotion styling will be disabled for these children.
   * @param parentStableKey The stable key of the parent node, used for generating unique keys for children.
   */
  private static _processChildren(children: Children, disableEmotion?: boolean, parentStableKey?: string): Children {
    if (!children) return undefined
    if (typeof children === 'function') return children
    return Array.isArray(children)
      ? children.map((child, index) => NodeUtil.processRawNode(child, disableEmotion, `${parentStableKey}_${index}`))
      : NodeUtil.processRawNode(children, disableEmotion, parentStableKey)
  }

  /**
   * Determines if a node should update based on its dependency array.
   * Uses a shallow comparison, similar to React's `useMemo` and `useCallback`.
   * @method shouldNodeUpdate
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
    if (newDeps.some((dep, i) => !Object.is(dep, prevDeps[i]))) {
      return true
    }

    // Deps are the same, no update needed.
    return false
  }

  /**
   * The core normalization function for a single child. It takes any valid `NodeElement`
   * (primitive, React element, function, `BaseNode` instance) and converts it into a standardized `BaseNode`
   * instance if it isn't one already. This ensures a consistent structure for the iterative renderer.
   * @method processRawNode
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
      const { style: childStyleObject, ...otherChildProps } = node.props as ComponentProps<any>
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
   * @method isFunctionChild
   */
  public static isFunctionChild<E extends NodeInstance | ReactNode>(node: NodeElement): node is NodeFunction<E> {
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
   * @method functionRenderer
   * @param {Object} props The properties passed to the renderer.
   * @param {Function} props.render The function-as-a-child to execute.
   * @param {boolean} [props.disableEmotion] Inherited flag to disable Emotion styling for children.
   * @returns {ReactNode | null | undefined} The processed and rendered output of the render function.
   */
  public static functionRenderer<E extends ReactNode | NodeInstance>({ render, disableEmotion }: FunctionRendererProps<E>): ReactNode | null | undefined {
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

    // Handle null or undefined results directly, as they are valid React render outputs.
    if (result === null || result === undefined) return result as never

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
      const safeGetKey = (item: any, index: number) => {
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
    if (result instanceof React.Component) {
      return NodeUtil.renderProcessedNode({ processedElement: NodeUtil.processRawNode(result.render(), disableEmotion), disableEmotion })
    }

    // Handle primitive types directly, as they are valid React children.
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') return result

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
   * @method renderProcessedNode
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
    const commonBaseNodeProps: Partial<NodeProps<any>> = {}
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

  /**
   * Ensures that the necessary DOM element and React root are available for portal rendering.
   * This is only executed on the client-side.
   * @method ensurePortalInfrastructure
   */
  public static ensurePortalInfrastructure(node: NodeInstance) {
    if (NodeUtil.isServer) return false

    let infra = NodeUtil.portalInfrastructure.get(node)

    // Check if infrastructure exists and is still connected
    if (infra?.domElement?.isConnected && infra?.reactRoot) {
      return true
    }

    // Clean up stale or disconnected infrastructure
    if (infra && (!infra.domElement?.isConnected || !infra.reactRoot)) {
      try {
        infra.reactRoot?.unmount?.()
      } catch (error) {
        if (__DEBUG__) {
          console.error('MeoNode: Error unmounting stale portal root.', error)
        }
      }
      NodeUtil.cleanupPortalInfra(infra)
      NodeUtil.portalInfrastructure.delete(node)
      infra = undefined
    }

    // Create new infrastructure
    const domElement = document.createElement('div')
    document.body.appendChild(domElement)

    const root = createRoot(domElement)
    const reactRoot = {
      render: root.render.bind(root),
      unmount: root.unmount.bind(root),
      update: () => {}, // Placeholder, will be overridden
    }

    infra = { domElement, reactRoot }
    NodeUtil.portalInfrastructure.set(node, infra)

    // Register for cleanup
    BaseNode.portalCleanupRegistry.register(node, { domElement, reactRoot }, node)

    return true
  }

  public static cleanupPortalInfra(infra: { domElement: HTMLDivElement; reactRoot: any }) {
    try {
      if (infra.reactRoot?.unmount) {
        infra.reactRoot.unmount()
      }
    } catch (error) {
      if (__DEBUG__) console.error('Portal cleanup error:', error)
    }

    try {
      if (infra.domElement?.isConnected) {
        infra.domElement.remove()
      }
    } catch (error) {
      if (__DEBUG__) console.error('DOM removal error:', error)
    }
  }
}
