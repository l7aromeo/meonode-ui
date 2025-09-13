'use strict'
import React, { type ComponentProps, createElement, type ElementType, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'
import type {
  Children,
  FinalNodeProps,
  FunctionRendererProps,
  HasRequiredProps,
  MergedProps,
  NodeElement,
  NodeInstance,
  NodeProps,
  PropsOf,
  RawNodeProps,
  Theme,
} from '@src/node.type.js'
import { createStableHash, isNodeInstance, resolveDefaultStyle } from '@src/helper/node.helper.js'
import { isForwardRef, isFragment, isMemo, isReactClassComponent, isValidElementType } from '@src/helper/react-is.helper.js'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, hasNoStyleTag } from '@src/helper/common.helper.js'
import StyledRenderer from '@src/components/styled-renderer.client.js'
import { resolveObjWithTheme } from '@src/helper/theme.helper.js'

/**
 * Represents a node in a React component tree with theme and styling capabilities.
 * This class wraps React elements and handles:
 * - Props processing and normalization
 * - Theme inheritance and resolution
 * - Child node processing and management
 * - Style processing with theme variables
 * @template E The type of React element or component this node represents
 */
export class BaseNode<E extends NodeElement> implements NodeInstance<E> {
  /** The underlying React element or component type that this node represents */
  public element: E
  /** Original props passed during construction, preserved for cloning/recreation */
  public rawProps: RawNodeProps<E> = {}
  /** Flag to identify BaseNode instances */
  public readonly isBaseNode = true

  /** Processed props after theme resolution, style processing, and child normalization */
  private _props?: FinalNodeProps
  /** DOM element used for portal rendering */
  private _portalDOMElement: HTMLDivElement | null = null
  /** React root instance for portal rendering */
  private _portalReactRoot: ReactDOMRoot | null = null
  /** Hash of the current children and theme to detect changes */
  private _childrenHash?: string
  /** Cache for normalized children */
  private _normalizedChildren?: ReactNode
  /** Indicates whether the code is running on the server (true) or client (false) */
  private static _isServer = typeof window === 'undefined'

  /**
   * WeakMap cache for processed children, keyed by object/array identity for GC friendliness.
   * Each entry stores the hash, processed children, and a server-side flag.
   */
  private static _processedChildrenWeakCache = new WeakMap<
    object,
    {
      hash: string
      children: Children
      isServerSide: boolean
    }
  >()

  /**
   * Map cache for processed children, keyed by a stable string signature.
   * Used for non-object cases or as a fallback. Each entry stores the processed children and a server-side flag.
   */
  private static _processedChildrenMapCache = new Map<
    string,
    {
      children: Children
      isServerSide: boolean
    }
  >()

  /** Maximum number of entries in the Map cache to prevent unbounded growth */
  private static readonly _MAX_PROCESSED_CHILDREN_CACHE = 1000

  /**
   * Constructs a new BaseNode instance.
   *
   * This constructor initializes a node with a given React element or component type
   * and the raw props passed to it. The props are not processed until they are
   * accessed via the `props` getter, allowing for lazy evaluation.
   * @param element The React element or component type this node will represent.
   * @param rawProps The initial, unprocessed props for the element.
   */
  constructor(element: E, rawProps: RawNodeProps<E> = {}) {
    this.element = element
    this.rawProps = rawProps
  }

  /**
   * Lazily processes and retrieves the final, normalized props for the node.
   *
   * The first time this getter is accessed, it triggers `_processProps` to resolve
   * themes, styles, and children. Subsequent accesses return the cached result
   * until the node is cloned or recreated.
   * @returns The fully processed and normalized `FinalNodeProps`.
   */
  public get props(): FinalNodeProps {
    if (!this._props) {
      this._props = this._processProps()
    }
    return this._props
  }

