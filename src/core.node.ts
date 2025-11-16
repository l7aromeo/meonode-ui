import {
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
  HasRequiredProps,
  MergedProps,
  NodeElement,
  NodeElementType,
  NodeInstance,
  NodePortal,
  NodeProps,
  PropProcessingCache,
  PropsOf,
  DependencyList,
  ElementCacheEntry,
} from '@src/types/node.type.js'
import { isFragment, isValidElementType } from '@src/helper/react-is.helper.js'
import { getComponentType, getElementTypeName, hasNoStyleTag } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'
import { __DEBUG__ } from '@src/constants/common.const.js'
import { MountTrackerUtil } from '@src/util/mount-tracker.util.js'
import MeoNodeUnmounter from '@src/components/meonode-unmounter.client.js'
import { NavigationCacheManagerUtil } from '@src/util/navigation-cache-manager.util.js'
import { NodeUtil } from '@src/util/node.util.js'
import { ThemeUtil } from '@src/util/theme.util.js'

/**
 * The core abstraction of the MeoNode library. It wraps a React element or component,
 * providing a unified interface for processing props, normalizing children, and handling styles.
 * This class is central to the library's ability to offer a JSX-free, fluent API for building UIs.
 * It uses an iterative rendering approach to handle deeply nested structures without causing stack overflows.
 * @class BaseNode
 * @template E - The type of React element or component this node represents.
 */
export class BaseNode<E extends NodeElementType> {
  public instanceId: string = Math.random().toString(36).slice(2) + Date.now().toString(36)

  public element: E
  public rawProps: Partial<NodeProps<E>> = {}
  public readonly isBaseNode = true

  private _props?: FinalNodeProps
  private readonly _deps?: DependencyList
  public stableKey: string = ''

  // Cache helpers: retain the previous props reference and its computed signature so
  // repeated processing can quickly detect unchanged props and avoid expensive recomputation.
  private _lastPropsRef: unknown = null
  private _lastSignature: string = ''

  public static elementCache = new Map<string, ElementCacheEntry>()
  public static propProcessingCache = new Map<string, PropProcessingCache>()

  // Cleanup scheduling flag
  public static scheduledCleanup = false

  // Navigation tracking
  private static _navigationStarted = false

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
  private _getStableKey({ key, ...props }: Record<string, any>): string {
    if (NodeUtil.isServer) return ''

    if (props === this._lastPropsRef) {
      return this._lastSignature
    }

    if (this._lastPropsRef && NodeUtil.shallowEqual(props, this._lastPropsRef)) {
      this._lastPropsRef = props
      return this._lastSignature
    }

    const keys = Object.keys(props)
    const keyCount = keys.length

    if (keyCount > 100) {
      const criticalProps: Record<string, any> = { _keyCount: keyCount }
      let criticalCount = 0
      const MAX_CRITICAL = 50

      for (const k of keys) {
        if (criticalCount >= MAX_CRITICAL) break
        if (NodeUtil.isStyleProp(k) || k === 'css' || k === 'className' || k.startsWith('on')) {
          criticalProps[k] = props[k as keyof typeof props]
          criticalCount++
        }
      }

      this._lastSignature = NodeUtil.createPropSignature(this.element, criticalProps)

      if (__DEBUG__ && keyCount > 200) {
        console.warn(`MeoNode: Large props (${keyCount} keys) on "${getElementTypeName(this.element)}". Consider splitting.`)
      }
    } else {
      this._lastSignature = NodeUtil.createPropSignature(this.element, props)
    }

    this._lastPropsRef = props

    return key !== undefined && key !== null ? `${String(key)}:${this._lastSignature}` : this._lastSignature
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
  public static cacheCleanupRegistry = new FinalizationRegistry<{
    cacheKey: string
    instanceId: string
  }>(heldValue => {
    const { cacheKey, instanceId } = heldValue
    const cacheEntry = BaseNode.elementCache.get(cacheKey)

    if (MountTrackerUtil.mountedNodes.has(cacheKey) && cacheEntry?.instanceId === instanceId) {
      BaseNode.elementCache.delete(cacheKey)
      MountTrackerUtil.untrackMount(cacheKey)
    }
  })

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
   * @private
   */
  public static portalCleanupRegistry = new FinalizationRegistry<{
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
  })

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
    // Auto-track this node for mount detection
    if (!NodeUtil.isServer) {
      MountTrackerUtil.trackMount(this.stableKey)
    }

    // On server we never reuse cached elements because that can cause hydration mismatches.
    const cacheEntry = NodeUtil.isServer ? undefined : BaseNode.elementCache.get(this.stableKey)

    // Decide whether this node (and its subtree) should update given dependency arrays.
    const shouldUpdate = NodeUtil.shouldNodeUpdate(cacheEntry?.prevDeps, this._deps, parentBlocked)

    // Fast return: if nothing should update and we have a cached element, reuse it.
    if (!shouldUpdate && cacheEntry?.renderedElement) {
      cacheEntry.accessCount += 1
      return cacheEntry.renderedElement
    }

    // When this node doesn't need update, its children are considered "blocked" and may be skipped.
    const childrenBlocked = !shouldUpdate

    // Work stack for iterative, non-recursive traversal.
    // Each entry tracks the BaseNode, whether its children were pushed (isProcessed) and whether it is blocked.
    const workStack: { node: NodeInstance; isProcessed: boolean; blocked: boolean }[] = [{ node: this, isProcessed: false, blocked: childrenBlocked }]
    // Map to collect rendered React elements for processed BaseNode instances.
    const renderedElements = new Map<NodeInstance, ReactElement>()

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
          const childrenToProcess = (Array.isArray(children) ? children : [children]).filter(NodeUtil.isNodeInstance)

          for (let i = childrenToProcess.length - 1; i >= 0; i--) {
            const child = childrenToProcess[i]

            // Respect server/client differences for child cache lookup.
            const childCacheEntry = NodeUtil.isServer ? undefined : BaseNode.elementCache.get(child.stableKey)

            // Determine whether the child should update given its deps and the parent's blocked state.
            const childShouldUpdate = NodeUtil.shouldNodeUpdate(childCacheEntry?.prevDeps, child._deps, blocked)

            // If child doesn't need update and has cached element, reuse it immediately (no push).
            if (!childShouldUpdate && childCacheEntry?.renderedElement) {
              renderedElements.set(child, childCacheEntry.renderedElement)
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
            if (NodeUtil.isNodeInstance(child)) return renderedElements.get(child)!
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
        if (!NodeUtil.isServer) {
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
    const rootElement = renderedElements.get(this) as ReactElement<FinalNodeProps>

    if (!NodeUtil.isServer) {
      return createElement(MeoNodeUnmounter, { stableKey: this.stableKey }, rootElement)
    }

    return rootElement
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

    // Call onEvict for all entries (idempotent)
    for (const key of allKeys) {
      const entry = BaseNode.elementCache.get(key)
      if (entry) {
        // Try to unregister from FinalizationRegistry
        const node = entry.nodeRef?.deref()
        if (node) {
          try {
            BaseNode.cacheCleanupRegistry.unregister(node)
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
    BaseNode.propProcessingCache.clear()
    BaseNode.elementCache.clear()
    ThemeUtil.clearThemeCache()

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
function Node<AdditionalProps extends Record<string, any>, E extends NodeElementType>(
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
