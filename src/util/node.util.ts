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
  NodePortal,
  PropProcessingCache,
} from '@src/types/node.type.js'
import { isForwardRef, isMemo, isReactClassComponent } from '@src/helper/react-is.helper.js'
import { getCSSProps, getDOMProps, getElementTypeName, omitUndefined } from '@src/helper/common.helper.js'
import { __DEBUG__ } from '@src/constant/common.const.js'
import { BaseNode } from '@src/core.node.js'
import { createRoot, type Root } from 'react-dom/client'

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

  // Caching css
  private static _cssCache = new WeakMap<object, string>()

  // Cache performance optimizations

  // Critical props for signature generation and shallow comparison
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
      typeof (obj as NodeInstance).render === 'function' &&
      typeof (obj as NodeInstance).toPortal === 'function' &&
      'isBaseNode' in obj
    )
  }

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
      h2 = (h2 * 33) ^ char
    }

    return `${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}`
  }

  /**
   * Generates a fast structural hash for CSS objects without full serialization.
   * This is an optimized hashing method that samples the first 10 keys for performance.
   * @param css The CSS object to hash.
   * @returns A hash string representing the CSS object structure.
   */
  private static hashCSS(css: Record<string, unknown>): string {
    const cached = this._cssCache.get(css)
    if (cached) return cached

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

    const result = hash.toString(36)
    this._cssCache.set(css, result)
    return result
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
        valStr = `${key}:${NodeUtil.hashString(val.toString())};`
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
   * Retrieves computed CSS props from the cache with LRU tracking.
   * Access time and hit count are tracked for smarter eviction.
   * Falls back to direct computation if no signature is provided or running on server.
   * @param cacheableProps The props to compute CSS properties from.
   * @param signature The cache signature to use for lookup.
   * @returns An object containing the CSS props.
   */
  public static getCachedCssProps(cacheableProps: Record<string, unknown>, signature?: string): { cssProps: Record<string, unknown> } {
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
   * This batch eviction approach improves performance by avoiding frequent cache cleanup operations.
   */
  private static _evictLRUEntries(): void {
    const now = Date.now()

    // Create max-heap (using min-heap with inverted comparison) to get highest scores first
    const evictionHeap = new MinHeap<{ key: string; score: number }>((a, b) => b.score - a.score)
    for (const [key, value] of BaseNode.propProcessingCache.entries()) {
      const score = this._calculateEvictionScore(value, now)
      evictionHeap.push({ key, score })
    }

    // O(log n) eviction of top N entries
    const targetSize = NodeUtil.CACHE_SIZE_LIMIT
    const currentSize = BaseNode.propProcessingCache.size
    // Remove enough to get back to limit, plus a buffer batch
    const countToRemove = Math.max(0, currentSize - targetSize) + NodeUtil.CACHE_CLEANUP_BATCH

    for (let i = 0; i < countToRemove; i++) {
      const item = evictionHeap.pop()
      if (item) {
        BaseNode.propProcessingCache.delete(item.key)
      } else {
        // No more items to evict
        break
      }
    }
  }

  /**
   * Calculates an eviction score based on age and frequency of access.
   * Higher scores mean more likelihood to be evicted.
   * The scoring system uses weighted factors: 30% recency and 70% frequency.
   * @param value The cache entry to score.
   * @param now The current timestamp for calculating age.
   * @returns A numeric score representing how likely the entry should be evicted.
   */
  private static _calculateEvictionScore(value: PropProcessingCache, now: number): number {
    const age = now - value.lastAccess
    const frequency = value.hitCount
    // Weighted scoring: recency 30%, frequency 70% - favors frequently accessed items
    return (age / 1000) * 0.3 + (1000 / (frequency + 1)) * 0.7
  }

  /**
   * The main prop processing pipeline. It separates cacheable and non-cacheable props,
   * generates a signature for caching, and assembles the final props object.
   * This method applies optimizations like fast-path for simple props and hybrid caching strategy.
   * @param element The element type for which props are being processed.
   * @param rawProps The original props to process.
   * @param stableKey The stable key used for child normalization (optional).
   * @returns The processed props object ready for rendering.
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
   * @param render The function-as-a-child to execute.
   * @param disableEmotion Inherited flag to disable Emotion styling for children.
   * @returns The processed and rendered output of the render function, or null if an error occurs.
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

  /**
   * Ensures that the necessary DOM element and React root are available for portal rendering.
   * This is only executed on the client-side.
   * Handles cleanup of stale infrastructure and creates new infrastructure as needed.
   * @param node The node instance that requires portal infrastructure.
   * @returns True if portal infrastructure is ready, false on server or if setup fails.
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

  /**
   * Cleans up portal infrastructure by unmounting the React root and removing the DOM element.
   * This ensures proper memory cleanup and prevents memory leaks.
   * @param infra The infrastructure object containing the DOM element and React root to clean up.
   */
  public static cleanupPortalInfra(infra: { domElement: HTMLDivElement; reactRoot: Root }) {
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

/**
 * A min-heap implementation for efficient priority queue operations.
 * Used for O(log n) eviction in the LRU cache system.
 */
class MinHeap<T> {
  private heap: T[] = []
  private comparator: (a: T, b: T) => number

  /**
   * Constructs a new MinHeap with the provided comparator function.
   * @param comparator A function that compares two elements and returns a negative value if the first is smaller,
   * zero if they are equal, or a positive value if the first is larger.
   */
  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator
  }

  /**
   * Returns the number of elements in the heap.
   * @returns The current size of the heap.
   */
  public size(): number {
    return this.heap.length
  }

  /**
   * Checks if the heap is empty.
   * @returns True if the heap has no elements, false otherwise.
   */
  public isEmpty(): boolean {
    return this.size() === 0
  }

  /**
   * Adds a new value to the heap and maintains the heap property by bubbling it up to the correct position.
   * @param value The value to add to the heap.
   */
  public push(value: T): void {
    this.heap.push(value)
    this.bubbleUp()
  }

  /**
   * Removes and returns the smallest element from the heap (the root).
   * After removal, it maintains the heap property by bubbling down the new root.
   * @returns The smallest element in the heap, or undefined if the heap is empty.
   */
  public pop(): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }

    this.swap(0, this.size() - 1)
    const value = this.heap.pop()
    this.bubbleDown()

    return value
  }

  /**
   * Moves the element at the specified index up the heap until the heap property is restored.
   * This is used after inserting a new element to maintain the heap structure.
   * @param index The index of the element to bubble up. Defaults to the last element in the heap.
   */
  private bubbleUp(index = this.size() - 1): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.comparator(this.heap[parentIndex], this.heap[index]) <= 0) {
        break
      }
      this.swap(parentIndex, index)
      index = parentIndex
    }
  }

  /**
   * Moves the element at the specified index down the heap until the heap property is restored.
   * This is used after removing the root element to maintain the heap structure.
   * @param index The index of the element to bubble down. Defaults to the root element (index 0).
   */
  private bubbleDown(index = 0): void {
    const lastIndex = this.size() - 1

    while (true) {
      const leftChildIndex = 2 * index + 1
      const rightChildIndex = 2 * index + 2
      let smallestIndex = index

      if (leftChildIndex <= lastIndex && this.comparator(this.heap[leftChildIndex], this.heap[smallestIndex]) < 0) {
        smallestIndex = leftChildIndex
      }

      if (rightChildIndex <= lastIndex && this.comparator(this.heap[rightChildIndex], this.heap[smallestIndex]) < 0) {
        smallestIndex = rightChildIndex
      }

      if (smallestIndex === index) {
        break
      }

      this.swap(index, smallestIndex)
      index = smallestIndex
    }
  }

  /**
   * Swaps the elements at the two specified indices in the heap array.
   * @param i The index of the first element to swap.
   * @param j The index of the second element to swap.
   */
  private swap(i: number, j: number): void {
    ;[this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]
  }
}