  /**
   * Performs the core logic of processing raw props into their final, normalized form.
   *
   * This method is called by the `props` getter on its first access. It handles:
   * 1.  **Theme Resolution**: Selects the active theme from `theme` or `nodetheme` props.
   * 2.  **Prop Resolution**: Resolves theme-aware values (functions) in `rawProps` and `nativeProps.style`.
   * 3.  **Style Extraction**: Separates style-related props (`css`, `style`) from other DOM/component props.
   * 4.  **Default Style Merging**: Combines default styles with resolved style props.
   * 5.  **Child Processing**: Normalizes the `children` prop, propagating the theme.
   * @returns The processed `FinalNodeProps` object.
   * @private
   */
  private _processProps(): FinalNodeProps {
    // Destructure raw props into relevant parts
    const { ref, key, children, nodetheme, theme, props: nativeProps = {}, ...restRawProps } = this.rawProps

    const currentTheme = theme || nodetheme

    const { style: nativeStyle, ...restNativeProps } = nativeProps as Omit<PropsOf<E>, 'children'>

    const resolvedRawProps = resolveObjWithTheme(restRawProps, currentTheme)
    const resolvedNativeStyle = resolveObjWithTheme(nativeStyle, currentTheme)
    const { style: resolvedStyleProps, css, ...themeAwareProps } = resolvedRawProps

    const styleProps = getCSSProps(themeAwareProps)
    const domProps = getDOMProps(themeAwareProps)

    const finalStyleProps = resolveDefaultStyle({
      ...styleProps,
      ...resolvedStyleProps,
    })

    // Process children while maintaining theme inheritance
    const normalizedChildren = this._processChildren(children, currentTheme)

    // Combine processed props into final normalized form
    return {
      ref,
      key,
      nodetheme: currentTheme,
      theme,
      css: { ...finalStyleProps, ...css },
      style: resolvedNativeStyle,
      ...domProps,
      nativeProps: restNativeProps,
      children: normalizedChildren,
    }
  }

  /**
   * Deeply clones processed children before returning them from cache so that each parent receives
   * independent `BaseNode` instances (prevents sharing cycles and mutation bugs).
   *
   * - If the input is an array, each child is cloned recursively.
   * - If the input is a `BaseNode`, a new instance is created with the same element and copied rawProps.
   * - For other objects/primitives, the value is returned as-is (they are immutable or safe to reuse).
   *
   * This ensures that cached children are never shared between different parents in the React tree.
   * @param processed The processed child or array of children to clone.
   * @returns A deep clone of the processed children, safe for use in multiple parents.
   * @private
   */
  private static _cloneProcessedChildren(processed: Children): Children {
    const cloneOne = (child: NodeElement): NodeElement => {
      if (child instanceof BaseNode) {
        // shallow clone: new BaseNode with same element and copied rawProps
        return new BaseNode(child.element, { ...(child.rawProps as RawNodeProps<any>) })
      }
      // NodeInstance returns its own instances when render() is called - we avoid calling render here.
      // For other objects/primitives, return as-is (they are immutable or safe to reuse).
      return child
    }

    if (Array.isArray(processed)) {
      return processed.map(c => cloneOne(c))
    }
    return cloneOne(processed)
  }

  /**
   * Retrieves cached processed children for a given set of `children` and an optional `theme`.
   *
   * - Skips caching entirely when executed on the server (returns `null`).
   * - Uses a **WeakMap** for identity-based caching when `children` is an object or array,
   * ensuring garbage collection safety.
   * - Falls back to a **Map** keyed by a stable hash of `children` and `theme`
   * for value-based caching.
   * - Only returns cached entries that are **not server-side**.
   * @param children The child node(s) to resolve cached results for.
   * @param theme The theme context that may influence child processing.
   * @returns A cloned version of the cached processed children if available, otherwise `null`.
   * @private
   */
  private _getCachedChildren(children: Children, theme?: Theme) {
    if (BaseNode._isServer) return null // No server caching

    // Compute hash once
    const hash = createStableHash(children, theme)

    // If children is an object (array or object), try identity-keyed WeakMap first
    if (children && typeof children === 'object') {
      const weakEntry = BaseNode._processedChildrenWeakCache.get(children)
      if (weakEntry && weakEntry.hash === hash && !weakEntry.isServerSide) {
        return BaseNode._cloneProcessedChildren(weakEntry.children)
      }
    }

    // Fallback to string-hash Map cache
    const mapEntry = BaseNode._processedChildrenMapCache.get(hash)
    if (mapEntry && !mapEntry.isServerSide) {
      return BaseNode._cloneProcessedChildren(mapEntry.children)
    }

    return null
  }

