import React, {
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
import { isForwardRef, isFragment, isMemo, isPortal, isReactClassComponent, isValidElementType } from '@src/helper/react-is.helper.js'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, hasNoStyleTag, omitUndefined } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'

/**
 * Represents a node in a React component tree.
 * This class wraps React elements and handles:
 * - Props processing and normalization
 * - Child node processing and management
 * - Style processing
 * @template E The type of React element or component this node represents
 */
export class BaseNode<E extends NodeElementType> implements NodeInstance<E> {
  /** The underlying React element or component type that this node represents */
  public element: E
  /** Original props passed during construction, preserved for cloning/recreation */
  public rawProps: Partial<NodeProps<E>> = {}
  /** Flag to identify BaseNode instances */
  public readonly isBaseNode = true

  /** Processed props after style processing, and child normalization */
  private _props?: FinalNodeProps
  /** DOM element used for portal rendering */
  private _portalDOMElement: HTMLDivElement | null = null
  /** React root instance for portal rendering */
  private _portalReactRoot: (NodePortal & { render(children: React.ReactNode): void }) | null = null
  /** Cache for normalized children */
  private _normalizedChildren?: ReactNode | ReactNode[]
  /** Indicates whether the code is running on the server (true) or client (false) */
  private static _isServer = typeof window === 'undefined'

  /**
   * Constructs a new BaseNode instance.
   */
  constructor(element: E, rawProps: Partial<NodeProps<E>> = {}) {
    this.element = element
    this.rawProps = rawProps
  }

  /**
   * Lazily processes and retrieves the final, normalized props for the node.
   */
  public get props(): FinalNodeProps {
    if (!this._props) {
      this._props = this._processProps()
    }
    return this._props
  }

  /**
   * Processes raw props into a final, normalized form.
   */
  private _processProps(): FinalNodeProps {
    const { ref, key, children, css, props: nativeProps = {}, ...restRawProps } = this.rawProps
    const { style: nativeStyle, ...restNativeProps } = nativeProps as Omit<PropsOf<E>, 'children'>

    const styleProps = getCSSProps(restRawProps)
    const domProps = getDOMProps(restRawProps)
    const normalizedChildren = this._processChildren(children)

    return omitUndefined({
      ref,
      key,
      css: { ...styleProps, ...css },
      style: nativeStyle,
      ...domProps,
      nativeProps: restNativeProps,
      children: normalizedChildren,
    })
  }

  /**
   * Recursively processes raw children, converting them into `BaseNode` instances as needed.
   */
  private _processChildren(children: Children) {
    if (!children) return undefined

    let processed: Children
    if (typeof children === 'function') {
      processed = children
    } else {
      // Process each child node
      processed = Array.isArray(children) ? children.map(child => BaseNode._processRawNode(child)) : BaseNode._processRawNode(children)
    }

    return processed
  }

  /**
   * Renders a processed `NodeElement` into a `ReactNode`.
   */
  private static _renderProcessedNode(processedElement: NodeElement, passedKey?: string) {
    const commonBaseNodeProps: Partial<NodeProps<any>> = {}
    if (passedKey !== undefined) {
      commonBaseNodeProps.key = passedKey
    }

    if (processedElement instanceof BaseNode || isNodeInstance(processedElement)) {
      const existingKey = processedElement.rawProps?.key
      if (existingKey === passedKey) {
        return processedElement.render()
      }

      return new BaseNode(processedElement.element, {
        ...processedElement.rawProps,
        ...commonBaseNodeProps,
      }).render()
    }

    if (isReactClassComponent(processedElement)) {
      return new BaseNode(processedElement, commonBaseNodeProps).render()
    }

    if (isNodeInstance(processedElement)) {
      return processedElement.render()
    }

    if (processedElement instanceof React.Component) {
      return processedElement.render()
    }

    if (typeof processedElement === 'function') {
      return createElement(processedElement as ElementType, { key: passedKey })
    }

    return processedElement as ReactNode
  }

