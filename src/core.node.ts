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
  PropsOf,
} from '@src/node.type.js'
import { isNodeInstance } from '@src/helper/node.helper.js'
import { isForwardRef, isFragment, isMemo, isReactClassComponent, isValidElementType } from '@src/helper/react-is.helper.js'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, hasNoStyleTag, omitUndefined } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'

/**
 * Defines the structure for caching CSS property processing results.
 * This cache helps to avoid re-computing CSS props for the same set of input props,
 * significantly speeding up rendering for components with static styles.
 * @interface PropProcessingCache
 * @property {Record<string, any>} cssProps - The computed CSS properties.
 * @property {string} signature - A unique signature generated from the cacheable props.
 */
interface PropProcessingCache {
  cssProps: Record<string, any>
  signature: string
}

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

  private static _isServer = typeof window === 'undefined'
  private static _propProcessingCache = new Map<string, PropProcessingCache>()
  private static _isValidElement = isValidElementType

  constructor(element: E, rawProps: Partial<NodeProps<E>> = {}) {
    // Element type validation is performed once at construction to prevent invalid nodes from being created.
    if (!BaseNode._isValidElement(element)) {
      const elementType = getComponentType(element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }
    this.element = element
    this.rawProps = rawProps
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

  // --- Prop Caching and Processing ---

  /**
   * A fast, non-cryptographic hash function (FNV-1a) used to generate a unique signature for a set of props.
   * This is significantly faster than `JSON.stringify` for creating cache keys.
   * @method _hashString
   */
  private static _hashString(str: string): string {
    let hash = 2166136261 // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 16777619) // FNV prime
    }
    return (hash >>> 0).toString(36)
  }

  /**
   * Creates a unique, stable signature from a set of props. This signature is used as a key for caching computed CSS props.
   * It serializes only primitive values and the structure of objects/arrays to ensure speed and stability.
   * @method _createPropSignature
   */
  private static _createPropSignature(props: Record<string, any>): string {
    const keys = Object.keys(props).sort()
    let signatureStr = ''

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
        valStr = `${key}:[${val.length}];`
      } else {
        valStr = `${key}:{${Object.keys(val).length}};`
      }
      signatureStr += valStr
    }

    return BaseNode._hashString(signatureStr)
  }

  /**
   * Retrieves computed CSS props from the cache if available. If not, it computes them,
   * adds them to the cache, and then returns them. An LRU-like mechanism is used to prevent the cache from growing indefinitely.
   * @method _getCachedCssProps
   */
  private static _getCachedCssProps(cacheableProps: Record<string, any>, signature: string): { cssProps: Record<string, any> } {
    const cached = BaseNode._propProcessingCache.get(signature)
    if (cached) {
      return { cssProps: cached.cssProps }
    }

    const cssProps = getCSSProps(cacheableProps)
    BaseNode._propProcessingCache.set(signature, { cssProps, signature })

    // LRU-like cache eviction policy.
    if (BaseNode._propProcessingCache.size > 500) {
      const firstKey = BaseNode._propProcessingCache.keys().next().value
      if (firstKey) BaseNode._propProcessingCache.delete(firstKey)
    }

    return { cssProps }
  }

  /**
   * Separates props into cacheable (primitives, arrays, plain objects) and non-cacheable (functions) groups.
   * This is crucial for ensuring that only serializable, static values are used for generating cache signatures.
   * @method _splitProps
   */
  private static _splitProps(props: Record<string, any>): { cacheable: Record<string, any> } {
    const cacheable: Record<string, any> = {}
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        // Functions are not cacheable as their references change.
        if (typeof props[key] !== 'function') {
          cacheable[key] = props[key]
        }
      }
    }
    return { cacheable }
  }

  /**
   * The main prop processing pipeline. It orchestrates splitting props, generating cache signatures,
   * retrieving cached CSS props, computing DOM props, and normalizing children.
   * @method _processProps
   */
  private _processProps(): FinalNodeProps {
    const { ref, key, children, css, props: nativeProps = {}, disableEmotion, ...restRawProps } = this.rawProps

    // --- Fast Path Optimization ---
    // For simple nodes with no styling props, we can bypass most of the expensive processing.
    // This dramatically improves performance for deeply nested, unstyled structures.
    if (Object.keys(restRawProps).length === 0 && !css) {
      return omitUndefined({
        ref,
        key,
        css: {},
        style: (nativeProps as any).style,
        disableEmotion,
        nativeProps: omitUndefined(nativeProps),
        children: this._processChildren(children, disableEmotion),
      })
    }

    // --- Prop Caching and Computation ---
    const { cacheable } = BaseNode._splitProps(restRawProps)
    const signature = BaseNode._createPropSignature(cacheable)
    const { cssProps: cachedCssProps } = BaseNode._getCachedCssProps(cacheable, signature)

    // DOM props (like event handlers) are always computed fresh to ensure reference correctness.
    const domProps = getDOMProps(restRawProps)

    // Merge computed CSS props with any explicit `css` prop provided.
    const finalCssProps = { ...cachedCssProps, ...css }

    // --- Child Normalization ---
    const normalizedChildren = this._processChildren(children, disableEmotion)

    // --- Final Assembly ---
    return omitUndefined({
      ref,
      key,
      css: finalCssProps,
      style: (nativeProps as any).style,
      ...domProps,
      disableEmotion,
      nativeProps: omitUndefined(nativeProps),
      children: normalizedChildren,
    })
  }

  // --- Child Processing ---

  /**
   * Processes the `children` prop of a node. It handles single children, arrays of children,
   * and function-as-a-child render props, passing them to `_processRawNode` for normalization.
   * @method _processChildren
   */
  private _processChildren(children: Children, disableEmotion?: boolean): Children {
    if (!children) return undefined
    if (typeof children === 'function') return children
    return Array.isArray(children) ? children.map(child => BaseNode._processRawNode(child, disableEmotion)) : BaseNode._processRawNode(children, disableEmotion)
  }

  /**
   * The core normalization function for a single child. It takes any valid `NodeElement`
   * (primitive, React element, function, `BaseNode` instance) and converts it into a standardized `BaseNode`
   * instance if it isn't one already. This ensures a consistent structure for the iterative renderer.
   * @method _processRawNode
   */
  private static _processRawNode(node: NodeElement, disableEmotion?: boolean): NodeElement {
    // Primitives and null/undefined are returned as-is.
    if (node === null || node === undefined || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return node

    // If it's already a BaseNode, just ensure the `disableEmotion` flag is propagated.
    if (isNodeInstance(node)) {
      if (disableEmotion && !node.rawProps.disableEmotion) return new BaseNode(node.element, { ...node.rawProps, disableEmotion: true })
      return node
    }

    // Handle function-as-a-child (render props).
    if (BaseNode._isFunctionChild(node)) return new BaseNode(BaseNode._functionRenderer as NodeElementType, { props: { render: node, disableEmotion } })

    // Handle standard React elements.
    if (isValidElement(node)) {
      const { style: childStyleObject, ...otherChildProps } = node.props as ComponentProps<any>
      const combinedProps = { ...otherChildProps, ...(childStyleObject || {}) }
      return new BaseNode(node.type as ElementType, {
        ...combinedProps,
        ...(node.key !== null && node.key !== undefined ? { key: node.key } : {}),
        disableEmotion,
      })
    }

    // Handle component classes and memos.
    if (isReactClassComponent(node) || isMemo(node) || isForwardRef(node)) return new BaseNode(node as ElementType, { disableEmotion })

    // Handle component instances.
    if (node instanceof React.Component) return BaseNode._processRawNode(node.render(), disableEmotion)

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
    } catch {
      return true
    }
  }

  /**
   * A wrapper component that executes a function-as-a-child and processes its return value.
   * @method _functionRenderer
   */
  private static _functionRenderer<E extends ReactNode | NodeInstance>({ render, disableEmotion }: FunctionRendererProps<E>) {
    let result: NodeElement
    try {
      result = render()
    } catch {
      result = null
    }
    if (result === null || result === undefined) return result
    if (isNodeInstance(result)) {
      if (disableEmotion && !result.rawProps.disableEmotion) return new BaseNode(result.element, { ...result.rawProps, disableEmotion: true }).render()
      return result.render()
    }
    if (Array.isArray(result)) {
      return result.map((item, index) =>
        BaseNode._renderProcessedNode({ processedElement: BaseNode._processRawNode(item, disableEmotion), passedKey: `${getElementTypeName(item)}-${index}` }),
      )
    }
    if (result instanceof React.Component) {
      return BaseNode._renderProcessedNode({ processedElement: BaseNode._processRawNode(result.render(), disableEmotion), disableEmotion })
    }
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') return result
    const processedResult = BaseNode._processRawNode(result as NodeElement, disableEmotion)
    if (processedResult) return BaseNode._renderProcessedNode({ processedElement: processedResult, disableEmotion })
    return result
  }

  /**
   * A legacy helper for the recursive child processing path. This is primarily used by `_functionRenderer`.
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
    const commonBaseNodeProps: Partial<NodeProps<any>> = {}
    if (passedKey !== undefined) commonBaseNodeProps.key = passedKey

    if (isNodeInstance(processedElement)) {
      const existingKey = processedElement.rawProps?.key
      processedElement.rawProps.disableEmotion = disableEmotion
      if (existingKey === passedKey) return processedElement.render()
      return new BaseNode(processedElement.element, { ...processedElement.rawProps, ...commonBaseNodeProps }).render()
    }
    if (isReactClassComponent(processedElement)) return new BaseNode(processedElement, { ...commonBaseNodeProps, disableEmotion }).render()
    if (processedElement instanceof React.Component) return processedElement.render()
    if (typeof processedElement === 'function') return createElement(processedElement as ElementType, { key: passedKey })
    return processedElement as ReactNode
  }

  // --- Iterative Renderer ---

  /**
   * Renders the `BaseNode` and its entire subtree into a ReactElement.
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
  public render(): ReactElement<FinalNodeProps> {
    const workStack: { node: BaseNode<any>; isProcessed: boolean }[] = [{ node: this, isProcessed: false }]
    const renderedElements = new Map<BaseNode<any>, ReactElement>()

    while (workStack.length > 0) {
      const currentWork = workStack[workStack.length - 1] // Peek at the top of the stack
      const { node, isProcessed } = currentWork

      if (!isProcessed) {
        // --- Begin Phase ---
        // Mark the node as processed and push its children onto the stack.
        // We process children first to ensure they are rendered before the parent.
        currentWork.isProcessed = true
        const children = node.props.children
        if (children) {
          const childrenToProcess = (Array.isArray(children) ? children : [children]).filter(isNodeInstance)
          // Push children in reverse order to maintain the correct processing sequence.
          for (let i = childrenToProcess.length - 1; i >= 0; i--) {
            workStack.push({ node: childrenToProcess[i], isProcessed: false })
          }
        }
      } else {
        // --- Complete Phase ---
        // All children of this node have been processed. Now, we can render the node itself.
        workStack.pop() // Pop the completed work.

        const { children: childrenInProps, key, css, nativeProps, disableEmotion, ...otherProps } = node.props
        let finalChildren: ReactNode[] = []

        // Collect rendered children from the map.
        if (childrenInProps) {
          finalChildren = (Array.isArray(childrenInProps) ? childrenInProps : [childrenInProps]).map(child => {
            if (isNodeInstance(child)) return renderedElements.get(child)!
            if (isValidElement(child)) return child
            return child as ReactNode
          })
        }

        const elementProps = { ...(otherProps as ComponentProps<ElementType>), key, ...nativeProps }
        let element: ReactElement

        // Handle special cases like Fragment.
        if (node.element === Fragment || isFragment(node.element)) {
          element = createElement(node.element as ExoticComponent<FragmentProps>, { key }, ...finalChildren)
        } else {
          // Determine if the component should be styled with Emotion.
          const isStyledComponent = css && !disableEmotion && !hasNoStyleTag(node.element)
          if (isStyledComponent) {
            element = createElement(StyledRenderer, { element: node.element, ...elementProps, css, suppressHydrationWarning: true }, ...finalChildren)
          } else {
            element = createElement(node.element as ElementType, elementProps, ...finalChildren)
          }
        }
        // Store the final rendered element in the map for its parent to retrieve.
        renderedElements.set(node, element)
      }
    }
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
        } catch {
          /* empty */
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
      } catch {
        /* empty */
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
        } catch {
          /* empty */
        }
      }

      handle.unmount = () => {
        try {
          originalUnmount()
        } catch {
          /* empty */
        }
        if (this._portalDOMElement) {
          try {
            if (this._portalDOMElement.parentNode) this._portalDOMElement.parentNode.removeChild(this._portalDOMElement)
          } catch {
            /* empty */
          }
          this._portalDOMElement = null
        }
        this._portalReactRoot = null
      }
      return handle
    } catch {
      return this._portalReactRoot
    }
  }

  /**
   * A static method to clear all internal caches. This is primarily useful for testing
   * to ensure that tests run in a clean, isolated state.
   * @method clearCaches
   */
  public static clearCaches() {
    BaseNode._propProcessingCache.clear()
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
  additionalProps: AdditionalProps = {} as AdditionalProps,
): NodeInstance<E> {
  const finalProps = { ...props, ...additionalProps } as NodeProps<E> & AdditionalProps
  return new BaseNode(element, finalProps)
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
  ? (<AdditionalProps extends Record<string, any> = Record<string, any>>(props: MergedProps<E, AdditionalProps>) => NodeInstance<E>) & { element: E }
  : (<AdditionalProps extends Record<string, any> = Record<string, any>>(props?: MergedProps<E, AdditionalProps>) => NodeInstance<E>) & { element: E } {
  const Instance = <AdditionalProps extends Record<string, any> = Record<string, any>>(props?: MergedProps<E, AdditionalProps>) =>
    Node(element, { ...initialProps, ...props } as NodeProps<E> & AdditionalProps)
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
    ) => NodeInstance<E>) & { element: E }
  : (<AdditionalProps extends Record<string, any> = Record<string, any>>(
      children?: Children,
      props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
    ) => NodeInstance<E>) & { element: E } {
  const Instance = <AdditionalProps extends Record<string, any> = Record<string, any>>(
    children?: Children,
    props?: Omit<MergedProps<E, AdditionalProps>, 'children'>,
  ) => Node(element, { ...initialProps, ...props, children } as NodeProps<E> & AdditionalProps)
  Instance.element = element
  return Instance as any
}