  /**
   * Caches processed children for a given set of children and theme.
   * This method stores the processed NodeElement(s) in a Map keyed by a stable hash.
   * The cache is bounded to avoid unbounded memory growth.
   * No caching is performed on the server to avoid RSC issues.
   * @param children The original children to cache.
   * @param theme The theme associated with the children.
   * @param processed The processed NodeElement(s) to cache.
   * @private
   */
  private _setCachedChildren(children: Children, theme: Theme | undefined, processed: Children) {
    if (BaseNode._isServer) return

    const hash = createStableHash(children, theme)

    if (children && typeof children === 'object') {
      // Store under identity in WeakMap - GC will collect when children object is unreachable
      BaseNode._processedChildrenWeakCache.set(children, {
        hash,
        children: processed,
        isServerSide: false,
      })
      return
    }

    // Manage bounded Map cache (FIFO eviction)
    if (BaseNode._processedChildrenMapCache.has(hash)) {
      BaseNode._processedChildrenMapCache.set(hash, { children: processed, isServerSide: false })
      return
    }

    if (BaseNode._processedChildrenMapCache.size >= BaseNode._MAX_PROCESSED_CHILDREN_CACHE) {
      const firstKey = BaseNode._processedChildrenMapCache.keys().next().value
      if (firstKey !== undefined) {
        BaseNode._processedChildrenMapCache.delete(firstKey)
      }
    }

    BaseNode._processedChildrenMapCache.set(hash, {
      children: processed,
      isServerSide: false,
    })
  }

  /**
   * Recursively processes raw children, converting them into `BaseNode` instances as needed
   * and propagating the provided theme.
   *
   * This method ensures consistent theme handling for all children and optimizes performance
   * using caching strategies: a Map for client-side and no caching for server-side.
   *
   * - If `children` is an array, each child is processed individually.
   * - If `children` is a single node, it is processed directly.
   * - The processed result is cached on the client to avoid redundant work.
   * @param children The raw child or array of children to process.
   * @param theme The theme to propagate to the children.
   * @returns The processed children, ready for normalization and rendering.
   * @private
   */
  private _processChildren(children: Children, theme?: Theme) {
    if (!children) return undefined

    // Use RSC-safe caching strategy
    const cached = this._getCachedChildren(children, theme)
    if (cached) return cached

    const processed = Array.isArray(children)
      ? children.map((child, index) => this._processRawNode(child, theme, index))
      : this._processRawNode(children, theme)

    // Only cache on client-side
    if (!BaseNode._isServer) {
      this._setCachedChildren(children, theme, processed)
    }

    return processed
  }

