'use strict'
import React, { type ComponentProps, createElement, type CSSProperties, type ElementType, isValidElement, type Key, type ReactNode } from 'react'
import type { BaseNodeInstance, BaseNodeProps, FunctionRendererProps, NodeElement, NodeProps, OriginalNodeProps, Theme } from '@src/node.type.js'
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
  public rawProps?: BaseNodeProps<E> // Initial props before processing

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

    const { children: rawNoderen, nodeTheme: currentTheme, ...otherRawProps } = rawProps || {} // Extract children and theme

    // 1. Resolve styles and DOM props for this node
    const ownCssProps = getCSSProps(otherRawProps as Record<string, any>)
    let resolvedStyle = this._resolveStyleWithTheme(ownCssProps, currentTheme)
    resolvedStyle = Object.keys(resolvedStyle).length > 0 ? resolvedStyle : {}

    const domProps = getDOMProps(otherRawProps as Record<string, any>) // Extract DOM-related props

    // 2. Process rawNoderen into BaseNode instances or primitives, passing down currentTheme
    let processedChildrenResult: NodeElement | NodeElement[] = undefined
    if (rawNoderen !== undefined && rawNoderen !== null) {
      if (Array.isArray(rawNoderen)) {
        const childrenArray = rawNoderen as NodeElement[]
        processedChildrenResult = childrenArray.map(
          (child, index) => this._processRawNode(child, currentTheme, index), // Process each child, passing index
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
      children: processedChildrenResult, // Assign processed children
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

    const mergedTheme: Theme = { ...this.rawProps?.nodeTheme, ...theme } // Merge nodeTheme from rawProps with theme
    const styleWithTheme: Record<string, unknown> = { ...initialCssProps }

    for (const styleKey in styleWithTheme) {
      if (Object.prototype.hasOwnProperty.call(styleWithTheme, styleKey)) {
        const styleValue = styleWithTheme[styleKey as keyof CSSProperties]

        if (typeof styleValue === 'string' && styleValue.includes('theme.')) {
          let processedValue = styleValue

          // Iteratively resolve theme references within the string
          processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
            const themeValue = getValueByPath(mergedTheme, path) // Use 'theme' passed to the function

            // Replace if themeValue is found and is a string or number.
            // null is explicitly excluded to avoid 'null' string in output unless intended.
            if (themeValue !== undefined && themeValue !== null && (typeof themeValue === 'string' || typeof themeValue === 'number')) {
              return String(themeValue)
            }
            // If themeValue is not a string/number, or is undefined/null, keep the original placeholder
            return match
          })
          styleWithTheme[styleKey] = processedValue
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
    processRawNode, // Function to process raw nodes
  }: FunctionRendererProps<E>): NodeElement {
    // Call the user-provided render function to get the child.
    const result = render()

    if (result instanceof React.Component) {
      const element = result.render()
      const processed = processRawNode(element, passedTheme)
      if (processed instanceof BaseNode) {
        // If processed result is a BaseNode, render it
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
          theme: passedTheme, // Pass theme for consistency if used in rawProps
          key: passedKey,
        }).render()
      }
      // If the node already has a theme or no theme is provided, render as-is.
      return bnResult.render()
    }
    // Process the result if it's not a React.Component or BaseNode
    const processedResult = processRawNode(result, passedTheme)

    if (processedResult instanceof BaseNode) {
      if ((processedResult.rawProps?.theme || processedResult.rawProps?.nodeTheme) === undefined && passedTheme !== undefined) {
        return new BaseNode(processedResult.element, {
          ...processedResult.rawProps,
          nodeTheme: processedResult.rawProps?.theme || processedResult.rawProps?.nodeTheme || passedTheme,
          key: processedResult.rawProps?.key || passedKey, // Use existing key or passed key
        }).render()
      }
      return processedResult.render()
    }

    // If the result is not a BaseNode (e.g., JSX, string, etc.), return it directly.
    // Note: Non-BaseNode results will not automatically receive the theme.
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
  private _processRawNode(
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
      const childInstance = rawNode as BaseNode<any>
      const childsInitialRawProps = childInstance.rawProps || {} // Get initial raw props of the child
      const childsOwnInitialTheme = childsInitialRawProps.nodeTheme // Get the child's own theme
      const themeForNewNode = childsOwnInitialTheme || parentTheme || {} // Prefer child's own theme

      const keyForChildNode = generateIndexedKeyIfNeeded(childInstance.element, childsInitialRawProps.key)

      return new BaseNode(childInstance.element, {
        ...childsInitialRawProps,
        nodeTheme: themeForNewNode, // Use the determined theme for the new node
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
      const keyForFunctionRenderer = generateIndexedKeyIfNeeded(this._functionRenderer as NodeElement, undefined) // Generate key for function renderer

      return new BaseNode(this._functionRenderer as NodeElement, {
        processRawNode: this._processRawNode.bind(this),
        render: rawNode as FunctionRendererProps<ReactNode | BaseNodeInstance<typeof rawNode>>['render'],
        passedTheme: parentTheme,
        key: keyForFunctionRenderer, // Assign the generated key
      })
    }

    // Case 4: Child is a React Element (JSX element like <div> or <MyComponent>)
    if (isValidElement(rawNode)) {
      // Extract and merge props from the JSX element, flattening style props
      let childElementProps = { ...(rawNode.props as ComponentProps<any>) }
      childElementProps = { ...childElementProps.style, ...childElementProps } // Merge main props into style props
      delete childElementProps.style // Remove original style object after merging

      // Handle theme: prefer nodeTheme from child's props, fallback to parent theme
      const themeForChild = childElementProps?.nodeTheme || parentTheme

      // For array children without keys, generate stable key from element type and index
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode.type as ElementType, rawNode.key)

      // Create new BaseNode instance with processed props and theme
      return new BaseNode(rawNode.type as ElementType, {
        ...childElementProps,
        nodeTheme: themeForChild,
        key: keyForChildNode, // Assign the generated key
      })
    }

    // Case 5: Child is an ElementType (string tag, class component, Memo/ForwardRef)
    if (isReactClassComponent(rawNode) || (componentType === 'object' && (isMemo(rawNode) || isForwardRef(rawNode)))) {
      // ElementTypes don't have an intrinsic key from the rawNode itself.
      const keyForChildNode = generateIndexedKeyIfNeeded(rawNode as ElementType, undefined)
      return new BaseNode(rawNode as ElementType, {
        nodeTheme: parentTheme, // Apply parent theme
        key: keyForChildNode,
      })
    }

    // Case 6: Handle instances of React.Component
    if ((rawNode as unknown as React.Component) instanceof React.Component) {
      const element = (rawNode as unknown as React.Component).render()
      // Recursively process the rendered element with parent theme and index if available
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

    const currentTheme = this.rawProps?.nodeTheme || this.rawProps?.theme || this.props.nodeTheme || this.props.theme

    // For BaseNode instances, apply current theme if child has no theme
    if (child instanceof BaseNode) {
      if (!child.rawProps?.nodeTheme && currentTheme !== undefined) {
        return new BaseNode(child.element, {
          ...child.rawProps,
          nodeTheme: currentTheme,
        }).render()
      }
      return child.render()
    }

    // For React.Component instances, wrap in BaseNode with theme if needed
    if (child instanceof React.Component) {
      if (!child.props.nodeTheme && currentTheme !== undefined) {
        return new BaseNode(child.render(), {
          ...child.props,
          nodeTheme: currentTheme,
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
  public render(): ReactNode {
    if (!isValidElementType(this.element)) {
      const elementType = getComponentType(this.element)
      throw new Error(`Invalid element type: ${elementType} provided!`)
    }

    const { children: childrenInProps, key, ...otherProps } = this.props // Extract children and key

    let finalChildren: ReactNode | ReactNode[] | undefined = undefined // More accurate type

    if (childrenInProps !== undefined && childrenInProps !== null) {
      if (Array.isArray(childrenInProps)) {
        if (childrenInProps.length > 0) {
          const mappedArray = childrenInProps.map(this._normalizeChild) // Normalize each child in the array
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
        finalChildren = this._normalizeChild(childrenInProps)
      }
    }

    // Prepare props for React.createElement
    const propsForCreateElement: ComponentProps<ElementType> & { key?: Key } = {
      ...(otherProps as ComponentProps<ElementType>), // Cast otherProps
      key, // This is the key of the current BaseNode itself
    } // Prepare props for React.createElement

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
    // If theme is provided but nodeTheme is not
    // Prefer explicit nodeTheme if provided
    finalProps.nodeTheme = finalProps.theme // Set nodeTheme to theme
  }
  // 'theme' prop itself is not directly used by BaseNode after this, nodeTheme is used.
  // We can keep `theme` in rawProps if needed for cloning or inspection.
  return new BaseNode(element, finalProps as BaseNodeProps<E>)
}

/**
 * Higher-order component wrapper that converts BaseNode components into React components.
 * This wrapper ensures proper theme propagation and component rendering in the React ecosystem.
 *
 * Key features:
 * - Converts BaseNode instances to React elements via render()
 * - Handles theme inheritance and merging
 * - Preserves component props
 * - Type-safe with generic prop types
 * @template T - The props type for the wrapped component
 * @param component Component function that returns a BaseNode or ReactNode
 * @returns A React function component that handles BaseNode conversion and theme propagation
 * @example
 * // Basic usage
 * const Button = Component((props) => {
 *   return Node('button', {
 *     ...props,
 *     theme: { color: 'blue' }
 *   })
 * })
 */
export function Component<T extends Record<string, any>>(component: (props: T) => BaseNodeInstance<any> | ReactNode) {
  // Create wrapper component that handles theme and rendering
  return (props: T & { theme?: Theme }) => {
    const result = component({ ...props }) // Execute wrapped component

    // Handle BaseNode results - requires special processing
    if (result instanceof BaseNode) {
      // Theme merging: Check if we need to handle theme inheritance
      if (!!(props?.theme || props?.nodeTheme) || !!(result.rawProps?.theme || result.rawProps?.nodeTheme)) {
        return new BaseNode(result.element, {
          ...result.rawProps,
          // Theme priority: props.theme > rawProps.theme > rawProps.nodeTheme
          nodeTheme: props?.theme || result.rawProps?.theme || result.rawProps?.nodeTheme,
        }).render()
      }
      return result.render() // No theme to handle, just render
    }

    // Direct return for non-BaseNode results (standard React nodes)
    return result
  }
}
