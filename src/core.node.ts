'use strict'
import React, { type ComponentProps, createElement, type CSSProperties, type ElementType, isValidElement, type Key, type ReactNode } from 'react'
import type { FinalNodeProps, FunctionRendererProps, NodeElement, NodeInstance, NodeProps, PropsOf, RawNodeProps, Theme } from '@src/node.type.js'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, getValueByPath, isNodeInstance } from '@src/node.helper.js'
import { isForwardRef, isMemo, isReactClassComponent, isValidElementType } from '@src/react-is.helper.js'
import { createRoot, type Root as ReactDOMRoot } from 'react-dom/client'

/**
 * Represents a node in a React component tree with theme and styling capabilities.
 * This class wraps React elements and handles:
 * - Props processing and normalization
 * - Theme inheritance and resolution
 * - Child node processing and management
 * - Style processing with theme variables
 * @template E The type of React element or component this node represents
 */
export class BaseNode<E extends NodeElement = NodeElement> implements NodeInstance<E> {
  /** The underlying React element or component type that this node represents */
  public element: E

  /** Original props passed during construction, preserved for cloning/recreation */
  public rawProps: RawNodeProps<E> = {}

  /** Processed props after theme resolution, style processing, and child normalization */
  public props: FinalNodeProps

  public readonly isBaseNode = true

  private _portalDOMElement: HTMLDivElement | null = null
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
    const { ref, children, nodetheme, theme, props: _componentProps, ...remainingRawProps } = rawProps

    const currentTheme = theme || nodetheme
    const { style: componentPropsStyle, ...componentProps } = (_componentProps || {}) as Omit<PropsOf<E>, 'children'>

    // Resolve any theme variables in the remaining props
    const componentPropsStyleWithResolvedTheme = this._resolveObjWithTheme(componentPropsStyle, currentTheme)
    const { style: stylePropsWithResolvedTheme, ...propsWithResolvedTheme } = this._resolveObjWithTheme(remainingRawProps, currentTheme)
    // Extract CSS-related properties from the resolved theme-aware props
    const processedStyleProps = getCSSProps(propsWithResolvedTheme)
    // Resolve default styles
    const finalStyleProps = this._resolveDefaultStyle({ ...stylePropsWithResolvedTheme, ...processedStyleProps, ...componentPropsStyleWithResolvedTheme })
    // Extract remaining props that are valid DOM attributes
    const processedDOMProps = getDOMProps(propsWithResolvedTheme)

    // Process children while maintaining theme inheritance
    let normalizedChildren: NodeElement | NodeElement[] = undefined
    if (children) {
      if (Array.isArray(children)) {
        // Process array of children with index for stable keys
        normalizedChildren = (children as NodeElement[]).map((child, index) => this._processRawNode(child, currentTheme, index))
      } else {
        // Process single child
        normalizedChildren = this._processRawNode(children, currentTheme)
      }
    }

