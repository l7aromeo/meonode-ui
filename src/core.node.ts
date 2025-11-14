import React, {
  type ComponentProps,
  type ElementType,
  type ExoticComponent,
  type FragmentProps,
  type ReactElement,
  type ReactNode,
  createElement,
  isValidElement,
  Fragment,
} from 'react'
import type {
  Children,
  FinalNodeProps,
  FunctionRendererProps,
  HasRequiredProps,
  MergedProps,
  NodeElement,
  NodeElementType,
  NodeFunction,
  NodeInstance,
  NodePortal,
  NodeProps,
  PropProcessingCache,
  PropsOf,
  DependencyList,
} from '@src/types/node.type.js'
import { isNodeInstance } from '@src/helper/node.helper.js'
import { isForwardRef, isFragment, isMemo, isReactClassComponent, isValidElementType } from '@src/helper/react-is.helper.js'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, hasNoStyleTag, omitUndefined } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'
import { __DEV__ } from '@src/constants/common.const.js'

/**
 * The core abstraction of the MeoNode library. It wraps a React element or component,
 * providing a unified interface for processing props, normalizing children, and handling styles.
 * This class is central to the library's ability to offer a JSX-free, fluent API for building UIs.
 * It uses an iterative rendering approach to handle deeply nested structures without causing stack overflows.
 * @class BaseNode
 * @template E - The type of React element or component this node represents.
 */
export class BaseNode<E extends NodeElementType> implements NodeInstance<E> {
  public element: E
  public rawProps: Partial<NodeProps<E>> = {}
  public readonly isBaseNode = true

  private _props?: FinalNodeProps
  private _portalDOMElement: HTMLDivElement | null = null
  private _portalReactRoot: (NodePortal & { render(children: React.ReactNode): void }) | null = null
  private _stableKey: string
  private readonly _deps?: DependencyList

  private static _isServer = typeof window === 'undefined'
  private static _propProcessingCache = new Map<string, PropProcessingCache>()
  private static _elementCache = new Map<any, { prevDeps?: DependencyList; cachedElement?: ReactElement<FinalNodeProps> }>()
  private static _isValidElement = isValidElementType
  private static _isStyleProp = !BaseNode._isServer && typeof document !== 'undefined' ? (k: string) => k in document.body.style : () => false

  // Cache configuration
  private static readonly CACHE_SIZE_LIMIT = 500
  private static readonly CACHE_CLEANUP_BATCH = 50 // Clean up 50 entries at once when limit hit

  // Cache helpers: retain the previous props reference and its computed signature so
  // repeated processing can quickly detect unchanged props and avoid expensive recomputation.
  private _lastPropsRef: unknown = null
  private _lastSignature: string = ''

  constructor(element: E, rawProps: Partial<NodeProps<E>> = {}, deps?: DependencyList) {
    // Element type validation is performed once at construction to prevent invalid nodes from being created.
    if (!BaseNode._isValidElement(element)) {
      const elementType = getComponentType(element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }
    this.element = element
    this.rawProps = rawProps
    this._deps = deps

    // Generate an initial stable key used for internal caching.
    // Exclude React's `key`, `ref`, and `children` from the signature so positional or ref changes
    // do not unintentionally affect the component's cache identity.
    const { key, children, ref, ...propsForSignature } = rawProps
    this._stableKey = this._getCachedSignature(propsForSignature)

    // If a React 'key' prop was explicitly provided by the user, prepend it to our internal stable key.
    // This ensures that if the user provides a key, it influences our internal cache key,
    // but our internal key is still unique even if the user's key is not.
    if (key !== undefined && key !== null) {
      this._stableKey = `${String(key)}:${this._stableKey}`
    }
  }

  /**
   * Lazily processes and retrieves the final, normalized props for the node.
   * The props are processed only once and then cached for subsequent accesses.
   * @getter props
   */
  public get props(): FinalNodeProps {
    if (!this._props) {
      this._props = this._processProps()
    }
    return this._props
  }

  /**
   * Returns the dependency list associated with this node.
   * Used by the renderer to decide if the node (and subtree) should update.
   * Mirrors React hook semantics: `undefined` means always update; when an
   * array is provided a shallow comparison against previous deps determines
   * whether a re-render is required.
   * @getter deps
   */
  public get dependencies(): DependencyList | undefined {
    return this._deps
  }

  // --- Enhanced Prop Caching and Processing ---

  /**
   * FNV-1a hash function.
   * @method _fnv1aHash
   */
  private static _fnv1aHash(str: string): number {
    let hash = 2166136261 // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 16777619) // FNV prime
    }
    return hash >>> 0 // Convert to unsigned 32-bit integer
  }

