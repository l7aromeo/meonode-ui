'use strict'
import React, { ComponentProps, createElement, CSSProperties, ElementType, isValidElement, Key, ReactNode } from 'react'
import { BaseNodeInstance, BaseNodeProps, FunctionRendererProps, NodeElement, NodeProps, OriginalNodeProps, Theme } from '@src/node.type.js'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, getValueByPath } from '@src/node.helper.js'
import { isForwardRef, isMemo, isReactClassComponent, isValidElementType } from '@src/react-is.helper.js'

/**
 * Represents a node in a React component tree, providing a structured way to define and manipulate
 * React elements before they are rendered. Handles props processing, theme application, and child node management.
 * @template E The type of the React element this node represents (e.g., 'div', a custom component).
 */
class BaseNode<E extends NodeElement> implements BaseNodeInstance<E> {
  /** The React element type for this node. */
  public element: E

  /** The original, unprocessed props passed to this node during construction. */
  public rawProps?: BaseNodeProps<E>

  /** The processed props for this node, including styles, DOM attributes, and children. */
  public props: OriginalNodeProps

  /**
   * Constructs a new BaseNode instance.
   * @param element The React element type.
   * @param rawProps The raw props for the node.
   */
  constructor(element: E, rawProps?: BaseNodeProps<E>) {
    this.element = element
    this.rawProps = rawProps

    const { children: rawNoderen, nodeTheme: currentTheme, ...otherRawProps } = rawProps || {}

    // 1. Resolve styles and DOM props for this node
    const ownCssProps = getCSSProps(otherRawProps as Record<string, any>)
    let resolvedStyle = this._resolveStyleWithTheme(ownCssProps, currentTheme)
    resolvedStyle = Object.keys(resolvedStyle).length > 0 ? resolvedStyle : {}

    const domProps = getDOMProps(otherRawProps as Record<string, any>)

    // 2. Process rawNoderen into BaseNode instances or primitives, passing down currentTheme
    let processedChildrenResult: NodeElement | NodeElement[] = undefined
    if (rawNoderen !== undefined && rawNoderen !== null) {
      if (Array.isArray(rawNoderen)) {
        const childrenArray = rawNoderen as NodeElement[]
        processedChildrenResult = childrenArray.map(
          (child, index) => this._processRawNode(child, currentTheme, index), // Pass index for array children
        )
      } else {
        // For a single child, no index is passed; existing key logic in _processRawNode will apply
        processedChildrenResult = this._processRawNode(rawNoderen, currentTheme)
      }
    }

    // 3. Construct final this.props
    this.props = {
      ...domProps,
      style: resolvedStyle,
      nodeTheme: currentTheme,
      children: processedChildrenResult,
    }
  }

