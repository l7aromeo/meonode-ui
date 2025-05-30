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
import type { Root as ReactDOMRoot } from 'react-dom/client'

export type NodeElement =
  | ReactNode
  | Component<any, any>
  | ElementType
  | ComponentType<any>
  | NodeInstance<any>
  | ((props?: any) => ReactNode | Promise<ReactNode> | Component<any> | NodeInstance<any> | ComponentNode)

/**
 * Defines valid child types that can be passed to a node:
 * - ReactNode: Any valid React child (elements, strings, numbers, etc.)
 * - ElementType: React component types (functions/classes)
 * - NodeInstance: Other node instances in the tree
 * - Function: Lazy child evaluation, useful for conditional rendering and hooks
 */
export type Children = ReactNode | Component<any> | NodeElement | NodeInstance<any> | ComponentNode

/**
 * Forward declaration of the BaseNode interface to avoid circular dependencies.
 * Defines the core structure and capabilities of a BaseNode instance.
 * @template T - The type of React element/component that this node represents
 */
export interface NodeInstance<T extends NodeElement = NodeElement> {
  /** The underlying React element or component type that this node will render */
  readonly element: T

  /** Original props passed during node construction, preserved for cloning/recreation */
  readonly rawProps?: RawNodeProps<T>

  /** Converts this node instance into a renderable React element/tree */
  render(): ReactNode

  /** Creates Portal-compatible React elements for rendering outside of the DOM tree */
  toPortal(): ReactDOMRoot | null
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
    : NodeInstance<E>

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
  nodetheme?: Theme
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
  (HasCSSCompatibleStyleProp<PropsOf<E>> extends true ? Partial<Omit<CSSProperties, keyof Omit<PropsOf<E>, 'style' | 'children'>>> : object) & {
    children?: Children | Children[]
    theme?: Theme
  }

/**
 * BaseNode's internal props type, extending NodeProps:
 * - Makes all properties optional for flexible node creation
 * - Adds nodetheme for theme context handling
 * - Used for both initial construction and internal state
 * @template E - The element type these props apply to
 */
export type RawNodeProps<E extends NodeElement> = Partial<NodeProps<E>> & { nodetheme?: Theme }

/**
 * Props interface for the internal FunctionRenderer component.
 * Handles dynamic function children within React's component lifecycle:
 * - Ensures proper timing of function evaluation
 * - Maintains theme context for rendered content
 * - Enables hook usage in function children
 */
export interface FunctionRendererProps<E extends NodeElement> {
  /** Function that returns the child content to render */
  render: (props?: NodeProps<E>) => ReactNode | NodeInstance<E>

  /** Theme context to be applied to the rendered content */
  passedTheme?: Theme

  /** Optional key prop to help React identify unique instances in lists */
  passedKey?: string

  processRawNode: (node: NodeElement, parentTheme?: Theme, childIndex?: number) => NodeInstance<E>
}

export type ComponentNode = (NodeInstance<any> | ReactNode) | (() => NodeInstance<any> | ReactNode)

/**
 * Props type for components rendered through the Portal HOC.
 * Extends the component's own props with portal-specific functionality.
 * @template T The component's own prop types
 */
export type PortalProps<T extends Record<string, any>> = T & {
  /** Content to render within the portal */
  children?: NodeElement | NodeElement[]

  /** Portal control object containing lifecycle methods */
  portal: {
    /** Unmounts and cleans up the portal */
    unmount: () => void
  }
}

/**
 * Function type for creating portal instances when Portal is called with just a component.
 * Allows passing providers through props at portal creation time.
 * @template P_Content The portal content component's prop types
 */
export type PortalLauncher<P extends Record<string, any>> = (
  props: P & {
    /** Optional provider components to wrap the portal content */
    providers?: NodeInstance<any> | NodeInstance<any>[]
  } & Omit<PortalProps<P>, 'portal'>,
) => ReactDOMRoot | null

/**
 * Function type for creating portal instances when Portal is called with providers and component.
 * Uses fixed providers specified at HOC creation time.
 * @template P The portal content component's prop types
 */
export type PortalLauncherWithFixedProviders<P extends Record<string, any>> = (props: P & Omit<PortalProps<P>, 'portal'>) => ReactDOMRoot | null