  /**
   * Renders a processed `NodeElement` into a `ReactNode`, applying a theme and key if necessary.
   *
   * This static method centralizes the logic for converting various types of processed elements
   * into renderable React nodes. It handles:
   * - `BaseNode` instances: Re-wraps them to apply a new key or theme.
   * - React class components: Wraps them in a new `BaseNode`.
   * - `NodeInstance` objects: Invokes their `render()` method.
   * - React component instances: Invokes their `render()` method.
   * - Functional components: Creates a React element from them.
   * - Other valid `ReactNode` types (strings, numbers, etc.): Returns them as-is.
   * @param processedElement The node element to render.
   * @param passedTheme The theme to propagate.
   * @param passedKey The React key to assign.
   * @returns A renderable `ReactNode`.
   * @private
   * @static
   */
  static _renderProcessedNode(processedElement: NodeElement, passedTheme: Theme | undefined, passedKey?: string) {
    const commonBaseNodeProps: Partial<NodeProps<any>> = {}
    if (passedKey !== undefined) {
      commonBaseNodeProps.key = passedKey
    }

    // 1. BaseNode instance: re-wrap to apply key/theme if needed
    if (processedElement instanceof BaseNode) {
      const nodetheme = processedElement.rawProps?.theme || processedElement.rawProps?.nodetheme || passedTheme
      const existingKey = processedElement.rawProps?.key
      if (existingKey === passedKey && nodetheme === (processedElement.rawProps?.nodetheme || processedElement.rawProps?.theme)) {
        return processedElement.render()
      }

      return new BaseNode(processedElement.element, {
        ...processedElement.rawProps,
        ...commonBaseNodeProps,
        nodetheme,
      }).render()
    }

    // 2. React class component type: wrap in BaseNode
    if (isReactClassComponent(processedElement)) {
      return new BaseNode(processedElement, commonBaseNodeProps).render()
    }

    // 3. NodeInstance object: call its render
    if (isNodeInstance(processedElement)) {
      return processedElement.render()
    }

    // 4. React.Component instance: call its render
    if (processedElement instanceof React.Component) {
      return processedElement.render()
    }

    // 5. Functional component: create element with key
    if (typeof processedElement === 'function') {
      return createElement(processedElement as ElementType, { key: passedKey })
    }

    // 6. Other valid ReactNode types
    return processedElement as ReactNode
  }

  /**
   * Renders the output of a function-as-a-child, ensuring theme propagation.
   *
   * This method is designed to handle "render prop" style children (`() => ReactNode`).
   * It invokes the function, processes its result, and ensures the parent's theme is
   * correctly passed down to any `BaseNode` instances returned by the function.
   * @param props The properties for the function renderer.
   * @param props.render The function to execute to get the child content.
   * @param props.passedTheme The theme to propagate to the rendered child.
   * @param props.processRawNode A reference to the `_processRawNode` method for recursive processing.
   * @returns The rendered `ReactNode`.
   * @private
   */
  private _functionRenderer<E extends ReactNode | NodeInstance<E>>({ render, passedTheme, processRawNode }: FunctionRendererProps<E>) {
    // Invoke the render function to get the child node.
    let result: NodeElement
    try {
      result = render()
    } catch {
      result = null
    }

    // Handle React.Component instance
    if (result instanceof React.Component) {
      const element = result.render()
      const processed = processRawNode(element, passedTheme)
      return BaseNode._renderProcessedNode(processed, passedTheme)
    }

    // Handle BaseNode instance
    if (result instanceof BaseNode || isNodeInstance(result)) {
      const bnResult = result
      if (bnResult.rawProps?.nodetheme === undefined && passedTheme !== undefined) {
        return new BaseNode(bnResult.element, {
          ...bnResult.rawProps,
          nodetheme: passedTheme,
        }).render()
      }
      return bnResult.render()
    }

    // Process other result types
    const processedResult = processRawNode(result, passedTheme)

    if (processedResult) return BaseNode._renderProcessedNode(processedResult, passedTheme)

    return result
  }