  /**
   * Resolves style properties by replacing theme path placeholders with actual theme values.
   * Handles complex strings like '1px solid theme.background.primary' and iterative resolution.
   * @param initialCssProps The initial CSS properties object.
   * @param theme The theme object to use for resolving paths.
   * @returns A new CSSProperties object with theme values resolved.
   */
  private _resolveStyleWithTheme(initialCssProps: CSSProperties, theme?: Theme): CSSProperties {
    // If no theme is provided or there are no initial CSS props to process, return the initial props.
    if (!theme || Object.keys(initialCssProps).length === 0) {
      return initialCssProps
    }

    const styleWithTheme = { ...initialCssProps } // Create a mutable copy

    for (const styleKey in styleWithTheme) {
      if (Object.prototype.hasOwnProperty.call(styleWithTheme, styleKey)) {
        const styleValue = styleWithTheme[styleKey as keyof CSSProperties]

        if (typeof styleValue === 'string' && styleValue.includes('theme.')) {
          let processedValue = styleValue

          // Iteratively resolve theme references within the string
          processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
            const themeValue = getValueByPath(theme, path) // Use 'theme' passed to the function

            // Replace if themeValue is found and is a string or number.
            // null is explicitly excluded to avoid 'null' string in output unless intended.
            if (themeValue !== undefined && themeValue !== null && (typeof themeValue === 'string' || typeof themeValue === 'number')) {
              return String(themeValue)
            }
            // If themeValue is not a string/number, or is undefined/null, keep the original placeholder
            return match
          })
          ;(styleWithTheme as any)[styleKey] = processedValue
        }
      }
    }
    return styleWithTheme
  }

  /**
   * React component that renders the result of a function child, supporting theme propagation.
   *
   * This component is used to render children that are functions (i.e., `() => Children`).
   * It ensures that if the returned value is a `BaseNode` instance without an explicit theme,
   * the theme from the parent is injected. Otherwise, the result is rendered as-is.
   * @param props The props for the renderer.
   * @param props.render The function to invoke for rendering the child.
   * @param props.passedTheme The theme to provide to the child, if applicable.
   * @returns The rendered ReactNode, with theme applied if necessary.
   */
  private _functionRenderer<E extends ReactNode | BaseNodeInstance<E>>({
    render,
    passedTheme,
    passedKey,
    processRawNode,
  }: FunctionRendererProps<E>): NodeElement {
    // Call the user-provided render function to get the child.
    const result = render()

    if (result instanceof React.Component) {
      const element = result.render()
      const processed = processRawNode(element, passedTheme)
      if (processed instanceof BaseNode) {
        return processed.render()
      }
      return processed
    }

    if (result instanceof BaseNode) {
      const bnResult = result as BaseNodeInstance

      // If the returned BaseNode does not have its own theme, but a theme is provided,
      // re-create the node with the provided theme to ensure correct theme propagation.
      if (bnResult.rawProps?.nodeTheme === undefined && passedTheme !== undefined) {
        return new BaseNode(bnResult.element, {
          ...(bnResult.rawProps || {}),
          nodeTheme: passedTheme,
          theme: passedTheme, // Also pass theme for consistency if it was used in rawProps
          key: passedKey,
        }).render()
      }
      // If the node already has a theme or no theme is provided, render as-is.
      return bnResult.render()
    }

    // If the result is not a BaseNode (e.g., JSX, string, etc.), return it directly.
    // Note: Non-BaseNode results will not automatically receive the theme.
    return result as ReactNode
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
  private _processRawNode(
    rawNode: NodeElement,
    parentTheme?: Theme,
    childIndex?: number, // Index for generating stable keys for array children
  ): NodeElement {
    const componentType = getComponentType(rawNode)

    // Helper to generate an indexed key if no explicit key is present and an index is available.
    const generateIndexedKeyIfNeeded = (element: NodeElement, existingKey?: Key | null): Key | null | undefined => {
      if (existingKey !== undefined && existingKey !== null) {
        return existingKey
      }
      if (childIndex !== undefined) {
        const elementName = getElementTypeName(element)
        return `${elementName}-${childIndex}`
      }
      return undefined // No explicit key, and not an array child, so BaseNode constructor will handle.
    }

    // Case 1: Child is already a BaseNode instance
    if (rawNode instanceof BaseNode || (typeof rawNode === 'object' && rawNode !== null && (rawNode as any)._isBaseNode === true)) {
      const childInstance = rawNode as BaseNode<any>
      const childsInitialRawProps = childInstance.rawProps || {}
      const childsOwnInitialTheme = childsInitialRawProps.nodeTheme
      const themeForNewNode = childsOwnInitialTheme || parentTheme || {} // Prefer child's own theme

      const keyForChildNode = generateIndexedKeyIfNeeded(childInstance.element, childsInitialRawProps.key)

      return new BaseNode(childInstance.element, {
        ...childsInitialRawProps,
        nodeTheme: themeForNewNode,
        key: keyForChildNode,
      })
    }

    // Case 2: Child is a primitive (string, number, boolean, null, undefined)
    if (componentType === 'string' || componentType === 'number' || componentType === 'boolean' || rawNode === null || rawNode === undefined) {
      return rawNode as string | number | boolean | null | undefined
    }

    // Case 3: Child is a function that needs to be called during render (FunctionRenderer).
    if (componentType === 'function' && !isReactClassComponent(rawNode) && !isMemo(rawNode) && !isForwardRef(rawNode)) {
      // The key is for the BaseNode that wraps the _functionRenderer component.
      // Functions themselves don't have a .key prop that we can access here.
      const keyForFunctionRenderer = generateIndexedKeyIfNeeded(this._functionRenderer as NodeElement, undefined)

      return new BaseNode(this._functionRenderer as NodeElement, {
        processRawNode: this._processRawNode.bind(this),
        render: rawNode as FunctionRendererProps<ReactNode | BaseNodeInstance<typeof rawNode>>['render'],
        passedTheme: parentTheme,
        key: keyForFunctionRenderer,
      })
    }

    // Case 4: Child is a React Element (JSX element like <div> or <MyComponent>)
    if (isValidElement(rawNode)) {
      // Extract and merge props from the JSX element, flattening style props
      let childElementProps = { ...(rawNode.props as ComponentProps<any>) }
      childElementProps = { ...childElementProps.style, ...childElementProps } // Merge style props into main props
      delete childElementProps.style // Remove original style object after merging

      // Handle theme by preferring nodeTheme from child's props, falling back to parent theme if not set
      const themeForChild = childElementProps?.nodeTheme || parentTheme

      // For array children without keys, generate stable key from element type and index
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode.type as ElementType, rawNode.key)

      // Create new BaseNode instance with processed props and theme
      return new BaseNode(rawNode.type as ElementType, {
        ...childElementProps,
        nodeTheme: themeForChild,
        key: keyForChildNode,
      })
    }

    // Case 5: Child is an ElementType (string tag, class component, Memo/ForwardRef)
    if (isReactClassComponent(rawNode) || (componentType === 'object' && (isMemo(rawNode) || isForwardRef(rawNode)))) {
      // ElementTypes don't have an intrinsic key from the rawNode itself.
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode as ElementType, undefined)
      return new BaseNode(rawNode as ElementType, {
        nodeTheme: parentTheme,
        key: keyForChildNode,
      })
    }

    // Case 6: Handle instances of React.Component
    if (rawNode instanceof React.Component) {
      const element = rawNode.render()
      // Recursively process the rendered element with parent theme and index
      return this._processRawNode(element, parentTheme, childIndex)
    }

    // Case 7: Fallback for other ReactNode types (e.g., Fragments, Portals if not caught by isValidElement)
    // These are returned as-is. If they are elements within an array, React expects them to have keys.
    // This logic primarily adds keys to BaseNode instances we create.
    return rawNode
  }

  /**
   * Converts this BaseNode instance into a renderable React node.
   * Recursively processes child nodes and uses `React.createElement` to construct the final React element.
   * @returns A ReactNode representing the rendered element.
   */
  public render(): ReactNode {
    if (!isValidElementType(this.element)) {
      throw new Error(`Invalid element type: ${this.element} provided!`)
    }
    const { children: childrenInProps, key, ...otherProps } = this.props

    const normalizeChild = (child: NodeElement): ReactNode => {
      // Changed NodeElement to ProcessedChild for accuracy
      if (child instanceof BaseNode || (typeof child === 'object' && child !== null && 'render' in child)) {
        return child.render()
      }
      return child as ReactNode // Primitives, other ReactNodes
    }

    let finalChildren: ReactNode | ReactNode[] | undefined = undefined // More accurate type

    if (childrenInProps !== undefined && childrenInProps !== null) {
      if (Array.isArray(childrenInProps)) {
        if (childrenInProps.length > 0) {
          const mappedArray = childrenInProps.map(normalizeChild)
          // Check if all children are null/undefined (e.g. conditional rendering resulted in nothing)
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
        finalChildren = normalizeChild(childrenInProps as NodeElement)
      }
    }

    // Prepare props for React.createElement
    const propsForCreateElement: ComponentProps<ElementType> & { key?: Key } = {
      ...(otherProps as ComponentProps<ElementType>), // Cast otherProps
      key, // This is the key of the current BaseNode itself
    }
    // Delete key `nodeTheme` as it's not a valid DOM/React prop for the element
    delete propsForCreateElement.nodeTheme

    return createElement(this.element as ElementType, propsForCreateElement, finalChildren)
  }
}

