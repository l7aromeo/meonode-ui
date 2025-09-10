'use strict'
import React, {
  type Attributes as ReactAttributes,
  type CSSProperties,
  type ReactNode,
  type JSX,
  type ElementType,
  type ComponentType,
  type JSXElementConstructor,
  type Component,
  type Ref,
  type ExoticComponent,
  type FragmentProps,
  type ReactElement,
} from 'react'
import type { Root as ReactDOMRoot } from 'react-dom/client'
import type { CSSInterpolation } from '@emotion/serialize'
import type { NO_STYLE_TAGS } from '@src/constants/common.const'

// --- Utility Types ---
// Utility to get keys of required properties in a type T.
type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K
}[keyof T]

// Utility to check if a type T has any required properties.
export type HasRequiredProps<T> = RequiredKeys<T> extends never ? false : true

/**
 * Excludes array types from ReactNode, ensuring a single, non-array React element or primitive.
 */
export type NonArrayReactNode = Exclude<ReactNode, ReactNode[]>

/**
 * Defines the various types that can represent a "node" in the Meonode system.
 * This includes React elements, components, promises resolving to React nodes, and NodeInstance objects.
 */
export type NodeElement =
  | ExoticComponent<FragmentProps>
  | NonArrayReactNode
  | Promise<Awaited<NonArrayReactNode>>
  | Component<any, any, any>
  | ElementType
  | ComponentType<any>
  | NodeInstance<any>
  | ((props?: any) => NonArrayReactNode | Promise<Awaited<NonArrayReactNode>> | Component<any, any, any> | NodeInstance<any> | ComponentNode)

/**
 * Forward declaration of the BaseNode interface to avoid circular dependencies.
 * Defines the core structure and capabilities of a BaseNode instance.
 * @template T - The type of React element/component that this node represents
 */
export interface NodeInstance<T extends NodeElement = NodeElement> {
  /** The underlying React element or component type that this node will render */
  readonly element: T

  /** Original props passed during node construction, preserved for cloning/recreation */
  readonly rawProps: RawNodeProps<T>

  readonly isBaseNode: true

  /** Converts this node instance into a renderable React element/tree */
  render(): ReactElement

  /** Creates Portal-compatible React elements for rendering outside of the DOM tree */
  toPortal(): ReactDOMRoot | null
}

/**
 * Infers the props type for a given NodeElement.
 * - For intrinsic JSX elements (e.g., 'div', 'span'), returns the corresponding JSX.IntrinsicElements props.
 * - For React components (function or class), infers the props from the component type.
 * - For objects with a `props` property, infers the type from that property.
 * - Otherwise, resolves to `never`.
 * @template E - The NodeElement type to extract props from.
 */
export type PropsOf<E extends NodeElement> = E extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[E]
  : E extends JSXElementConstructor<infer P>
    ? P
    : E extends { props: infer Q }
      ? Q
      : never

/**
 * Theme configuration object that can be passed through the node tree.
 * Supports nested theme properties for complex styling systems:
 * - Simple values (strings, numbers)
 * - Nested theme objects with unlimited depth
 * - Common CSS values and units
 * - Custom theme variables and tokens
 * Used for consistent styling and dynamic theme application.
 */
export type Theme = Partial<{
  [key: string]: string | number | boolean | null | undefined | any | Theme | Record<string, Theme | string | number | boolean | null | undefined | any>
}>

/**
 * Internal props type used by BaseNode instances after initial processing.
 * Ensures consistent prop shape throughout the node's lifecycle:
 * - Normalizes style properties into a CSSProperties object
 * - Processes children into known concrete types
 * - Handles theme context propagation
 * @template E - The element type these props apply to
 */
export type FinalNodeProps = ReactAttributes & {
  ref?: Ref<unknown>
  style?: CSSProperties
  css?: CSSInterpolation
  children?: NodeElement | NodeElement[]
  theme?: Theme
  nodetheme?: Theme
  nativeProps?: Record<string, unknown>
}

/**
 * Helper type to determine if the props P have a 'style' property
 * that is compatible with CSSProperties.
 * @template P - The props object of a component (e.g., PropsOf<E>)
 */