  /**
   * Generates a stable key for a node, especially for elements within an array.
   *
   * If an `existingKey` is provided, it is returned. Otherwise, a key is generated
   * based on the element's type name and its index within a list of siblings.
   * This helps prevent re-rendering issues in React when dealing with dynamic lists.
   * @param options The options for key generation.
   * @param options.nodeIndex The index of the node in an array of children.
   * @param options.element The element for which to generate a key.
   * @param options.existingKey An existing key, if one was already provided.
   * @param options.children The children of the node, used to add complexity to the key.
   * @returns A React key, or `undefined` if no key could be generated.
   * @private
   */
  private _generateKey = ({
    nodeIndex,
    element,
    existingKey,
    children,
  }: {
    nodeIndex?: number
    element: NodeElement
    existingKey?: string | null
    children?: Children
  }): string => {
    if (existingKey) return existingKey
    const elementName = getElementTypeName(element)

    let generatedKey: string
    if (Array.isArray(children) && children.length > 0) {
      generatedKey = nodeIndex !== undefined ? `${elementName}-${nodeIndex}-${children.length}` : `${elementName}-${children.length}`
    } else if (nodeIndex !== undefined) {
      generatedKey = `${elementName}-${nodeIndex}`
    } else {
      generatedKey = elementName
    }

    return generatedKey
  }

  /**
   * Processes a single raw node, recursively converting it into a `BaseNode` or other renderable type.
   *
   * This is a central method for normalizing children. It handles various types of input:
   * - **`BaseNode` instances**: Re-creates them to ensure the correct theme and key are applied.
   * - **Primitives**: Returns strings, numbers, booleans, null, and undefined as-is.
   * - **Functions (Render Props)**: Wraps them in a `BaseNode` that uses `_functionRenderer` to delay execution.
   * - **Valid React Elements**: Converts them into `BaseNode` instances, extracting props and propagating the theme.
   * - **React Component Types**: Wraps them in a `BaseNode` with the parent theme.
   * - **React Component Instances**: Renders them and processes the output recursively.
   *
   * It also generates a stable key for elements within an array if one is not provided.
   * @param rawNode The raw child node to process.
   * @param parentTheme The theme inherited from the parent.
   * @param nodeIndex The index of the child if it is in an array, used for key generation.
   * @returns A processed `NodeElement` (typically a `BaseNode` instance or a primitive).
   * @private
   */
  private _processRawNode(
    rawNode: NodeElement,
    parentTheme?: Theme,
    nodeIndex?: number, // Index for generating stable keys for array children
  ): NodeElement {
    const componentType = getComponentType(rawNode) // Determine the type of the raw node

    // Case 1: Child is already a BaseNode instance
    if (rawNode instanceof BaseNode) {
      const childInstance = rawNode
      const childRawProps = childInstance.rawProps || {} // Get initial raw props of the child
      const themeForNewNode = childRawProps.theme || childRawProps.nodetheme || parentTheme // Prefer child's own theme

      // Check if we can reuse the existing node
      if (childRawProps.nodetheme === themeForNewNode && childRawProps.key !== undefined) {
        return childInstance
      }

      const keyForChildNode = this._generateKey({ nodeIndex, element: childInstance.element, existingKey: childRawProps.key, children: childRawProps.children }) // Generate key if needed

      return new BaseNode(childInstance.element, {
        ...childRawProps,
        nodetheme: themeForNewNode, // Use the determined theme for the new node
        key: keyForChildNode,
      }) // Create a new BaseNode with merged props and theme
    }

    // Case 2: Child is a primitive (string, number, boolean, null, undefined)
    if (componentType === 'string' || componentType === 'number' || componentType === 'boolean' || rawNode === null || rawNode === undefined) {
      return rawNode as string | number | boolean | null | undefined
    }

    // Case 3: Child is a function that needs to be called during render (FunctionRenderer).
    if (componentType === 'function' && !isReactClassComponent(rawNode) && !isMemo(rawNode) && !isForwardRef(rawNode)) {
      // The key is for the BaseNode that wraps the _functionRenderer component.
      // Functions themselves don't have a .key prop that we can access here.
      const keyForFunctionRenderer = this._generateKey({ nodeIndex, element: this._functionRenderer as NodeElement }) // Generate key for function renderer

      return new BaseNode(this._functionRenderer, {
        processRawNode: this._processRawNode.bind(this),
        render: rawNode as never,
        passedTheme: parentTheme,
        key: keyForFunctionRenderer,
      })
    }

    // Case 4: Child is a React Element (JSX element like <div> or <MyComponent>)
    if (isValidElement(rawNode)) {
      const { style: childStyleObject, ...otherChildProps } = rawNode.props as ComponentProps<any>

      // Combine top-level props from the element with its flattened style object properties
      const combinedProps = { ...otherChildProps, ...(childStyleObject || {}) }

      const themeForChild = combinedProps.theme || combinedProps.nodetheme || parentTheme
      const keyForChildNode = this._generateKey({ nodeIndex, element: rawNode.type as ElementType, existingKey: rawNode.key, children: combinedProps.children })

      return new BaseNode(rawNode.type as ElementType, {
        ...combinedProps, // Pass the combined props
        nodetheme: themeForChild,
        key: keyForChildNode,
      })
    }

    // Case 5: Child is an ElementType (string tag, class component, Memo/ForwardRef)
    if (isReactClassComponent(rawNode) || (componentType === 'object' && (isMemo(rawNode) || isForwardRef(rawNode)))) {
      // ElementTypes don't have an intrinsic key from the rawNode itself.
      const keyForChildNode = this._generateKey({
        nodeIndex,
        element: rawNode as ElementType,
        children: typeof rawNode === 'object' && 'props' in rawNode ? rawNode.props?.children : undefined,
      })
      return new BaseNode(rawNode as ElementType, {
        nodetheme: parentTheme, // Apply parent theme
        key: keyForChildNode,
      })
    }

    // Case 6: Handle instances of React.Component
    if ((rawNode as unknown as React.Component) instanceof React.Component) {
      const element = (rawNode as unknown as React.Component).render()
      // Recursively process the rendered element with a parent theme and index if available
      return this._processRawNode(element, parentTheme, nodeIndex)
    }

    // Case 7: Fallback for other ReactNode types (e.g., Fragments, Portals if not caught by isValidElement)
    // These are returned as-is. If they are elements within an array, React expects them to have keys.
    // This logic primarily adds keys to BaseNode instances we create, other ReactNodes are returned as-is.
    return rawNode
  }

