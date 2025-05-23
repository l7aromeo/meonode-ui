'use strict'
import React, { type ComponentProps, createElement, type ElementType, isValidElement, type Key, type ReactNode } from 'react'
import type { ComponentNode, FinalNodeProps, FunctionRendererProps, NodeElement, NodeInstance, NodeProps, RawNodeProps, Theme } from '@src/node.type.js'
import { getComponentType, getCSSProps, getDOMProps, getElementTypeName, getValueByPath } from '@src/node.helper.js'
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
class BaseNode<E extends NodeElement> implements NodeInstance<E> {
  /** The underlying React element or component type that this node represents */
  public element: E

  /** Original props passed during construction, preserved for cloning/recreation */
  public rawProps?: RawNodeProps<E>

  /** Processed props after theme resolution, style processing, and child normalization */
  public props: FinalNodeProps

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
    const { children, nodetheme, theme, ...remainingRawProps } = rawProps

    const currentTheme = theme || nodetheme

    // Resolve any theme variables in the remaining props
    const propsWithResolvedTheme = this._resolveObjWithTheme(remainingRawProps, currentTheme)

    // Extract style-related props that match valid CSS properties
    const processedStyleProps = getCSSProps(propsWithResolvedTheme)

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
      ...processedDOMProps,
      style: processedStyleProps,
      nodetheme: currentTheme,
      theme,
      children: normalizedChildren,
    }
  }

  /**
   * Resolves obj properties by replacing theme path placeholders with actual theme values.
   * Handles complex strings like '1px solid theme.background.primary' and nested objects.
   * @param obj The initial obj properties object.
   * @param theme The theme object to use for resolving paths.
   * @returns A new CSSProperties object with theme values resolved.
   */
  private _resolveObjWithTheme(obj: Record<string, unknown>, theme?: Theme) {
    // Return early if no theme or empty object
    if (!theme || Object.keys(obj).length === 0) {
      return obj
    }

    // Merge raw nodetheme with passed theme for resolution
    const mergedTheme: Theme = { ...this.rawProps?.nodetheme, ...theme }

    /**
     * Recursively resolves theme values in an object
     * @param currentObj The current object level being processed
     * @returns New object with resolved theme values
     */
    const resolveRecursively = (currentObj: Record<string, unknown>): Record<string, unknown> => {
      const resolvedObj: Record<string, unknown> = {}
      // Process each property in the current object
      for (const key in currentObj) {
        const value = currentObj[key]

        if (key.startsWith('_')) return currentObj // Hack to pass Next.js shitty error caused by Turbopack development thingy

        // Handle string values containing theme references
        if (typeof value === 'string' && value.includes('theme.')) {
          let processedValue = value
          // Replace theme path placeholders with actual theme values
          processedValue = processedValue.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (match, path) => {
            const themeValue = getValueByPath(mergedTheme, path)
            // Convert the theme value to string if it exists and is a valid type
            return themeValue != null && ['string', 'number'].includes(typeof themeValue) ? String(themeValue) : match
          })
          resolvedObj[key] = processedValue
        }
        // Recursively process nested objects (excluding arrays)
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          resolvedObj[key] = resolveRecursively(value as Record<string, unknown>)
        }
        // Keep other values as-is
        else {
          resolvedObj[key] = value
        }
      }

      return resolvedObj
    }

    return resolveRecursively(obj)
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
  private _functionRenderer<E extends ReactNode | NodeInstance<E>>({
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
        if ((processed.rawProps?.theme || processed.rawProps?.nodetheme) === undefined && passedTheme !== undefined) {
          return new BaseNode(processed.element, {
            ...processed.rawProps,
            nodetheme: processed.rawProps?.theme || processed.rawProps?.nodetheme || passedTheme,
            key: processed.rawProps?.key || passedKey,
          }).render()
        }
      }
      return processed
    }

    if (result instanceof BaseNode) {
      const bnResult = result as NodeInstance

      // If the returned BaseNode does not have its own theme, but a theme is provided,
      // re-create the node with the provided theme to ensure correct theme propagation.
      if (bnResult.rawProps?.nodetheme === undefined && passedTheme !== undefined) {
        return new BaseNode(bnResult.element, {
          ...(bnResult.rawProps || {}),
          nodetheme: passedTheme,
          key: passedKey,
        }).render()
      }
      // If the node already has a theme or no theme is provided, render as-is.
      return bnResult.render()
    }
    // Process the result if it's not a React.Component or BaseNode
    const processedResult = processRawNode(result, passedTheme)

    if (processedResult instanceof BaseNode) {
      return new BaseNode(processedResult.element, {
        ...processedResult.rawProps,
        nodetheme: processedResult.rawProps?.theme || processedResult.rawProps?.nodetheme || passedTheme,
        key: processedResult.rawProps?.key || passedKey,
      }).render()
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
      const keyForFunctionRenderer = generateIndexedKeyIfNeeded(this._functionRenderer as NodeElement, undefined) // Generate key for function renderer

      return new BaseNode(this._functionRenderer as NodeElement, {
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

    // For React.Component instances, wrap in BaseNode with theme if needed
    if (child instanceof React.Component) {
      if (!child.props.nodetheme && currentTheme !== undefined) {
        return new BaseNode(child.render(), {
          ...child.props,
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
      ...(otherProps as ComponentProps<ElementType>), // Cast otherProps
      key, // This is the key of the current BaseNode itself
    } // Prepare props for React.createElement

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

/**
 * Higher-order component wrapper that converts BaseNode components into React components.
 * This wrapper ensures proper theme propagation and component rendering in the React ecosystem.
 *
 * Key features:
 * - Converts BaseNode instances to React elements via render()
 * - Handles theme inheritance and merging
 * - Preserves component props
 * - Type-safe with generic prop types
 * @template P - The props type for the wrapped component
 * @param component Component function that returns a BaseNode or ReactNode
 * @returns A React function component that handles BaseNode conversion and theme propagation
 * @example
 * ```ts
 * // Basic usage
 * const App = Component(() => {
 *   return Div({
 *     theme: { color: 'blue' }
 *   })
 * })
 * ```
 */
export function Component<P extends Record<string, any> & { theme?: Theme }>(component: (props: P) => ComponentNode) {
  // Create a wrapper component that handles theme and rendering
  const renderer = (props: any = {}) => {
    const result = component(props) // Execute wrapped component

    // Handle BaseNode results - requires special processing
    if (result instanceof BaseNode) {
      const theme = result.rawProps?.nodetheme || result.rawProps?.theme || props.nodetheme || props.theme
      return Node(result.element, {
        ...result.rawProps,
        nodetheme: theme,
      }).render()
    }

    return result as ReactNode
  }

  return (props: any = {}) => Node(renderer, props).render()
}

/**
 * Creates a portal wrapper component for rendering content outside the normal DOM hierarchy.
 * Portals are useful for rendering modals, tooltips, and other overlays that need to break out
 * of their parent container's DOM structure while maintaining React context and event bubbling.
 *
 * Key features:
 * - Renders content to a separate DOM node outside the parent hierarchy
 * - Maintains theme inheritance through the portal
 * - Provides portal instance with unmount control
 * - Automatically cleans up DOM nodes on unmount
 * @template P Props type for the wrapped component including theme and portal instance
 * @param component Component function that returns portal content
 * @returns Function that creates and manages the portal instance
 * @example
 * ```ts
 * const Modal = Portal(({ portal }) => {
 *   return Div({
 *     onClick: () => portal.unmount(),
 *     children: "Click to close"
 *   })
 * })
 * ```
 */
export function Portal<
  P extends Record<string, any> & {
    theme?: Theme
    portal: { unmount: () => void }
  },
>(component: (props: P) => ComponentNode) {
  let portalInstance: ReactDOMRoot | null = null
  const renderer = (props: any = {}) => {
    const result = component({ ...props, portal: portalInstance })
    if (result instanceof BaseNode) {
      const theme = result.rawProps?.nodetheme || result.rawProps?.theme || props.nodetheme || props.theme
      return Node(result.element, {
        ...result.rawProps,
        nodetheme: theme,
      }).render()
    }

    return result as ReactNode
  }

  return (props: any = {}) => {
    portalInstance = Node(renderer, props).toPortal()
    return portalInstance
  }
}