/**
 * Factory function to create a BaseNode instance.
 * @param element The React element type.
 * @param props The props for the node.
 * @returns BaseNodeInstance<E> - A new BaseNode instance.
 */
export function Node<E extends NodeElement>(element: E, props: Partial<NodeProps<E>> = {}): BaseNodeInstance<E> {
  const finalProps: BaseNodeProps<E> = { ...props } // Ensure we are working with a mutable copy
  if (finalProps.theme && finalProps.nodeTheme === undefined) {
    // Prefer explicit nodeTheme if provided
    finalProps.nodeTheme = finalProps.theme
  }
  // 'theme' prop itself is not directly used by BaseNode after this, nodeTheme is.
  // We can keep `theme` in rawProps if needed for cloning or inspection.
  return new BaseNode(element, finalProps as BaseNodeProps<E>)
}

/**
 * Higher-order component wrapper that converts BaseNode components into React components.
 *
 * This function takes a component function that may return either a BaseNode instance
 * or a ReactNode, and wraps it to ensure the output is always a renderable ReactNode.
 * BaseNode instances are automatically converted using render().
 * @template T - The type of props accepted by the component
 * @param component The component function that returns either a BaseNode or ReactNode
 * @returns A React function component that takes the same props and returns a ReactNode
 * @example
 * const MyComponent = Component((props) => {
 *   return Node('div', { ...props })
 * })
 */
export function Component<T extends Record<string, any>>(component: (props: T) => BaseNodeInstance<any> | ReactNode) {
  return (props: T) => {
    const c = component(props)
    if (c instanceof BaseNode || (typeof c === 'object' && c !== null && (c as any)._isBaseNode === true)) {
      return (c as BaseNodeInstance<any>).render()
    }
    return c
  }
}