  /**
   * Normalizes a processed child node into a final, renderable `ReactNode`.
   *
   * This method is called during the `render` phase. It takes a child that has already
   * been processed by `_processChildren` and prepares it for `React.createElement`.
   *
   * - For `BaseNode` instances, it calls their `render()` method, ensuring the theme is consistent.
   * - It validates that other children are valid React element types.
   * - Primitives and other valid nodes are returned as-is.
   * @param child The processed child node to normalize.
   * @returns A renderable `ReactNode`.
   * @throws {Error} If the child is not a valid React element type.
   * @private
   */
  private _normalizeChild = (child: NodeElement): ReactNode => {
    // Handle null/undefined quickly
    if (child === null || child === undefined) return child

    // Primitives should be returned as-is (text nodes, numbers, booleans)
    const t = typeof child
    if (t === 'string' || t === 'number' || t === 'boolean') return child as ReactNode

    const currentTheme = this.rawProps?.nodetheme || this.rawProps?.theme || this.props.nodetheme || this.props.theme

    // For BaseNode instances, apply current theme if child has no theme
    if (child instanceof BaseNode) {
      if (!child.rawProps?.nodetheme && currentTheme !== undefined) {
        return new BaseNode(child.element, {
          ...child.rawProps,
          nodetheme: currentTheme,
        }).render()
      }
      return child.render()
    }

    // Validate element type before returning
    if (!isValidElementType(child)) {
      const elementType = getComponentType(child)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    // Return valid React elements as-is
    return child as ReactNode
  }

  /**
   * Renders the `BaseNode` into a `ReactElement`.
   *
   * This method is the final step in the rendering pipeline. It constructs a React element
   * by:
   * 1.  Validating that the node's `element` type is renderable.
   * 2.  Normalizing processed children into `ReactNode`s using `_normalizeChild`.
   * 3.  Caching normalized children to avoid re-processing on subsequent renders.
   * 4.  Assembling the final props, including `key`, `style`, and other attributes.
   * 5.  If the element has a `css` prop, it may be wrapped in a `StyledRenderer` to handle
   * CSS-in-JS styling.
   * 6.  Finally, calling `React.createElement` with the element, props, and children.
   * @returns The rendered `ReactElement`.
   * @throws {Error} If the node's `element` is not a valid React element type.
   */
  public render(): ReactElement<FinalNodeProps> {
    if (!isValidElementType(this.element)) {
      const elementType = getComponentType(this.element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    // Extract children and key
    const { children: childrenInProps, key, nativeProps, ...otherProps } = this.props

    let finalChildren: ReactNode = undefined

    if (childrenInProps !== undefined && childrenInProps !== null) {
      if (!this._normalizedChildren || this._childrenHash !== createStableHash(childrenInProps, this.props.nodetheme || this.props.theme)) {
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

    // Prepare props for React.createElement
    let propsForCreateElement: Omit<FinalNodeProps, 'children'>
    if (this.element === Fragment || isFragment(this.element)) {
      propsForCreateElement = { key }
    } else {
      propsForCreateElement = {
        ...(otherProps as ComponentProps<ElementType>),
        key,
        ...nativeProps,
        suppressHydrationWarning: true,
      }
    }

    // If the element has a `css` prop and has style tag, render using the `StyledRenderer` component
    // This enables emotion-based style handling for the element
    if (this.element && !hasNoStyleTag(this.element) && propsForCreateElement.css) {
      const props = {
        element: this.element,
        ...propsForCreateElement,
      }

      try {
        const displayName = getElementTypeName(props.element)
        StyledRenderer.displayName = `Styled(${displayName})`
      } catch {
        // swallow: displayName is not critical
      }

      return createElement(StyledRenderer, props, finalChildren as ReactNode)
    }

    try {
      ;(this.element as NodeElement & { displayName: string }).displayName = getElementTypeName(this.element)
    } catch {
      // swallow: displayName is not critical
    }
    return createElement(this.element as ElementType, propsForCreateElement, finalChildren)
  }

  /**
   * Ensures the necessary DOM elements for portal rendering are created and attached.
   *
   * On the client-side, this method checks for or creates a `div` element appended
   * to the `document.body` and initializes a React root on it. This setup is
   * required for the `toPortal` method to function. It is idempotent and safe
   * to call multiple times.
   * @returns `true` if the portal infrastructure is ready, `false` if on the server.
   * @private
   */
  private _ensurePortalInfrastructure() {
    if (BaseNode._isServer) return false

    // If both exist and DOM is connected, we're ready
    if (this._portalDOMElement && this._portalReactRoot && this._portalDOMElement.isConnected) return true

    // If DOM element exists but isn't connected, clear both DOM element and root
    if (this._portalDOMElement && !this._portalDOMElement.isConnected) {
      // attempt to unmount root if present
      if (this._portalReactRoot) {
        try {
          this._portalReactRoot.unmount()
        } catch {
          // swallow: unmount might fail if already removed; avoid breaking the app
        }
        this._portalReactRoot = null
      }
      this._portalDOMElement = null
    }

    // Create DOM element if needed
    if (!this._portalDOMElement) {
      this._portalDOMElement = document.createElement('div')
      document.body.appendChild(this._portalDOMElement)
    }

    // Create react root if needed
    if (!this._portalReactRoot) {
      if (!this._portalDOMElement) return false
      this._portalReactRoot = createRoot(this._portalDOMElement)
    }

    return true
  }

  /**
   * Renders the node into a React Portal.
   *
   * This method mounts the node's rendered content into a separate DOM tree
   * attached to the `document.body`. It's useful for rendering components like
   * modals, tooltips, or notifications that need to appear above other UI elements.
   *
   * The returned object includes an `unmount` function to clean up the portal.
   * @returns A `ReactDOMRoot` instance for managing the portal, or `null` if
   * called in a server-side environment. The returned instance is enhanced
   * with a custom `unmount` method that also cleans up the associated DOM element.
   */
  public toPortal(): ReactDOMRoot | null {
    if (!this._ensurePortalInfrastructure() || !this._portalReactRoot) return null

    const content = this.render()
    this._portalReactRoot.render(content)

    // Augment the actual root's unmount to also clean up the DOM element and internal refs.
    try {
      const originalUnmount = this._portalReactRoot.unmount.bind(this._portalReactRoot)
      this._portalReactRoot.unmount = () => {
        try {
          originalUnmount()
        } catch {
          // swallow: original unmount might throw in edge cases
        }
        // Clear references and remove DOM element
        if (this._portalDOMElement) {
          if (this._portalDOMElement.parentNode) {
            this._portalDOMElement.parentNode.removeChild(this._portalDOMElement)
          }
          this._portalDOMElement = null
        }
        this._portalReactRoot = null
      }
    } catch {
      // swallow: if anything goes wrong while patching, still return the root
    }

    return this._portalReactRoot
  }
}

/**
 * Factory function to create a `BaseNode` instance.
 * @template AdditionalProps Additional props to merge with node props.
 * @template E The React element or component type.
 * @param element The React element or component type to wrap.
 * @param props The props for the node (optional).
 * @param additionalProps Additional props to merge into the node (optional).
 * @returns A new `BaseNode` instance as a `NodeInstance<E>`.
 */
export function Node<AdditionalProps extends Record<string, any>, E extends NodeElement>(
  element: E,
  props: MergedProps<E, AdditionalProps> = {} as MergedProps<E, AdditionalProps>,
  additionalProps: AdditionalProps = {} as AdditionalProps,
): NodeInstance<E> {
  const finalProps = { ...props, ...additionalProps } as RawNodeProps<E> & AdditionalProps
  if (finalProps.theme && !finalProps.nodetheme) {
    finalProps.nodetheme = finalProps.theme
  }

  return new BaseNode(element, finalProps)
}

/**
 * Creates a curried node factory for a given React element or component type.
 *
 * Returns a function that, when called with props, produces a `NodeInstance<E>`.
 * Useful for creating reusable node factories for specific components or element types.
 * @template AdditionalInitialProps Additional initial props to merge with node props.
 * @template E The React element or component type.
 * @param element The React element or component type to wrap.
 * @param initialProps Initial props to apply to every node instance.
 * @returns A function that takes node props and returns a `NodeInstance<E>`.
 * @example
 * const ButtonNode = createNode('button', { type: 'button' });
 * const myButton = ButtonNode({ children: 'Click me', style: { color: 'red' } });
 */
export function createNode<AdditionalInitialProps extends Record<string, any>, E extends NodeElement>(
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
 *
 * Useful for ergonomic creation of nodes where children are the primary concern,
 * such as layout or container components.
 *
 * The returned function takes `children` as the first argument and `props` (excluding `children`) as the second.
 * It merges any `initialProps` provided at factory creation, then creates a `BaseNode` instance.
 *
 * Type parameters:
 * - `AdditionalInitialProps`: Extra props to merge with node props.
 * - `E`: The React element or component type.
 * @param element The React element or component type to wrap.
 * @param initialProps Initial props to apply to every node instance (excluding `children`).
 * @returns A function that takes `children` and `props`, returning a `NodeInstance<E>`.
 * @example
 * const Text = createChildrenFirstNode('p');
 * const myDiv = Text('Hello', { className: 'text-lg' });
 */
export function createChildrenFirstNode<AdditionalInitialProps extends Record<string, any>, E extends ElementType>(
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