  /**
   * djb2 hash function.
   * @method _djb2Hash
   */
  private static _djb2Hash(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i)
    }
    return hash >>> 0 // Convert to unsigned 32-bit integer
  }

  /**
   * Combines FNV-1a and djb2 hash functions for a more robust signature.
   * @method _hashString
   */
  private static _hashString(str: string): string {
    const fnvHash = BaseNode._fnv1aHash(str)
    const djb2Hash = BaseNode._djb2Hash(str)
    return `${fnvHash.toString(36)}_${djb2Hash.toString(36)}` // Combine and convert to base36
  }

  /**
   * Generates or returns a cached signature representing the props shape and values.
   * The signature is used as a stable key for caching prop-derived computations (e.g. CSS extraction).
   * - Uses a fast reference check to return the previous signature if the same props object is passed.
   * - For very large prop objects (> 100 keys) it builds a smaller "criticalProps" fingerprint
   * containing only style-related keys, event handlers, className/css and a `_keyCount` to avoid
   * expensive serialization of huge objects while still retaining reasonable cache discrimination.
   * - Stores the last props reference and computed signature to speed up repeated calls with the same object.
   * @param props The props object to create a signature for.
   * @returns A compact string signature suitable for use as a cache key.
   */
  private _getCachedSignature(props: Record<string, any>): string {
    if (props === this._lastPropsRef) {
      return this._lastSignature
    }

    const keys = Object.keys(props)
    const keyCount = keys.length

    if (keyCount > 100) {
      const criticalProps: Record<string, any> = { _keyCount: keyCount }

      for (const k of keys) {
        if (BaseNode._isStyleProp(k) || k === 'css' || k === 'className' || k.startsWith('on')) {
          criticalProps[k] = props[k]
        }
      }

      this._lastSignature = BaseNode._createPropSignature(this.element, criticalProps)

      if (__DEV__ && keyCount > 200) {
        console.warn(`MeoNode: Large props (${keyCount} keys) on "${getElementTypeName(this.element)}". Consider splitting.`)
      }
    } else {
      this._lastSignature = BaseNode._createPropSignature(this.element, props)
    }

    this._lastPropsRef = props
    return this._lastSignature
  }

  /**
   * Creates a unique, stable signature from the element type and props.
   * This signature includes the element's type to prevent collisions between different components
   * and handles primitive values in arrays and objects for better caching.
   * @method _createPropSignature
   */
  private static _createPropSignature(element: NodeElementType, props: Record<string, any>): string {
    // Safe element identification that works with Next.js Client Components
    let elementName: string

    try {
      // Try to get element name safely
      if (typeof element === 'string') {
        elementName = element
      } else if (typeof element === 'function') {
        // Use a stable identifier without accessing component internals
        // This prevents Next.js proxy errors for Client Components
        elementName = element.name || 'Component'
      } else if (element && typeof element === 'object') {
        // Handle exotic components (Fragment, Memo, ForwardRef, etc.)
        elementName = (element as any).displayName || (element as any).name || 'ExoticComponent'
      } else {
        elementName = 'Unknown'
      }
    } catch (error) {
      if (__DEV__) {
        console.error('MeoNode: Could not determine element name for signature.', error)
      }
      // Fallback for Client Components that throw when accessed
      // Use a generic identifier - this is safe because we still have props in the signature
      elementName = 'ClientComponent'
    }

    const keys = Object.keys(props).sort()
    let signatureStr = `${elementName}:`

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
      } else {
        // Include sorted keys for object structure signature
        const objKeys = Object.keys(val).sort()
        valStr = `${key}:{${objKeys.join(',')}};`
      }
      signatureStr += valStr
    }

    return BaseNode._hashString(signatureStr)
  }

  /**
   * Retrieves computed CSS props from the cache with LRU tracking.
   * Access time and hit count are tracked for smarter eviction.
   * @method _getCachedCssProps
   */
  private static _getCachedCssProps(cacheableProps: Record<string, any>, signature: string): { cssProps: Record<string, any> } {
    const cached = BaseNode._propProcessingCache.get(signature)

    if (cached) {
      // Update LRU metadata
      cached.lastAccess = Date.now()
      cached.hitCount++
      return { cssProps: cached.cssProps }
    }

    const cssProps = getCSSProps(cacheableProps)
    BaseNode._propProcessingCache.set(signature, {
      cssProps,
      signature,
      lastAccess: Date.now(),
      hitCount: 1,
    })

    // Batch cleanup for better performance
    if (BaseNode._propProcessingCache.size > BaseNode.CACHE_SIZE_LIMIT) {
      BaseNode._evictLRUEntries()
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
    for (const [key, value] of BaseNode._propProcessingCache.entries()) {
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
    const toRemove = Math.min(BaseNode.CACHE_CLEANUP_BATCH, entries.length)
    for (let i = 0; i < toRemove; i++) {
      BaseNode._propProcessingCache.delete(entries[i].key)
    }
  }

  /**
   * The main prop processing pipeline, which now passes the element type for improved caching.
   * @method _processProps
   */
  private _processProps(): FinalNodeProps {
    const { ref, key, children, css, props: nativeProps = {}, disableEmotion, ...restRawProps } = this.rawProps

    // --- Fast Path Optimization ---
    if (Object.keys(restRawProps).length === 0 && !css) {
      return omitUndefined({
        ref,
        key,
        disableEmotion,
        nativeProps: omitUndefined(nativeProps),
        children: this._processChildren(children, disableEmotion),
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
    const signature = BaseNode._createPropSignature(this.element, cacheableProps)
    const { cssProps: cachedCssProps } = BaseNode._getCachedCssProps(cacheableProps, signature)

    // 3. Process non-cacheable props on every render to ensure correctness for functions and objects.
    const nonCachedCssProps = getCSSProps(nonCacheableProps)
    const domProps = getDOMProps(restRawProps) // DOM props are always processed fresh.

    // 4. Assemble the final CSS object.
    const finalCssProps = { ...cachedCssProps, ...nonCachedCssProps, ...css }

    // --- Child Normalization ---
    const normalizedChildren = this._processChildren(children, disableEmotion, this._stableKey)

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
   * Determines if a node should update based on its dependency array.
   * Uses a shallow comparison, similar to React's `useMemo` and `useCallback`.
   * @method _shouldNodeUpdate
   */
  private static _shouldNodeUpdate(prevDeps: DependencyList | undefined, newDeps: DependencyList | undefined, parentBlocked: boolean): boolean {
    // SSR has no concept of re-renders, so deps system doesn't apply
    if (BaseNode._isServer) {
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

  // --- Child Processing ---

  /**
   * Processes the `children` prop of a node. It handles single children, arrays of children,
   * and function-as-a-child render props, passing them to `_processRawNode` for normalization.
   * @method _processChildren
   */
  private _processChildren(children: Children, disableEmotion?: boolean, parentStableKey?: string): Children {
    if (!children) return undefined
    if (typeof children === 'function') return children
    return Array.isArray(children)
      ? children.map((child, index) => BaseNode._processRawNode(child, disableEmotion, `${parentStableKey}_${index}`))
      : BaseNode._processRawNode(children, disableEmotion, parentStableKey)
  }

  /**
   * The core normalization function for a single child. It takes any valid `NodeElement`
   * (primitive, React element, function, `BaseNode` instance) and converts it into a standardized `BaseNode`
   * instance if it isn't one already. This ensures a consistent structure for the iterative renderer.
   * @method _processRawNode
   */
  private static _processRawNode(node: NodeElement, disableEmotion?: boolean, stableKey?: string): NodeElement {
    // Primitives and null/undefined are returned as-is.
    if (node === null || node === undefined || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return node

    // If it's already a BaseNode, clone it with a positional key if available.
    if (isNodeInstance(node)) {
      const needsCloning = stableKey || (disableEmotion && !node.rawProps.disableEmotion)
      if (needsCloning) {
        // Create a new BaseNode instance.
        const newNode = new BaseNode(node.element, node.rawProps, node.dependencies)

        // Augment the internal _stableKey with positional information.
        // This is purely for BaseNode's internal caching, not for React's 'key' prop.
        newNode._stableKey = `${stableKey}:${newNode._stableKey}`

        if (disableEmotion && !newNode.rawProps.disableEmotion) {
          newNode.rawProps.disableEmotion = true
        }
        return newNode
      }
      return node
    }

    // Handle function-as-a-child (render props).
    if (BaseNode._isFunctionChild(node)) {
      return new BaseNode(BaseNode._functionRenderer as NodeElementType, { props: { render: node, disableEmotion } }, undefined)
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
      return BaseNode._processRawNode(node.render(), disableEmotion, stableKey)
    }

    return node
  }

  /**
   * A helper to reliably identify if a given function is a "function-as-a-child" (render prop)
   * rather than a standard Function Component.
   * @method _isFunctionChild
   */
  private static _isFunctionChild<E extends NodeInstance | ReactNode>(node: NodeElement): node is NodeFunction<E> {
    if (typeof node !== 'function' || isReactClassComponent(node) || isMemo(node) || isForwardRef(node)) return false
    try {
      return !(node.prototype && typeof node.prototype.render === 'function')
    } catch (error) {
      if (__DEV__) {
        console.error('MeoNode: Error checking if a node is a function child.', error)
      }
      return true
    }
  }

  /**
   * A special internal React component used to render "function-as-a-child" (render prop) patterns.
   * When a `BaseNode` receives a function as its `children` prop, it wraps that function
   * inside this `_functionRenderer` component. This component then executes the render function
   * and processes its return value, normalizing it into a renderable ReactNode.
   *
   * This allows `BaseNode` to support render props while maintaining its internal processing
   * and normalization logic for the dynamically generated content.
   * @method _functionRenderer
   * @param {Object} props The properties passed to the renderer.
   * @param {Function} props.render The function-as-a-child to execute.
   * @param {boolean} [props.disableEmotion] Inherited flag to disable Emotion styling for children.
   * @returns {ReactNode | null | undefined} The processed and rendered output of the render function.
   */
  private static _functionRenderer<E extends ReactNode | NodeInstance>({ render, disableEmotion }: FunctionRendererProps<E>): ReactNode | null | undefined {
    let result: NodeElement
    try {
      // Execute the render prop function to get its output.
      result = render()
    } catch (error) {
      if (__DEV__) {
        console.error('MeoNode: Error executing function-as-a-child.', error)
      }
      // If the render function throws, treat its output as null to prevent crashes.
      result = null
    }

    // Handle null or undefined results directly, as they are valid React render outputs.
    if (result === null || result === undefined) return result as never

    // If the result is already a BaseNode instance, process it.
    if (isNodeInstance(result)) {
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
          if (__DEV__) {
            console.error('MeoNode: Could not determine element type name for key in function-as-a-child.', error)
          }
          // Fallback to a generic key if type name cannot be determined.
          return `item-${index}`
        }
      }
      // Map over the array, processing each item and assigning a key.
      return result.map((item, index) =>
        BaseNode._renderProcessedNode({ processedElement: BaseNode._processRawNode(item, disableEmotion), passedKey: safeGetKey(item, index) }),
      )
    }
    if (result instanceof React.Component) {
      return BaseNode._renderProcessedNode({ processedElement: BaseNode._processRawNode(result.render(), disableEmotion), disableEmotion })
    }

    // Handle primitive types directly, as they are valid React children.
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') return result

    // For any other non-primitive, non-array result, process it as a single NodeElement.
    const processedResult = BaseNode._processRawNode(result as NodeElement, disableEmotion)
    // If processing yields a valid element, render it.
    if (processedResult) return BaseNode._renderProcessedNode({ processedElement: processedResult, disableEmotion })
    // Fallback: return the original result if it couldn't be processed into a renderable node.
    return result as ReactNode
  }

  /**
   * Renders a processed `NodeElement` into a ReactNode.
   * This helper is primarily used by `_functionRenderer` to handle the output of render props,
   * ensuring that `BaseNode` instances are correctly rendered and other React elements or primitives
   * are passed through. It also applies `disableEmotion` and `key` props as needed.
   *
   * This method is part of the child processing pipeline, converting internal `NodeElement` representations
   * into actual React elements that can be rendered by React.
   * @method _renderProcessedNode
   */
  private static _renderProcessedNode({
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
    if (isNodeInstance(processedElement)) {
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

  // --- Iterative Renderer with Deps Support ---

  /**
   * Renders the `BaseNode` and its entire subtree into a ReactElement, with support for opt-in reactivity
   * via dependency arrays and inherited blocking.
   *
   * This method uses an **iterative (non-recursive) approach** with a manual work stack.
   * This is a crucial architectural choice to prevent "Maximum call stack size exceeded" errors
   * when rendering very deeply nested component trees, a common limitation of naive recursive rendering.
   *
   * The process works in two phases for each node:
   * 1. **Begin Phase:** When a node is first visited, its children are pushed onto the stack. This ensures a bottom-up build.
   * 2. **Complete Phase:** After all of a node's descendants have been rendered, the loop returns to the node.
   *    It then collects the rendered children from a temporary map and creates its own React element.
   * @method render
   */
  public render(parentBlocked: boolean = false): ReactElement<FinalNodeProps> {
    // A stable cache key derived from the element + important props signature.
    const cacheKey = this._stableKey

    // On server we never reuse cached elements because that can cause hydration mismatches.
    const cacheEntry = BaseNode._isServer ? undefined : BaseNode._elementCache.get(cacheKey)

    // Decide whether this node (and its subtree) should update given dependency arrays.
    const shouldUpdate = BaseNode._shouldNodeUpdate(cacheEntry?.prevDeps, this._deps, parentBlocked)

    // Fast return: if nothing should update and we have a cached element, reuse it.
    if (!shouldUpdate && cacheEntry?.cachedElement) {
      return cacheEntry.cachedElement
    }

    // When this node doesn't need update, its children are considered "blocked" and may be skipped.
    const childrenBlocked = !shouldUpdate

    // Work stack for iterative, non-recursive traversal.
    // Each entry tracks the BaseNode, whether its children were pushed (isProcessed) and whether it is blocked.
    const workStack: { node: BaseNode<any>; isProcessed: boolean; blocked: boolean }[] = [{ node: this, isProcessed: false, blocked: childrenBlocked }]
    // Map to collect rendered React elements for processed BaseNode instances.
    const renderedElements = new Map<BaseNode<any>, ReactElement>()

    // Iterative depth-first traversal with explicit begin/complete phases to avoid recursion.
    while (workStack.length > 0) {
      const currentWork = workStack[workStack.length - 1]
      const { node, isProcessed, blocked } = currentWork

      if (!isProcessed) {
        // Begin phase: mark processed and push child BaseNodes onto the stack (in reverse order)
        currentWork.isProcessed = true
        const children = node.props.children

        if (children) {
          // Only consider BaseNode children for further traversal; primitives and React elements are terminal.
          const childrenToProcess = (Array.isArray(children) ? children : [children]).filter(isNodeInstance)

          for (let i = childrenToProcess.length - 1; i >= 0; i--) {
            const child = childrenToProcess[i]
            const childCacheKey = child._stableKey

            // Respect server/client differences for child cache lookup.
            const childCacheEntry = BaseNode._isServer ? undefined : BaseNode._elementCache.get(childCacheKey)

            // Determine whether the child should update given its deps and the parent's blocked state.
            const childShouldUpdate = BaseNode._shouldNodeUpdate(childCacheEntry?.prevDeps, child._deps, blocked)

            // If child doesn't need update and has cached element, reuse it immediately (no push).
            if (!childShouldUpdate && childCacheEntry?.cachedElement) {
              renderedElements.set(child, childCacheEntry.cachedElement)
              continue
            }

            // Otherwise push child for processing; childBlocked inherits parent's blocked state.
            const childBlocked = blocked || !childShouldUpdate
            workStack.push({ node: child, isProcessed: false, blocked: childBlocked })
          }
        }
      } else {
        // Complete phase: all descendants have been processed; build this node's React element.
        workStack.pop()

        // Extract node props. Non-present props default to undefined via destructuring.
        const { children: childrenInProps, key, css, nativeProps, disableEmotion, ...otherProps } = node.props
        let finalChildren: ReactNode[] = []

        if (childrenInProps) {
          // Convert child placeholders into concrete React nodes:
          // - If it's a BaseNode, lookup its rendered ReactElement from the map.
          // - If it's already a React element, use it directly.
          // - Otherwise treat as primitive ReactNode.
          finalChildren = (Array.isArray(childrenInProps) ? childrenInProps : [childrenInProps]).map(child => {
            if (isNodeInstance(child)) return renderedElements.get(child)!
            if (isValidElement(child)) return child
            return child as ReactNode
          })
        }

        // Merge element props: explicit other props + DOM native props + React key.
        const elementProps = { ...(otherProps as ComponentProps<ElementType>), key, ...nativeProps }
        let element: ReactElement<FinalNodeProps>

        // Handle fragments specially: create fragment element with key and children.
        if (node.element === Fragment || isFragment(node.element)) {
          element = createElement(node.element as ExoticComponent<FragmentProps>, { key }, ...finalChildren)
        } else {
          // StyledRenderer for emotion-based styling unless explicitly disabled or no styles are present.
          // StyledRenderer handles SSR hydration and emotion CSS injection when css prop exists or element has style tags.
          const isStyledComponent = !disableEmotion && (css || !hasNoStyleTag(node.element))
          if (isStyledComponent) {
            element = createElement(StyledRenderer, { element: node.element, ...elementProps, css, suppressHydrationWarning: true }, ...finalChildren)
          } else {
            element = createElement(node.element as ElementType, elementProps, ...finalChildren)
          }
        }

        // Cache the generated element on client-side to speed up future renders.
        if (!BaseNode._isServer) {
          BaseNode._elementCache.set(node._stableKey, {
            prevDeps: node._deps,
            cachedElement: element,
          })
        }

        // Store the rendered element so parent nodes can reference it.
        renderedElements.set(node, element)
      }
    }

    // Return the ReactElement corresponding to the root node (this).
    return renderedElements.get(this) as ReactElement<FinalNodeProps>
  }

  // --- Portal System ---

  /**
   * Ensures that the necessary DOM element and React root are available for portal rendering.
   * This is only executed on the client-side.
   * @method _ensurePortalInfrastructure
   */
  private _ensurePortalInfrastructure() {
    if (BaseNode._isServer) return false
    if (this._portalDOMElement && this._portalReactRoot && this._portalDOMElement.isConnected) return true

    if (this._portalDOMElement && !this._portalDOMElement.isConnected) {
      if (this._portalReactRoot) {
        try {
          this._portalReactRoot.unmount()
        } catch (error) {
          if (__DEV__) {
            console.error('MeoNode: Error unmounting disconnected portal root.', error)
          }
        }
        this._portalReactRoot = null
      }
      this._portalDOMElement = null
    }

    if (!this._portalDOMElement) {
      this._portalDOMElement = document.createElement('div')
      document.body.appendChild(this._portalDOMElement)
    }

    if (!this._portalReactRoot) {
      if (!this._portalDOMElement) return false
      const root = createRoot(this._portalDOMElement)
      this._portalReactRoot = { render: root.render.bind(root), unmount: root.unmount.bind(root), update: () => {} }
    }

    return true
  }

  /**
   * Renders the node into a React Portal, mounting it directly under `document.body`.
   * Returns a handle with `update` and `unmount` methods to control the portal's lifecycle.
   * @method toPortal
   */
  public toPortal(): NodePortal {
    if (!this._ensurePortalInfrastructure() || !this._portalReactRoot) {
      throw new Error('toPortal() can only be called in a client-side environment where document.body is available.')
    }

    const renderCurrent = () => {
      try {
        this._portalReactRoot!.render(this.render())
      } catch (error) {
        if (__DEV__) {
          console.error('MeoNode: Error rendering initial portal content.', error)
        }
      }
    }
    renderCurrent()

    try {
      const originalUnmount = this._portalReactRoot.unmount.bind(this._portalReactRoot)
      const handle = this._portalReactRoot as ReactDOMRoot & { update: (next: NodeElement) => void; unmount: () => void }

      handle.update = (next: NodeElement) => {
        try {
          if (!this._portalReactRoot) return
          const content = isNodeInstance(next) ? next.render() : (next as ReactNode)
          this._portalReactRoot.render(content)
        } catch (error) {
          if (__DEV__) {
            console.error('MeoNode: Error updating portal content.', error)
          }
        }
      }

      handle.unmount = () => {
        try {
          originalUnmount()
        } catch (error) {
          if (__DEV__) {
            console.error('MeoNode: Error unmounting portal root.', error)
          }
        }
        if (this._portalDOMElement) {
          try {
            if (this._portalDOMElement.parentNode) this._portalDOMElement.parentNode.removeChild(this._portalDOMElement)
          } catch (error) {
            if (__DEV__) {
              console.error('MeoNode: Error removing portal DOM element.', error)
            }
          }
          this._portalDOMElement = null
        }
        this._portalReactRoot = null
      }
      return handle
    } catch (error) {
      if (__DEV__) {
        console.error('MeoNode: Error creating portal handle.', error)
      }
      return this._portalReactRoot
    }
  }

  /**
   * A static method to clear all internal caches.
   * @method clearCaches
   */
  public static clearCaches() {
    BaseNode._propProcessingCache.clear()
    BaseNode._elementCache.clear()
  }
}

// --- Factory Functions ---

/**
 * The primary factory function for creating a `BaseNode` instance.
 * It's the simplest way to wrap a component or element.
 * @function Node
 */
export function Node<AdditionalProps extends Record<string, any>, E extends NodeElementType>(
  element: E,
  props: MergedProps<E, AdditionalProps> = {} as MergedProps<E, AdditionalProps>,
  deps?: DependencyList,
): NodeInstance<E> {
  return new BaseNode(element, props as NodeProps<E>, deps)
}

/**
 * Creates a curried node factory for a given React element or component type.
 * This is useful for creating reusable, specialized factory functions (e.g., `const Div = createNode('div')`).
 * @function createNode
 */
export function createNode<AdditionalInitialProps extends Record<string, any>, E extends NodeElementType>(
  element: E,
  initialProps?: MergedProps<E, AdditionalInitialProps>,
): HasRequiredProps<PropsOf<E>> extends true
  ? (<AdditionalProps extends Record<string, any> = Record<string, any>>(props: MergedProps<E, AdditionalProps>, deps?: DependencyList) => NodeInstance<E>) & {
      element: E
    }
  : (<AdditionalProps extends Record<string, any> = Record<string, any>>(props?: MergedProps<E, AdditionalProps>, deps?: DependencyList) => NodeInstance<E>) & {
      element: E
    } {
  const Instance = <AdditionalProps extends Record<string, any> = Record<string, any>>(props?: MergedProps<E, AdditionalProps>, deps?: DependencyList) =>
    Node(element, { ...initialProps, ...props } as NodeProps<E> & AdditionalProps, deps)
  Instance.element = element
  return Instance as any
}

/**
 * Creates a node factory function where the first argument is `children` and the second is `props`.
 * This provides a more ergonomic API for components that primarily wrap content (e.g., `P('Some text')`).
 * @function createChildrenFirstNode
 */
export function createChildrenFirstNode<AdditionalInitialProps extends Record<string, any>, E extends NodeElementType>(
  element: E,
  initialProps?: Omit<NodeProps<E>, keyof AdditionalInitialProps | 'children'> & AdditionalInitialProps,
): HasRequiredProps<PropsOf<E>> extends true
  ? (<AdditionalProps extends Record<string, any> = Record<string, any>>(
      children: Children,
      props: Omit<MergedProps<E, AdditionalProps>, 'children'>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & { element: E }
  : (<AdditionalProps extends Record<string, any> = Record<string, any>>(
      children?: Children,
      props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & { element: E } {
  const Instance = <AdditionalProps extends Record<string, any> = Record<string, any>>(
    children?: Children,
    props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
    deps?: DependencyList,
  ) => Node(element, { ...initialProps, ...props, children } as NodeProps<E> & AdditionalProps, deps)
  Instance.element = element
  return Instance as any
}
