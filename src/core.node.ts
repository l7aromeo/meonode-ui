import {
  type ComponentProps,
  createElement,
  type ElementType,
  type ExoticComponent,
  Fragment,
  type FragmentProps,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import type {
  Children,
  DependencyList,
  ElementCacheEntry,
  FinalNodeProps,
  HasRequiredProps,
  MergedProps,
  NodeElement,
  NodeElementType,
  NodeInstance,
  NodePortal,
  NodeProps,
  PropsOf,
  WorkItem,
} from '@src/types/node.type.js'
import { isFragment, isValidElementType } from '@src/helper/react-is.helper.js'
import { getComponentType, getElementTypeName, hasNoStyleTag, getGlobalState } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'
import { __DEBUG__ } from '@src/constant/common.const.js'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'
import MeoNodeUnmounter from '@src/components/meonode-unmounter.client.js'
import { NavigationCacheManagerUtil } from '@src/util/navigation-cache-manager.util.js'
import { NodeUtil } from '@src/util/node.util.js'

const ELEMENT_CACHE_KEY = Symbol.for('@meonode/ui/BaseNode/elementCache')
const NAVIGATION_STARTED_KEY = Symbol.for('@meonode/ui/BaseNode/navigationStarted')
const RENDER_CONTEXT_POOL_KEY = Symbol.for('@meonode/ui/BaseNode/renderContextPool')
const CACHE_CLEANUP_REGISTRY_KEY = Symbol.for('@meonode/ui/BaseNode/cacheCleanupRegistry')
const PORTAL_CLEANUP_REGISTRY_KEY = Symbol.for('@meonode/ui/BaseNode/portalCleanupRegistry')

/**
 * The core abstraction of the MeoNode library. It wraps a React element or component,
 * providing a unified interface for processing props, normalizing children, and handling styles.
 * This class is central to the library's ability to offer a JSX-free, fluent API for building UIs.
 * It uses an iterative rendering approach to handle deeply nested structures without causing stack overflows.
 * @template E - The type of React element or component this node represents.
 */
export class BaseNode<E extends NodeElementType = NodeElementType> {
  public instanceId: string = Math.random().toString(36).slice(2) + Date.now().toString(36)

  public element: E
  public rawProps: Partial<NodeProps<E>> = {}
  public readonly isBaseNode = true

  private _props?: FinalNodeProps
  private readonly _deps?: DependencyList
  public stableKey?: string

  // Cached reference to the previous props object for cheap identity checks.
  lastPropsObj?: Record<string, unknown>
  // The last computed signature for the props object.
  lastSignature?: string

  public static get elementCache() {
    return getGlobalState(ELEMENT_CACHE_KEY, () => new Map<string, ElementCacheEntry>())
  }

  // Navigation tracking
  private static get _navigationStarted() {
    return getGlobalState(NAVIGATION_STARTED_KEY, () => ({ value: false })).value
  }

  private static set _navigationStarted(value: boolean) {
    getGlobalState(NAVIGATION_STARTED_KEY, () => ({ value: false })).value = value
  }

  // Render Context Pooling
  private static get renderContextPool() {
    return getGlobalState(RENDER_CONTEXT_POOL_KEY, () => [] as { workStack: WorkItem[]; renderedElements: Map<BaseNode, ReactElement> }[])
  }

  private static acquireRenderContext() {
    const pool = BaseNode.renderContextPool
    if (pool.length > 0) {
      return pool.pop()!
    }
    return {
      workStack: new Array(512),
      renderedElements: new Map<BaseNode, ReactElement>(),
    }
  }

  private static releaseRenderContext(ctx: { workStack: WorkItem[]; renderedElements: Map<BaseNode, ReactElement> }) {
    // Limit pool size to prevent memory hoarding
    if (BaseNode.renderContextPool.length < 50) {
      // Only recycle if the stack capacity is not excessively large (e.g., < 2048 items)
      // This prevents the pool from holding onto massive arrays from deep renders,
      // which could lead to memory fragmentation or high memory usage.
      if (ctx.workStack.length < 2048) {
        ctx.workStack.length = 0
        ctx.renderedElements.clear()
        BaseNode.renderContextPool.push(ctx)
      }
    }
  }

  constructor(element: E, rawProps: Partial<NodeProps<E>> = {}, deps?: DependencyList) {
    // Element type validation is performed once at construction to prevent invalid nodes from being created.
    if (!isValidElementType(element)) {
      const elementType = getComponentType(element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }
    this.element = element
    this.rawProps = rawProps
    this._deps = deps

    // Extract commonly handled props; the remaining `propsForSignature` are used to compute a stable hash.
    const { ref, children, ...props } = rawProps

    // Generate or get cached stable key
    this.stableKey = this._getStableKey(props)

    if (!NodeUtil.isServer && !BaseNode._navigationStarted) {
      NavigationCacheManagerUtil.getInstance().start()
      BaseNode._navigationStarted = true
    }
  }

  /**
   * Lazily processes and retrieves the final, normalized props for the node.
   * The props are processed only once and then cached for subsequent accesses.
   * @getter props
   */
  public get props(): FinalNodeProps {
    if (!this._props) {
      this._props = NodeUtil.processProps(this.element, this.rawProps, this.stableKey)
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

  /**
   * Generates or returns a cached signature representing the props shape and values.
   * The signature is used as a stable key for caching prop-derived computations (e.g. CSS extraction).
   * - Uses a fast reference check to return the previous signature if the same props object is passed.
   * - For very large prop objects (> 100 keys) it builds a smaller "criticalProps" fingerprint
   * containing only style-related keys, event handlers, className/css and a `_keyCount` to avoid
   * expensive serialization of huge objects while still retaining reasonable cache discrimination.
   * - Stores the last props reference and computed signature to speed up repeated calls with the same object.
   * @param key Key passed for prefix if exist
   * @param props The props object to create a signature for.
   * @returns A compact string signature suitable for use as a cache key.
   */
  private _getStableKey({ key, ...props }: Record<string, unknown>): string | undefined {
    if (NodeUtil.isServer) return undefined

    if (this.lastPropsObj === props) {
      return this.lastSignature
    }

    this.lastPropsObj = props

    const keys = Object.keys(props)
    const keyCount = keys.length

    if (keyCount > 100) {
      const criticalProps = NodeUtil.extractCriticalProps(props, keys)

      this.lastSignature = NodeUtil.createPropSignature(this.element, criticalProps)

      if (__DEBUG__ && keyCount > 200) {
        console.warn(`MeoNode: Large props (${keyCount} keys) on "${getElementTypeName(this.element)}". Consider splitting.`)
      }
    } else {
      this.lastSignature = NodeUtil.createPropSignature(this.element, props)
    }

    return key !== undefined && key !== null ? `${String(key)}:${this.lastSignature}` : this.lastSignature
  }

  /**
   * FinalizationRegistry for cleaning up `elementCache` entries when the associated `BaseNode` instance
   * is garbage-collected. This helps prevent memory leaks by ensuring that cache entries for
   * unreferenced nodes are eventually removed.
   *
   * The held value must include `cacheKey` which is used to identify and delete the corresponding
   * entry from `BaseNode.elementCache`.
   * @public
   */

  public static get cacheCleanupRegistry() {
    return getGlobalState(
      CACHE_CLEANUP_REGISTRY_KEY,
      () =>
        new FinalizationRegistry<{
          cacheKey: string
          instanceId: string
        }>(heldValue => {
          const { cacheKey, instanceId } = heldValue
          const cacheEntry = BaseNode.elementCache.get(cacheKey)

          if (cacheEntry?.instanceId === instanceId) {
            BaseNode.elementCache.delete(cacheKey)
          }

          if (MountTrackerUtil.isMounted(cacheKey)) {
            MountTrackerUtil.untrackMount(cacheKey)
          }
        }),
    )
  }

  /**
   * FinalizationRegistry for cleaning up portal DOM containers and their associated React roots
   * when the owning `BaseNode` instance is garbage-collected.
   *
   * The held value must include:
   * - `domElement`: the container `HTMLDivElement` appended to `document.body`.
   * - `reactRoot`: an object with an `unmount()` method to unmount the React root.
   *
   * On cleanup the registry handler will attempt to:
   * 1. Unmount the React root (errors are swallowed in non-production builds with logging).
   * 2. Remove the `domElement` from the DOM if it is still connected.
   *
   * This prevents detached portal containers from leaking memory in long-running client apps.
   * @internal
   */
  public static get portalCleanupRegistry() {
    return getGlobalState(
      PORTAL_CLEANUP_REGISTRY_KEY,
      () =>
        new FinalizationRegistry<{
          domElement: HTMLDivElement
          reactRoot: { unmount(): void }
        }>(heldValue => {
          const { domElement, reactRoot } = heldValue

          if (__DEBUG__) {
            console.log('[MeoNode] FinalizationRegistry auto-cleaning portal')
          }

          // Guard: Check if already unmounted
          try {
            // Only unmount if root still exists
            if (reactRoot && typeof reactRoot.unmount === 'function') {
              reactRoot.unmount()
            }
          } catch (error) {
            // Swallow errors if already unmounted
            if (__DEBUG__) {
              console.error('[MeoNode] Portal auto-cleanup unmount error:', error)
            }
          }

          // Guard: Check if DOM element still connected
          try {
            if (domElement?.isConnected) {
              domElement.remove()
            }
          } catch (error) {
            if (__DEBUG__) {
              console.error('[MeoNode] Portal auto-cleanup DOM removal error:', error)
            }
          }
        }),
    )
  }

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
    // If this node is eligible for caching, retrieve the cached entry by stableKey;
    // otherwise treat as if no cache exists.
    const cacheEntry = NodeUtil.shouldCacheElement(this) ? BaseNode.elementCache.get(this.stableKey) : undefined

    // Decide whether this node (and its subtree) should update given dependency arrays.
    const shouldUpdate = NodeUtil.shouldNodeUpdate(cacheEntry?.prevDeps, this._deps, parentBlocked)

    // Fast return: if nothing should update and we have a cached element, reuse it.
    if (!shouldUpdate && cacheEntry?.renderedElement) {
      cacheEntry.accessCount += 1
      return cacheEntry.renderedElement
    }

    // When this node doesn't need update, its children are considered "blocked" and may be skipped.
    const childrenBlocked = !shouldUpdate

    // Acquire context from pool to reduce allocation pressure
    const ctx = BaseNode.acquireRenderContext()
    let { workStack } = ctx
    const { renderedElements } = ctx
    let stackPointer = 0

    try {
      // Fast capacity check with exponential growth
      const ensureCapacity = (required: number) => {
        if (required > workStack.length) {
          // Double capacity or use exact requirement (whichever is larger)
          const newCapacity = Math.max(required, workStack.length << 1)
          const newStack = new Array(newCapacity)

          // Manual copy is faster than Array methods for primitive/object arrays
          for (let i = 0; i < stackPointer; i++) {
            newStack[i] = workStack[i]
          }

          workStack = newStack
        }
      }

      // Push initial work item
      workStack[stackPointer++] = {
        node: this,
        isProcessed: false,
        blocked: childrenBlocked,
      }

      // Iterative depth-first traversal with explicit begin/complete phases to avoid recursion.
      while (stackPointer > 0) {
        const currentWork = workStack[stackPointer - 1]
        if (!currentWork) {
          stackPointer--
          continue
        }
        const { node, isProcessed, blocked } = currentWork

        if (!isProcessed) {
          // Begin phase: mark processed and push child BaseNodes onto the stack (in reverse order)
          currentWork.isProcessed = true
          const children = node.props.children

          if (children) {
            // Only consider BaseNode children for further traversal; primitives and React elements are terminal.
            const childrenToProcess = (Array.isArray(children) ? children : [children]).filter(NodeUtil.isNodeInstance)

            // --- Check capacity ONCE before loop ---
            const requiredCapacity = stackPointer + childrenToProcess.length
            ensureCapacity(requiredCapacity)

            for (let i = childrenToProcess.length - 1; i >= 0; i--) {
              const child = childrenToProcess[i]

              // Check if the child is eligible for caching and retrieve its cache entry.
              const childCacheEntry = !NodeUtil.shouldCacheElement(child) ? undefined : BaseNode.elementCache.get(child.stableKey)

              // Determine whether the child should update given its deps and the parent's blocked state.
              const childShouldUpdate = NodeUtil.shouldNodeUpdate(childCacheEntry?.prevDeps, child._deps, blocked)

              // If child doesn't need update and has cached element, reuse it immediately (no push).
              if (!childShouldUpdate && childCacheEntry?.renderedElement) {
                renderedElements.set(child, childCacheEntry.renderedElement)
                continue
              }

              // Otherwise push child for processing; childBlocked inherits parent's blocked state.
              const childBlocked = blocked || !childShouldUpdate
              workStack[stackPointer++] = {
                node: child,
                isProcessed: false,
                blocked: childBlocked,
              }
            }
          }
        } else {
          // Complete phase
          stackPointer--

          // Extract node props. Non-present props default to undefined via destructuring.
          const { children: childrenInProps, key, css, nativeProps, disableEmotion, ...otherProps } = node.props
          let finalChildren: ReactNode[] = []

          if (childrenInProps) {
            // Convert child placeholders into concrete React nodes:
            // - If it's a BaseNode, lookup its rendered ReactElement from the map.
            // - If it's already a React element, use it directly (with enhanced key).
            // - Otherwise treat as primitive ReactNode.
            const childArray = Array.isArray(childrenInProps) ? childrenInProps : [childrenInProps]
            const childCount = childArray.length
            // Pre-allocate array to avoid resizing during iteration
            finalChildren = new Array(childCount)

            for (let i = 0; i < childCount; i++) {
              const child = childArray[i]
              if (NodeUtil.isNodeInstance(child)) {
                const rendered = renderedElements.get(child)
                if (!rendered) {
                  throw new Error(`[MeoNode] Missing rendered element for child node: ${child.stableKey}`)
                }
                finalChildren[i] = rendered
              } else if (isValidElement(child)) {
                finalChildren[i] = child
              } else {
                finalChildren[i] = child
              }
            }
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

          // Cache child nodes (unwrapped) during the render loop
          // The root node will be cached separately after wrapping
          if (node !== this && NodeUtil.shouldCacheElement(node)) {
            const existingEntry = BaseNode.elementCache.get(node.stableKey)

            if (existingEntry) {
              // Update existing cache entry (avoid re-registration)
              existingEntry.prevDeps = node._deps
              existingEntry.renderedElement = element
              existingEntry.accessCount += 1
            } else {
              // Create new cache entry and register for cleanup
              const newCacheEntry: ElementCacheEntry = {
                prevDeps: node._deps,
                renderedElement: element,
                nodeRef: new WeakRef(node),
                createdAt: Date.now(),
                accessCount: 1,
                instanceId: node.instanceId,
              }

              // Set new cache entry
              BaseNode.elementCache.set(node.stableKey, newCacheEntry)

              // Register for automatic cleanup when node is GC'd
              BaseNode.cacheCleanupRegistry.register(node, { cacheKey: node.stableKey, instanceId: node.instanceId }, node)
            }
          }

          // Store the rendered element so parent nodes can reference it.
          renderedElements.set(node, element)
        }
      }

      // Get the final rendered element for the root node of this render cycle.
      let rootElement = renderedElements.get(this) as ReactElement<FinalNodeProps>

      // Wrap the root element with MeoNodeUnmounter if we need to track it
      const needsTracking = !NodeUtil.isServer && this.stableKey
      if (needsTracking) {
        rootElement = createElement(MeoNodeUnmounter, { node: this }, rootElement)
      }

      // Cache the WRAPPED element (not the unwrapped one) so we reuse the same MeoNodeUnmounter instance
      if (NodeUtil.shouldCacheElement(this)) {
        const existingEntry = BaseNode.elementCache.get(this.stableKey)
        if (existingEntry) {
          // Update existing cache entry with the wrapped element
          existingEntry.prevDeps = this._deps
          existingEntry.renderedElement = rootElement
          existingEntry.accessCount += 1
        } else {
          // Create new cache entry with the wrapped element
          const newCacheEntry: ElementCacheEntry = {
            prevDeps: this._deps,
            renderedElement: rootElement,
            nodeRef: new WeakRef(this),
            createdAt: Date.now(),
            accessCount: 1,
            instanceId: this.instanceId,
          }

          BaseNode.elementCache.set(this.stableKey, newCacheEntry)
          BaseNode.cacheCleanupRegistry.register(this, { cacheKey: this.stableKey, instanceId: this.instanceId }, this)
        }
      }

      return rootElement
    } finally {
      // Always release context back to pool, even if an exception occurred
      // Null out workStack slots to help GC before releasing
      for (let i = 0; i < stackPointer; i++) {
        workStack[i] = null as any
      }
      BaseNode.releaseRenderContext({ workStack, renderedElements })
    }
  }

  /**
   * Renders the node into a React Portal, mounting it directly under `document.body`.
   * Returns a handle with `update` and `unmount` methods to control the portal's lifecycle.
   * @method toPortal
   */
  public toPortal(): NodePortal {
    if (!NodeUtil.ensurePortalInfrastructure(this)) {
      throw new Error('toPortal() can only be called in a client-side environment')
    }

    const infra = NodeUtil.portalInfrastructure.get(this)!
    const { domElement, reactRoot } = infra

    const renderCurrent = () => {
      try {
        reactRoot.render(this.render())
      } catch (error) {
        if (__DEBUG__) {
          console.error('[MeoNode] Portal render error:', error)
        }
      }
    }

    renderCurrent()

    // Track if already unmounted to make unmount idempotent
    let isUnmounted = false
    const originalUnmount = reactRoot.unmount.bind(reactRoot)

    reactRoot.update = (next: NodeElement) => {
      if (isUnmounted) {
        if (__DEBUG__) {
          console.warn('[MeoNode] Attempt to update already-unmounted portal')
        }
        return
      }

      try {
        const content = NodeUtil.isNodeInstance(next) ? next.render() : (next as ReactNode)
        reactRoot.render(content)
      } catch (error) {
        if (__DEBUG__) {
          console.error('[MeoNode] Portal update error:', error)
        }
      }
    }

    reactRoot.unmount = () => {
      // Idempotent guard
      if (isUnmounted) {
        if (__DEBUG__) {
          console.warn('[MeoNode] Portal already unmounted')
        }
        return
      }

      isUnmounted = true

      // Unregister FIRST to prevent FinalizationRegistry from firing
      try {
        BaseNode.portalCleanupRegistry.unregister(this)
      } catch (error) {
        // May fail if already unregistered, that's fine
        if (__DEBUG__) {
          console.warn('[MeoNode] Portal unregister warning:', error)
        }
      }

      // Remove from WeakMap
      NodeUtil.portalInfrastructure.delete(this)

      // Now do the actual cleanup
      try {
        // If the portal's container is still in the DOM, we need to tell React to unmount the component tree from it.
        if (domElement?.isConnected) {
          originalUnmount()
        }
      } catch (error) {
        if (__DEBUG__) {
          console.error('[MeoNode] Portal unmount error:', error)
        }
      }

      try {
        if (domElement?.isConnected) {
          domElement.remove()
        }
      } catch (error) {
        if (__DEBUG__) {
          console.error('[MeoNode] Portal DOM cleanup error:', error)
        }
      }
    }

    return reactRoot
  }

  /**
   * A static method to clear all internal caches.
   *
   * This method performs manual cleanup of all cache entries, calling their
   * `onEvict` callbacks before clearing. Note that FinalizationRegistry entries
   * are not manually cleared as they will be garbage collected naturally when
   * the associated nodes are collected.
   * @method clearCaches
   */
  public static clearCaches() {
    // Collect all cache keys first
    const allKeys = Array.from(BaseNode.elementCache.keys())

    if (__DEBUG__) {
      console.log(`[MeoNode] clearCaches: Clearing ${allKeys.length} entries`)
    }

    // Call onEvict for all entries (idempotent) and clear node properties
    for (const key of allKeys) {
      const entry = BaseNode.elementCache.get(key)
      if (entry) {
        // Try to unregister from FinalizationRegistry
        const node = entry.nodeRef?.deref()
        if (node) {
          try {
            BaseNode.cacheCleanupRegistry.unregister(node)
            // Clear the node's signature properties to ensure clean state
            node.lastSignature = undefined
            node.lastPropsObj = undefined
          } catch {
            // Unregister might fail if already unregistered, that's fine
            if (__DEBUG__) {
              console.warn(`[MeoNode] Could not unregister ${key} from FinalizationRegistry`)
            }
          }
        }
      }
    }

    // Clear all caches
    BaseNode.elementCache.clear()

    // Clear mount tracking
    MountTrackerUtil.cleanup()

    if (__DEBUG__) {
      console.log('[MeoNode] All caches cleared')
    }
  }

  // --- Utilities ---
}

// --- Factory Functions ---

/**
 * The primary factory function for creating a `BaseNode` instance.
 * It's the simplest way to wrap a component or element.
 * @function Node
 */
function Node<AdditionalProps extends Record<string, unknown>, E extends NodeElementType>(
  element: E,
  props: MergedProps<E, AdditionalProps> = {} as MergedProps<E, AdditionalProps>,
  deps?: DependencyList,
): NodeInstance<E> {
  return new BaseNode(element, props as NodeProps<E>, deps)
}

/**
 * Static alias on the `Node` factory for clearing all internal caches used by `BaseNode`.
 *
 * Use cases include:
 *   - resetting state between tests,
 *   - hot-module-replacement (HMR) cycles,
 *   - manual resets in development,
 *   - or during SPA navigation to avoid stale cached elements/styles.
 *
 * Notes:
 *   - Clears only internal prop/element caches; does not touch portal infrastructure or external runtime state.
 *   - Safe to call on the server, but most useful on the client.
 * @method Node.clearCaches
 */
Node.clearCaches = BaseNode.clearCaches

// Export the Node factory as the main export
export { Node }

/**
 * Creates a curried node factory for a given React element or component type.
 * This is useful for creating reusable, specialized factory functions (e.g., `const Div = createNode('div')`).
 * @function createNode
 */
export function createNode<AdditionalInitialProps extends Record<string, unknown>, E extends NodeElementType>(
  element: E,
  initialProps?: MergedProps<E, AdditionalInitialProps>,
): HasRequiredProps<PropsOf<E>> extends true
  ? (<AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
      props: MergedProps<E, AdditionalProps>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & {
      element: E
    }
  : (<AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
      props?: MergedProps<E, AdditionalProps>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & {
      element: E
    } {
  const Instance = <AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
    props?: MergedProps<E, AdditionalProps>,
    deps?: DependencyList,
  ) => Node(element, { ...initialProps, ...props } as NodeProps<E> & AdditionalProps, deps)
  Instance.element = element
  return Instance as any
}

/**
 * Creates a node factory function where the first argument is `children` and the second is `props`.
 * This provides a more ergonomic API for components that primarily wrap content (e.g., `P('Some text')`).
 * @function createChildrenFirstNode
 */
export function createChildrenFirstNode<AdditionalInitialProps extends Record<string, unknown>, E extends NodeElementType>(
  element: E,
  initialProps?: Omit<NodeProps<E>, keyof AdditionalInitialProps | 'children'> & AdditionalInitialProps,
): HasRequiredProps<PropsOf<E>> extends true
  ? (<AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
      children: Children,
      props: Omit<MergedProps<E, AdditionalProps>, 'children'>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & { element: E }
  : (<AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
      children?: Children,
      props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
      deps?: DependencyList,
    ) => NodeInstance<E>) & { element: E } {
  const Instance = <AdditionalProps extends Record<string, unknown> = Record<string, unknown>>(
    children?: Children,
    props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
    deps?: DependencyList,
  ) => Node(element, { ...initialProps, ...props, children } as NodeProps<E> & AdditionalProps, deps)
  Instance.element = element
  return Instance as any
}