    // Combine processed props into final normalized form
    this.props = {
      ref,
      nodetheme: currentTheme,
      theme,
      style: finalStyleProps,
      ...processedDOMProps,
      ...componentProps,
      children: normalizedChildren,
    }
  }

  /**
   * Resolves default styles for a given CSSProperties object.
   * This method ensures that certain default styles, such as `minHeight`, `minWidth`,
   * and `flexShrink`, are applied based on the provided style properties.
   *
   * - If the element is a flex container:
   * - Sets `flexShrink` to 0 for specific scenarios:
   * - Column-based layout without wrapping.
   * - Row-based layout without wrapping (a default direction is assumed to be 'row').
   * - If the element is not a flex container:
   * - Defaults `flexShrink` to 0.
   * @param style The CSSProperties object containing style definitions.
   * @returns An object with resolved default styles.
   */
  private _resolveDefaultStyle(style: CSSProperties) {
    const { flex, ...restStyle } = style
    const isFlexContainer = restStyle.display === 'flex'
    const hasOverflow = !!(restStyle.overflow || restStyle.overflowY || restStyle.overflowX)
    const isWrapping = restStyle.flexFlow?.includes('wrap') || restStyle.flexWrap === 'wrap'

    let flexShrink = undefined

    if (isFlexContainer) {
      if (!hasOverflow) {
        const isColumnDirection = restStyle.flexDirection === 'column' || restStyle.flexDirection === 'column-reverse'
        const isRowDirectionOrDefault = restStyle.flexDirection === 'row' || restStyle.flexDirection === 'row-reverse' || !restStyle.flexDirection

        // Scenario 1: Column-based layout
        if (isColumnDirection && !isWrapping) {
          flexShrink = 0
        }
        // Scenario 2: Row-based layout without wrapping, this assumes 'row' is the default if flexDirection is not set.
        else if (isRowDirectionOrDefault && !isWrapping) {
          flexShrink = 0
        }
      }
    } else {
      // If it's not a flex container, default flex-shrink to 0
      flexShrink = 0
    }

    return { flex, flexShrink, minHeight: 0, minWidth: 0, ...restStyle }
  }

  /**
   * Resolves theme variable references in an object's values recursively.
   * Handles nested objects and prevents circular references.
   * Theme variables are referenced using the format "theme.path.to.value".
   * @param obj The object whose values should be resolved against the theme
   * @param theme Optional theme object containing variable definitions
   * @returns A new object with all theme variables resolved to their values
   */
  private _resolveObjWithTheme(obj: Record<string, any> = {}, theme?: Theme) {
    // Early return if no theme or empty object
    if (!theme || Object.keys(obj).length === 0) {
      return obj
    }

    // Merge parent theme with current theme
    const mergedTheme: Theme = { ...this.rawProps?.nodetheme, ...theme }

    /**
     * Recursively resolves theme variables in an object, tracking visited objects
     * to prevent infinite recursion with circular references.
     */
    const resolveRecursively = (currentObj: Record<string, unknown>, visited: Set<Record<string, unknown>>): Record<string, unknown> => {
      // Prevent processing same object multiple times
      if (visited.has(currentObj)) {
        return currentObj
      }

      // Track this object to detect circular references
      visited.add(currentObj)

      const resolvedObj: Record<string, unknown> = {}

      for (const key in currentObj) {
        const value = currentObj[key]

        // Skip functions and non-plain objects to prevent unintended flattening or
        // modification of complex instances like React components, DOM elements, or Date objects.
        if (typeof value === 'function' || (value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
          resolvedObj[key] = value
          continue
        }

        // Resolve theme variables in string values
        if (typeof value === 'string' && value.includes('theme.')) {
          let processedValue = value
          processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
            const themeValue = getValueByPath(mergedTheme, path)
            // Only convert string/number theme values
            if (themeValue !== undefined && themeValue !== null) {
              if (typeof themeValue === 'object' && !Array.isArray(themeValue) && 'default' in themeValue) {
                return themeValue.default
              }
              return themeValue
            }
            return match // Keep original if no valid theme value found
          })
          resolvedObj[key] = processedValue
        }
        // Recursively process nested objects
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          resolvedObj[key] = resolveRecursively(value as Record<string, unknown>, visited)
        }
        // Keep other values as-is
        else {
          resolvedObj[key] = value
        }
      }

      return resolvedObj
    }

    return resolveRecursively(obj, new Set())
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
      const childInstance = rawNode as BaseNode<any>
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
        render: rawNode as FunctionRendererProps<ReactNode | NodeInstance<typeof rawNode>>['render'],
        passedTheme: parentTheme,
        key: keyForFunctionRenderer, // Assign the generated key
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
          const mappedArray = childrenInProps.map(child => this._normalizeChild(child as NodeElement)) // Normalize each child in the array
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
    const propsForCreateElement: ComponentProps<ElementType> & { key?: Key } = {
      ...(otherProps as ComponentProps<ElementType>),
      key,
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
 * Factory function to create a BaseNode instance.
 * @param element The React element type.
 * @param props The props for the node.
 * @returns NodeInstance<E> - A new BaseNode instance.
 */
export function Node<E extends NodeElement>(element: E, props: Partial<NodeProps<E>> = {}): NodeInstance<E> {
  const finalProps: RawNodeProps<E> = { ...props } // Ensure we are working with a mutable copy
  if (finalProps.theme && !finalProps.nodetheme) {
    // If theme is provided but nodetheme is not
    // Prefer explicit nodetheme if provided
    finalProps.nodetheme = finalProps.theme // Set nodetheme to theme
  }
  // 'theme' prop itself is not directly used by BaseNode after this, nodetheme is used.
  // We can keep `theme` in rawProps if needed for cloning or inspection.
  return new BaseNode(element, finalProps as RawNodeProps<E>)
}
