'use strict'
import React, { Fragment, type ComponentProps, createElement, type ElementType, isValidElement, type Key, type ReactNode, type ReactElement } from 'react'
import type {
  FinalNodeProps,
  FunctionRendererProps,
  HasRequiredProps,
  NodeElement,
  NodeInstance,
  NodeProps,
  PropsOf,
  RawNodeProps,
  Theme,
} from '@src/node.type'
import { isNodeInstance, resolveDefaultStyle, resolveObjWithTheme } from '@src/node.helper'
import { isForwardRef, isFragment, isMemo, isReactClassComponent, isValidElementType } from '@src/react-is.helper'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName } from '@src/common.helper'

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

  /** Processed props after theme resolution, style processing, and child normalization */
  public props: FinalNodeProps

  /** Flag to identify BaseNode instances */
  public readonly isBaseNode = true

  /** DOM element used for portal rendering */
  private _portalDOMElement: HTMLDivElement | null = null

  /** React root instance for portal rendering */
  private _portalReactRoot: ReactDOMRoot | null = null

  /**
   * Creates a new BaseNode instance that wraps a React element.
   * Processes raw props by:
   * - Extracting and resolving theme-aware styles
   * - Processing DOM-related props
   * - Normalizing children with theme inheritance
   * @param element The React element/component to wrap
   * @param rawProps Initial props including theme, styles, and children
   */
  constructor(element: E, rawProps: RawNodeProps<E> = {}) {
    this.element = element
    this.rawProps = rawProps

    // Destructure raw props into relevant parts
    const { ref, key, children, nodetheme, theme, props: nativeProps = {}, ...restRawProps } = rawProps

    const currentTheme = theme || nodetheme

    const { style: componentStyle, theme: nativeTheme, ...componentProps } = nativeProps as Omit<PropsOf<E>, 'children'>

    const resolveAbleProps = { ...restRawProps, style: { ...restRawProps?.style, ...componentStyle } }

    const resolvedRawProps = resolveObjWithTheme(resolveAbleProps, currentTheme)

    const { style: styleFromResolvedProps, ...themeAwareProps } = resolvedRawProps

    const styleProps = getCSSProps(themeAwareProps)
    const domProps = getDOMProps(themeAwareProps)

    const finalStyleProps = resolveDefaultStyle({
      ...styleProps,
      ...styleFromResolvedProps,
    })

    // Process children while maintaining theme inheritance
    const normalizedChildren = this._processChildren(children, currentTheme)

    // Combine processed props into final normalized form
    this.props = {
      ref,
      key,
      nodetheme: currentTheme,
      theme: nativeTheme || theme,
      style: finalStyleProps,
      ...domProps,
      ...componentProps,
      children: normalizedChildren,
    }
  }

  private _processChildren(children: NodeElement | NodeElement[], theme?: Theme) {
    if (!children) return undefined

    if (Array.isArray(children)) {
      // Process array of children with index for stable keys
      return children.map((child, index) => this._processRawNode(child, theme, index))
    } else {
      // Process single child
      return this._processRawNode(children, theme)
    }
  }

  /**
   * Renders a processed NodeElement into a ReactNode, applying theme and key if needed.
   *
   * Handles the following cases:
   * 1. If the element is a BaseNode instance, it re-wraps it to apply the key and theme if needed.
   * 2. If the element is a React class component type, it wraps it in a BaseNode.
   * 3. If the element is a NodeInstance object, it calls its render method.
   * 4. If the element is a React.Component instance, it calls its render method.
   * 5. If the element is a functional component, it creates a React element with the provided key.
   * 6. For all other valid ReactNode types, it returns the element as-is.
   * @param processedElement The processed node element to render.
   * @param passedTheme The theme to apply, if any.
   * @param passedKey The key to assign, if any.
   * @returns The rendered ReactNode.
   */
  static _renderProcessedNode(processedElement: NodeElement, passedTheme: Theme | undefined, passedKey: string | undefined): ReactNode {
    const commonBaseNodeProps: Partial<NodeProps<any>> = {}
    if (passedKey !== undefined) {
      commonBaseNodeProps.key = passedKey
    }

    // 1. BaseNode instance: re-wrap to apply key/theme if needed
    if (processedElement instanceof BaseNode) {
      const nodetheme = processedElement.rawProps?.theme || processedElement.rawProps?.nodetheme || passedTheme
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
   * Renders the result of a function child, supporting theme propagation.
   *
   * Used for children that are functions (`() => Children`). If the returned value is a `BaseNode`
   * without an explicit theme, the parent theme is injected. Otherwise, the result is rendered as-is.
   * @template E - The type of ReactNode or NodeInstance.
   * @param props Renderer props.
   * @param props.render Function to invoke for rendering the child.
   * @param props.passedTheme Theme to provide to the child, if applicable.
   * @param props.passedKey Key to assign to the rendered node.
   * @param props.processRawNode Function to process raw nodes.
   * @returns The rendered ReactNode, with theme applied if necessary.
   */
  private _functionRenderer<E extends ReactNode | NodeInstance<E>>({ render, passedTheme, passedKey, processRawNode }: FunctionRendererProps<E>): ReactNode {
    // Invoke the render function to get the child node.
    const result = render()

    // Handle React.Component instance
    if (result instanceof React.Component) {
      const element = result.render()
      const processed = processRawNode(element, passedTheme)
      return BaseNode._renderProcessedNode(processed, passedTheme, passedKey)
    }

    // Handle BaseNode instance
    if (result instanceof BaseNode || isNodeInstance(result)) {
      const bnResult = result
      if (bnResult.rawProps?.nodetheme === undefined && passedTheme !== undefined) {
        return new BaseNode(bnResult.element, {
          key: passedKey,
          ...bnResult.rawProps,
          nodetheme: passedTheme,
        }).render()
      }
      return bnResult.render()
    }

    // Process other result types
    const processedResult = processRawNode(result, passedTheme)

    if (processedResult) return BaseNode._renderProcessedNode(processedResult, passedTheme, passedKey)

    return result
  }

  /**
   * Processes a single raw child element, converting it into a ProcessedChild.
   * If the child is part of an array and lacks an explicit key, a stable indexed key
   * (`elementName_child_index`) is generated for new BaseNode instances.
   * @param rawNode The raw child element to process.
   * @param parentTheme The theme inherited from the parent node.
   * @param childIndex Optional index of the child if it's part of an array.
   * @returns The processed child.
   */
  public _processRawNode(
    rawNode: NodeElement,
    parentTheme?: Theme,
    childIndex?: number, // Index for generating stable keys for array children
  ): NodeElement {
    const componentType = getComponentType(rawNode) // Determine the type of the raw node

    // Helper to generate an indexed key if no explicit key is present and an index is available.
    const generateIndexedKeyIfNeeded = (element: NodeElement, existingKey?: Key | null): Key | null | undefined => {
      if (existingKey !== undefined && existingKey !== null) {
        return existingKey
      }
      if (childIndex !== undefined) {
        const elementName = getElementTypeName(element) // Get element type name for key generation
        return `${elementName}-${childIndex}`
      }
      return undefined // No explicit key, and not an array child, so BaseNode constructor will handle.
    }

    // Case 1: Child is already a BaseNode instance
    if (rawNode instanceof BaseNode) {
      const childInstance = rawNode
      const childRawProps = childInstance.rawProps || {} // Get initial raw props of the child
      const themeForNewNode = childRawProps.theme || childRawProps.nodetheme || parentTheme // Prefer child's own theme

      const keyForChildNode = generateIndexedKeyIfNeeded(childInstance.element, childRawProps.key)

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
      const keyForFunctionRenderer = generateIndexedKeyIfNeeded(this._functionRenderer, undefined) // Generate key for function renderer

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
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode.type as ElementType, rawNode.key)

      return new BaseNode(rawNode.type as ElementType, {
        ...combinedProps, // Pass the combined props
        nodetheme: themeForChild,
        key: keyForChildNode,
      })
    }

    // Case 5: Child is an ElementType (string tag, class component, Memo/ForwardRef)
    if (isReactClassComponent(rawNode) || (componentType === 'object' && (isMemo(rawNode) || isForwardRef(rawNode)))) {
      // ElementTypes don't have an intrinsic key from the rawNode itself.
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode as ElementType, undefined)
      return new BaseNode(rawNode as ElementType, {
        nodetheme: parentTheme, // Apply parent theme
        key: keyForChildNode,
      })
    }

    // Case 6: Handle instances of React.Component
    if ((rawNode as unknown as React.Component) instanceof React.Component) {
      const element = (rawNode as unknown as React.Component).render()
      // Recursively process the rendered element with a parent theme and index if available
      return this._processRawNode(element, parentTheme, childIndex)
    }

    // Case 7: Fallback for other ReactNode types (e.g., Fragments, Portals if not caught by isValidElement)
    // These are returned as-is. If they are elements within an array, React expects them to have keys.
    // This logic primarily adds keys to BaseNode instances we create, other ReactNodes are returned as-is.
    return rawNode
  }

  /**
   * Normalizes a child node into a renderable ReactNode.
   * Processes different types of child nodes to ensure they can be properly rendered
   * while maintaining theme inheritance.
   *
   * Handles:
   * - BaseNode instances (applies theme if needed)
   * - React.Component instances (applies theme if needed)
   * - Other valid React element types (returned as-is)
   * - null/undefined values (returned as-is)
   * @param child The child node to normalize into a renderable form
   * @returns The normalized ReactNode that can be rendered by React
   * @throws Error if child is an invalid element type
   */
  private _normalizeChild = (child: NodeElement): ReactNode => {
    if (!child) return child

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
   * Converts this BaseNode instance into a renderable React node.
   * Recursively processes child nodes and uses `React.createElement` to construct the final React element.
   * @returns A ReactNode representing the rendered element.
   */
  public render(): ReactElement {
    if (!isValidElementType(this.element)) {
      const elementType = getComponentType(this.element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    const { children: childrenInProps, key, ...otherProps } = this.props // Extract children and key

    let finalChildren: ReactNode = undefined

    if (childrenInProps !== undefined && childrenInProps !== null) {
      if (Array.isArray(childrenInProps)) {
        if (childrenInProps.length > 0) {
          // Normalize each child in the array
          const mappedArray = childrenInProps.map(child => this._normalizeChild(child as NodeElement))

          // Check if all children are null/undefined (e.g., conditional rendering resulted in nothing)
          if (mappedArray.every(child => child === null || child === undefined)) {
            finalChildren = undefined
          } else {
            finalChildren = mappedArray
          }
        } else {
          finalChildren = undefined // Empty array of children
        }
      } else {
        // Single child
        finalChildren = this._normalizeChild(childrenInProps as NodeElement)
      }
    }

    // Prepare props for React.createElement
    let propsForCreateElement: ComponentProps<ElementType> & { key?: Key }
    if (this.element === Fragment || isFragment(this.element)) {
      propsForCreateElement = { key }
    } else {
      propsForCreateElement = {
        ...(otherProps as ComponentProps<ElementType>),
        key,
      }
    }

    return createElement(this.element as ElementType, propsForCreateElement, finalChildren)
  }

  private _ensurePortalInfrastructure() {
    if (typeof window === 'undefined') return false

    if (this._portalDOMElement && this._portalReactRoot) return true

    if (this._portalDOMElement && !this._portalDOMElement.isConnected) {
      this._portalDOMElement = null
      this._portalDOMElement = null
    }

    if (!this._portalDOMElement) {
      this._portalDOMElement = document.createElement('div')
      document.body.appendChild(this._portalDOMElement)
    }

    if (!this._portalReactRoot) {
      if (!this._portalDOMElement) return false
      this._portalReactRoot = createRoot(this._portalDOMElement)
    }
    return true
  }

  public toPortal(): ReactDOMRoot | null {
    if (!this._ensurePortalInfrastructure() || !this._portalReactRoot) return null

    const content = this.render()
    this._portalReactRoot.render(content)

    return {
      ...this._portalReactRoot,
      unmount: () => {
        if (this._portalReactRoot) {
          this._portalReactRoot.unmount()
          this._portalReactRoot = null
        }
        if (this._portalDOMElement) {
          if (this._portalDOMElement.parentNode) {
            this._portalDOMElement.parentNode.removeChild(this._portalDOMElement)
          }
          this._portalDOMElement = null
        }
      },
    }
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
  props: NodeProps<E> & AdditionalProps = {} as NodeProps<E> & AdditionalProps,
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
 * Returns a function that, when called with props, produces a `BaseNode` instance.
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
  initialProps?: NodeProps<E> & AdditionalInitialProps,
): HasRequiredProps<PropsOf<E>> extends true
  ? <AdditionalProps extends Record<string, any> = Record<string, any>>(props: NodeProps<E> & AdditionalProps) => NodeInstance<E>
  : <AdditionalProps extends Record<string, any> = Record<string, any>>(props?: NodeProps<E> & AdditionalProps) => NodeInstance<E> {
  return <AdditionalProps extends Record<string, any> = Record<string, any>>(props?: NodeProps<E> & AdditionalProps) =>
    Node(element, { ...initialProps, ...props } as NodeProps<E> & AdditionalProps)
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
  initialProps?: Omit<NodeProps<E> & AdditionalInitialProps, 'children'>,
): HasRequiredProps<PropsOf<E>> extends true
  ? <AdditionalProps extends Record<string, any> = Record<string, any>>(
      children: NodeElement | NodeElement[],
      props: Omit<NodeProps<E> & AdditionalProps, 'children'>,
    ) => NodeInstance<E>
  : <AdditionalProps extends Record<string, any> = Record<string, any>>(
      children?: NodeElement | NodeElement[],
      props?: Omit<NodeProps<E> & AdditionalProps, 'children'>,
    ) => NodeInstance<E> {
  return <AdditionalProps extends Record<string, any> = Record<string, any>>(
    children?: NodeElement | NodeElement[],
    props?: Omit<NodeProps<E> & AdditionalProps, 'children'>,
  ) => Node(element, { ...initialProps, ...props, children } as NodeProps<E> & AdditionalProps)
}
