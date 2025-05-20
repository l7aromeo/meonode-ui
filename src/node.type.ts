'use strict'
import type {
  Attributes as ReactAttributes,
  ComponentProps,
  CSSProperties,
  ReactNode,
  JSX,
  ElementType,
  ComponentType,
  JSXElementConstructor,
  Component,
} from 'react'

export type NodeElement =
  | ReactNode
  | Component<any, any>
  | ElementType
  | ComponentType<any>
  | BaseNodeInstance<any>
  | ((props?: any) => ReactNode | Promise<ReactNode> | Component<any> | BaseNodeInstance<any>)

/**
 * Defines valid child types that can be passed to a node:
 * - ReactNode: Any valid React child (elements, strings, numbers, etc.)
 * - ElementType: React component types (functions/classes)
 * - BaseNodeInstance: Other node instances in the tree
 * - Function: Lazy child evaluation, useful for conditional rendering and hooks
 */
export type Children = ReactNode | Component<any> | NodeElement | BaseNodeInstance<any>

/**
 * Forward declaration of the BaseNode interface to avoid circular dependencies.
 * Defines the core structure and capabilities of a BaseNode instance.
 * @template T - The type of React element/component that this node represents
 */
export interface BaseNodeInstance<T extends NodeElement = NodeElement> {
  /** The underlying React element or component type that this node will render */
  readonly element: T

  /** Original props passed during node construction, preserved for cloning/recreation */
  readonly rawProps?: RawNodeProps<T>

  /** Converts this node instance into a renderable React element/tree */
  render(): ReactNode
}

/**
 * Extracts the props type from a given element type, handling both intrinsic (HTML) elements
 * and custom React components.
 * @template E - The element type to extract props from
 */
export type PropsOf<E extends NodeElement> = E extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[E]
  : E extends JSXElementConstructor<any>
    ? ComponentProps<E>
    : BaseNodeInstance<E>

/**
 * Theme configuration object that can be passed through the node tree.
 * Supports nested theme properties for complex styling systems:
 * - Simple values (strings, numbers)
 * - Nested theme objects with unlimited depth
 * - Common CSS values and units
 * - Custom theme variables and tokens
 * Used for consistent styling and dynamic theme application.
 */
export interface Theme {
  [key: string]: string | number | boolean | null | undefined | any | Theme | Record<string, Theme | string | number | boolean | null | undefined | any>
}

/**
 * Internal props type used by BaseNode instances after initial processing.
 * Ensures consistent prop shape throughout the node's lifecycle:
 * - Normalizes style properties into a CSSProperties object
 * - Processes children into known concrete types
 * - Handles theme context propagation
 * @template E - The element type these props apply to
 */
export type FinalNodeProps = ReactAttributes & {
  style?: CSSProperties
  children?: Children | Children[]
  theme?: Theme
  nodeTheme?: Theme
}

/**
 * Helper type to determine if the props P have a 'style' property
 * that is compatible with CSSProperties.
 * @template P - The props object of a component (e.g., PropsOf<E>)
 */
type HasCSSCompatibleStyleProp<P> = P extends { style?: infer S } // Does P have a 'style' prop (even optional)?
  ? S extends CSSProperties | undefined // Is the type of that 'style' prop (S) assignable to CSSProperties or undefined?
    ? true // Yes, it's CSS compatible
    : false // No, 'style' exists but is not CSSProperties (e.g., style: string)
  : false // No, P does not have a 'style' prop at all

/**
 * Public API for node creation props, providing a flexible and type-safe interface:
 * - Preserves original component props while allowing direct style properties (conditionally)
 * - Supports both single and array children
 * - Enables theme customization
 * - Maintains React's key prop for reconciliation
 * @template E - The element type these props apply to
 */
export type NodeProps<E extends NodeElement> = Omit<PropsOf<E>, 'style' | 'children'> &
  ReactAttributes &
  (HasCSSCompatibleStyleProp<PropsOf<E>> extends true
    ? Partial<CSSProperties> // If E's props have a CSS-compatible style, allow NodeProps to set CSSProperties
    : object) & {
    children?: Children | Children[]
    theme?: Theme
    // key is part of ReactAttributes
  }

/**
 * BaseNode's internal props type, extending NodeProps:
 * - Makes all properties optional for flexible node creation
 * - Adds nodeTheme for theme context handling
 * - Used for both initial construction and internal state
 * @template E - The element type these props apply to
 */
export type RawNodeProps<E extends NodeElement> = Partial<NodeProps<E>> & { nodeTheme?: Theme }

/**
 * Props interface for the internal FunctionRenderer component.
 * Handles dynamic function children within React's component lifecycle:
 * - Ensures proper timing of function evaluation
 * - Maintains theme context for rendered content
 * - Enables hook usage in function children
 */
export interface FunctionRendererProps<E extends NodeElement> {
  /** Function that returns the child content to render */
  render: (props?: NodeProps<E>) => ReactNode | BaseNodeInstance<E>

  /** Theme context to be applied to the rendered content */
  passedTheme?: Theme

  /** Optional key prop to help React identify unique instances in lists */
  passedKey?: string

  processRawNode: (node: NodeElement, parentTheme?: Theme, childIndex?: number) => BaseNodeInstance<E>
}