export type HasCSSCompatibleStyleProp<P> = P extends { style?: infer S } // Does P have a 'style' prop (even optional)?
  ? S extends CSSProperties | undefined // Is the type of that 'style' prop (S) assignable to CSSProperties or undefined?
    ? true // Yes, it's CSS compatible
    : false // No, 'style' exists but is not CSSProperties (e.g., style: string)
  : false // No, P does not have a 'style' prop at all

/** List of HTML tags that should not receive style props */
export type NoStyleTags = (typeof NO_STYLE_TAGS)[number]

/**
 * Helper type to determine if the element E is a tag that should not receive style props.
 * Uses the NO_STYLE_TAGS constant to check against known tags.
 * @template E - The element type (e.g., 'div', 'span', 'script')
 */
export type HasNoStyleProp<E extends NodeElement> = E extends NoStyleTags ? true : false

/**
 * Public API for node creation props, providing a flexible and type-safe interface:
 * - Preserves original component props while allowing direct style properties (conditionally)
 * - Supports both single and array children
 * - Enables theme customization
 * - Maintains React's key prop for reconciliation
 * @template E - The element type these props apply to
 */
export type NodeProps<E extends NodeElement> = Omit<PropsOf<E>, keyof CSSProperties | 'children' | 'style' | 'theme' | 'props'> &
  ReactAttributes &
  (HasCSSCompatibleStyleProp<PropsOf<E>> extends true ? CSSProperties : object) &
  (HasNoStyleProp<E> extends true ? Partial<{ css: CSSInterpolation }> : object) &
  Partial<{
    props: Partial<Omit<PropsOf<E>, 'children'>>
    children: NodeElement | NodeElement[]
    theme: Theme
  }>

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
  render: (props?: NodeProps<E>) => ReactNode | Promise<Awaited<ReactNode>> | React.Component | NodeInstance<E>

  /** Theme context to be applied to the rendered content */
  passedTheme?: Theme

  /** Optional key prop to help React identify unique instances in lists */
  passedKey?: string

  processRawNode: (node: NodeElement, parentTheme?: Theme, childIndex?: number) => NodeElement
}

export type ComponentNode = (NodeInstance<any> | ReactNode) | (() => NodeInstance<any> | ReactNode)

/**
 * Base props interface for components rendered inside a portal.
 * @property children - The content to render within the portal. Accepts a single NodeElement or an array of NodeElements.
 * @property portal - An object providing portal lifecycle control methods.
 * @property unmount - Function to unmount and clean up the portal instance.
 */
export interface BasePortalProps {
  /** Content to render within the portal */
  children?: NodeElement | NodeElement[]

  /** Portal control object containing lifecycle methods */
  portal: {
    /** Unmounts and cleans up the portal */
    unmount: () => void
  }
}

/**
 * Props type for components rendered through the Portal HOC.
 * Extends the component's own props with portal-specific functionality.
 * @template T The component's own prop types
 */
export type PortalProps<T extends BasePortalProps | Record<string, any>> = T & BasePortalProps

/**
 * Function type for creating portal instances.
 * Allows passing providers through props at portal creation time.
 * @template P The portal content component's prop types
 */
export type PortalLauncher<P extends BasePortalProps | Record<string, any>> = P extends BasePortalProps
  ? (props?: {
      /** Optional provider components to wrap the portal content */
      provider?: NodeInstance<any>
    }) => ReactDOMRoot | null
  : (
      props: P & {
        /** Optional provider components to wrap the portal content */
        provider?: NodeInstance<any>
      } & Omit<PortalProps<P>, 'portal'>,
    ) => ReactDOMRoot | null

/**
 * Merges `NodeProps<E>` with additional custom props, giving precedence to `AdditionalProps`.
 * Useful for extending node props with extra properties, while overriding any overlapping keys.
 * @template E - The node element type
 * @template AdditionalProps - The additional props to merge in
 */
export type MergedProps<E extends NodeElement, AdditionalProps extends Record<string, any>> = Omit<NodeProps<E> & AdditionalProps, keyof AdditionalProps> &
  AdditionalProps