  /**
   * Checks if a node is a function child (render prop style).
   */
  private static _isFunctionChild<E extends NodeInstance | ReactNode>(node: NodeElement): node is NodeFunction<E> {
    if (typeof node !== 'function') return false
    if (isReactClassComponent(node)) return false
    if (isMemo(node)) return false
    if (isForwardRef(node)) return false

    try {
      return !(node.prototype && typeof node.prototype.render === 'function')
    } catch {
      return true
    }
  }

  /**
   * Renders the output of a function-as-a-child.
   */
  private static _functionRenderer<E extends ReactNode | NodeInstance>({ render }: FunctionRendererProps<E>) {
    let result: NodeElement
    try {
      result = render()
    } catch {
      result = null
    }

    if (result === null || result === undefined) {
      return result
    }

    if (Array.isArray(result)) {
      return result.map((item, index) => {
        const processed = BaseNode._processRawNode(item)
        return BaseNode._renderProcessedNode(processed, `${getElementTypeName(item)}-${index}`)
      })
    }

    if (result instanceof React.Component) {
      const element = result.render()
      const processed = BaseNode._processRawNode(element)
      return BaseNode._renderProcessedNode(processed)
    }

    if (result instanceof BaseNode || isNodeInstance(result)) {
      return result.render()
    }

    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return result
    }

    const processedResult = BaseNode._processRawNode(result as NodeElement)
    if (processedResult) return BaseNode._renderProcessedNode(processedResult)

    return result
  }

  /**
   * Processes a single raw node, recursively converting it into a `BaseNode` or other renderable type.
   */
  private static _processRawNode(node: NodeElement): NodeElement {
    // Primitives and null/undefined - return as-is
    if (node === null || node === undefined || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      return node
    }

    // Already processed nodes - return as-is
    if (node instanceof BaseNode || isNodeInstance(node)) {
      return node
    }

    // Function children (render props) - wrap in function renderer
    if (BaseNode._isFunctionChild(node)) {
      return new BaseNode(BaseNode._functionRenderer, { render: node })
    }

    // React elements - extract props and wrap in BaseNode
    if (isValidElement(node)) {
      const { style: childStyleObject, ...otherChildProps } = node.props as ComponentProps<any>
      const combinedProps = { ...otherChildProps, ...(childStyleObject || {}) }

      return new BaseNode(node.type as ElementType, {
        ...combinedProps,
        // Only preserve non-null keys
        ...(node.key !== null && node.key !== undefined ? { key: node.key } : {}),
      })
    }

    // Component types - wrap in BaseNode
    if (isReactClassComponent(node) || isMemo(node) || isForwardRef(node)) {
      return new BaseNode(node as ElementType, {})
    }

    // React.Component instances - render and process recursively
    if (node instanceof React.Component) {
      const element = node.render()
      return BaseNode._processRawNode(element)
    }

    // Everything else - return as-is
    return node
  }

  /**
   * Normalizes a processed child node into a final, renderable `ReactNode`.
   */
  private _normalizeChild = (child: NodeElement): ReactNode => {
    if (child === null || child === undefined) return child

    const t = typeof child
    if (t === 'string' || t === 'number' || t === 'boolean') return child as ReactNode

    if (child instanceof BaseNode || isNodeInstance(child)) {
      return child.render()
    }

    if (typeof (child as any).render === 'function') {
      return (child as React.Component).render()
    }

    if (typeof child === 'object' && 'isBaseNode' in child && 'rawProps' in child && 'element' in child && !isNodeInstance(child)) {
      return new BaseNode(child.element as NodeElementType, child.rawProps as object).render()
    }

    if (!isValidElementType(child) && !isPortal(child)) {
      const elementType = getComponentType(child)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    return child as ReactNode
  }

  /**
   * Renders the `BaseNode` into a `ReactElement`.
   */
  public render(): ReactElement<FinalNodeProps> {
    if (!isValidElementType(this.element)) {
      const elementType = getComponentType(this.element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    const { children: childrenInProps, key, css, nativeProps, ...otherProps } = this.props

    let finalChildren: ReactNode | ReactNode[] = undefined

    if (childrenInProps !== undefined && childrenInProps !== null) {
      if (!this._normalizedChildren) {
        if (Array.isArray(childrenInProps)) {
          if (childrenInProps.length > 0) {
            const mappedArray = childrenInProps.map(child => this._normalizeChild(child))

            if (mappedArray.every(child => child === null || child === undefined)) {
              this._normalizedChildren = undefined
            } else {
              this._normalizedChildren = mappedArray
            }
          } else {
            this._normalizedChildren = undefined
          }
        } else {
          this._normalizedChildren = this._normalizeChild(childrenInProps)
        }
      }

      finalChildren = this._normalizedChildren
    }

    // Common props for all createElement calls
    const elementProps = {
      ...(otherProps as ComponentProps<ElementType>),
      key,
      ...nativeProps,
    }

    // Fragment handling
    if (this.element === Fragment || isFragment(this.element)) {
      return createElement(this.element as ExoticComponent<FragmentProps>, { key }, ...(Array.isArray(finalChildren) ? finalChildren : [finalChildren]))
    }

    // Styled component handling
    if (this.element && !hasNoStyleTag(this.element) && css) {
      try {
        const displayName = getElementTypeName(this.element)
        StyledRenderer.displayName = `Styled(${displayName})`
      } catch {
        // swallow: displayName is not critical
      }

      return createElement(
        StyledRenderer,
        {
          element: this.element,
          ...elementProps,
          css,
          suppressHydrationWarning: true,
        },
        ...(Array.isArray(finalChildren) ? finalChildren : [finalChildren]),
      )
    }

    // Regular element handling with spread children
    try {
      ;(this.element as NodeElement & { displayName: string }).displayName = getElementTypeName(this.element)
    } catch {
      // swallow: displayName is not critical
    }

    return createElement(this.element as ElementType, elementProps, ...(Array.isArray(finalChildren) ? finalChildren : [finalChildren]))
  }

  /**
   * Portal infrastructure setup
   */
  private _ensurePortalInfrastructure() {
    if (BaseNode._isServer) return false

    if (this._portalDOMElement && this._portalReactRoot && this._portalDOMElement.isConnected) return true

    if (this._portalDOMElement && !this._portalDOMElement.isConnected) {
      if (this._portalReactRoot) {
        try {
          this._portalReactRoot.unmount()
        } catch {
          // swallow
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
      this._portalReactRoot = {
        render: root.render.bind(root),
        unmount: root.unmount.bind(root),
        update: () => {},
      }
    }

    return true
  }

  /**
   * Portal rendering
   */
  public toPortal(): NodePortal {
    if (!this._ensurePortalInfrastructure() || !this._portalReactRoot) {
      throw new Error('toPortal() can only be called in a client-side environment where document.body is available.')
    }

    const renderCurrent = () => {
      try {
        const content = this.render()
        this._portalReactRoot!.render(content)
      } catch {
        // swallow render errors to avoid breaking caller
      }
    }

    renderCurrent()

    try {
      const originalUnmount = this._portalReactRoot.unmount.bind(this._portalReactRoot)

      const handle = this._portalReactRoot as ReactDOMRoot & {
        update: (next: NodeElement) => void
        unmount: () => void
      }

      handle.update = (next: NodeElement) => {
        try {
          if (!this._portalReactRoot) return

          if (next instanceof BaseNode || (next && typeof (next as any).render === 'function')) {
            const content = (next as any).render ? (next as any).render() : (next as ReactNode)
            this._portalReactRoot.render(content)
            return
          }

          this._portalReactRoot.render(next as ReactNode)
        } catch {
          // swallow
        }
      }

      handle.unmount = () => {
        try {
          originalUnmount()
        } catch {
          // swallow
        }
        if (this._portalDOMElement) {
          try {
            if (this._portalDOMElement.parentNode) {
              this._portalDOMElement.parentNode.removeChild(this._portalDOMElement)
            }
          } catch {
            // swallow
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
}

/**
 * Factory function to create a `BaseNode` instance.
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
  return Instance
}

/**
 * Creates a node factory function where the first argument is `children` and the second is `props`.
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
  return Instance
}
