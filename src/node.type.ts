import React, {
  type CSSProperties,
  type ReactNode,
  type JSX,
  type ElementType,
  type ComponentType,
  type JSXElementConstructor,
  type Component,
  type ExoticComponent,
  type ReactElement,
} from 'react'
import type { NO_STYLE_TAGS } from '@src/constants/common.const.js'
import type { ComponentNodeProps } from '@src/hoc/component.hoc.js'
import type { CSSObject, CSSInterpolation } from '@emotion/serialize'

// --- Utility Types ---
// Utility to get keys of required properties in a type T.
type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K
}[keyof T]

// Utility to check if a type T has any required properties.
export type HasRequiredProps<T> = RequiredKeys<T> extends never ? false : true

/** Basic React attributes, currently only includes 'key' */
export interface ReactAttributes {
  key?: string
}

/**
 * Excludes array types from ReactNode, ensuring a single, non-array React element or primitive.
 */
export type NonArrayReactNode = Exclude<ReactNode, ReactNode[]>

/**
 * Defines the various types that can represent a "node" in the Meonode system.
 * This includes React elements, components, promises resolving to React nodes, and NodeInstance objects.
 */
export type NodeElement =
  | ExoticComponent<any>
  | NonArrayReactNode
  | Promise<Awaited<NonArrayReactNode>>
  | Component<any, any, any>
  | ElementType
  | ComponentType<any>
  | NodeInstance<any>
  | NodeFunction<any>
  | NodeElementType
  | ((
      props?: Record<string, any>,
    ) => ExoticComponent<any> | NonArrayReactNode | Component<any, any, any> | ElementType | ComponentType<any> | NodeInstance<any>)

export type NodeElementType =
  | ElementType
  | (ExoticComponent & { $$typeof?: symbol })
  | (<TProps extends Record<string, any> | undefined>(props: ComponentNodeProps<TProps>) => ComponentNode)

/** A single NodeElement or an array of NodeElements */
export type Children = NodeElement | NodeElement[]

/**
 * Forward declaration of the BaseNode interface to avoid circular dependencies.
 * Defines the core structure and capabilities of a BaseNode instance.
 * @template E - The type of React element/component that this node represents
 */
export interface NodeInstance<E extends NodeElement = NodeElement> {
  /** The underlying React element or component type that this node will render */
  readonly element: E

  /** Original props passed during node construction, preserved for cloning/recreation */
  readonly rawProps: Partial<NodeProps<E>>

  readonly isBaseNode: true

  /** Converts this node instance into a renderable React element/tree */
  render(): ReactElement

  /** Creates Portal-compatible React elements for rendering outside the DOM tree */
  toPortal(): NodePortal
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
 * Theme mode - light or dark theme variant
 */
export type ThemeMode = 'light' | 'dark' | string

/**
 * System theme configuration with base colors and semantic tokens
 */
export interface ThemeSystem {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | any
    | ThemeSystem
    | Record<string, ThemeSystem | string | number | boolean | null | undefined | any>
}

/**
 * Theme configuration object.
 * Requires `mode` and `system` as core theme properties, with support for
 * unlimited nested theme properties for complex styling systems:
 * - Simple values (strings, numbers, booleans)
 * - Nested theme objects with unlimited depth
 * - Common CSS values and units
 * - Custom theme variables and tokens
 * Used for consistent styling and dynamic theme application.
 */
export type Theme = {
  /** Current theme mode (light/dark) */
  mode: ThemeMode
  /** System theme configuration with colors and tokens */
  system: ThemeSystem
} & Partial<{
  [key: string]: string | number | boolean | null | undefined | any | Theme | Record<string, Theme | string | number | boolean | null | undefined | any>
}>

/**
 * Internal props type used by BaseNode instances after initial processing.
 * Ensures consistent prop shape throughout the node's lifecycle:
 * - Normalizes style properties into a CSSProperties object
 * - Processes children into known concrete types
 * @template E - The element type these props apply to
 */
export type FinalNodeProps = ReactAttributes &
  Partial<{
    nativeProps: Omit<Omit<PropsOf<NodeElement>, 'children'>, 'style'>
    ref: any | React.Ref<unknown> | undefined
    style: any
    css: any
    disableEmotion: boolean
    children: Children
  }>

/**
 * A value that can be a direct value or a function of the theme.
 */
type ThemedValue<T> = T | ((theme: Theme) => T)

/**
 * A themed version of CSSProperties where each property can be a theme-dependent function.
 */
type ThemedCSSProperties = {
  [P in keyof CSSProperties]: ThemedValue<CSSProperties[P]>
}

/**
 * A themed version of Emotion's `CSSObject` type. It allows property values to be
 * functions that receive the theme. This is applied recursively to handle
 * nested objects like pseudo-selectors and media queries.
 */
type ThemedCSSObject = {
  [P in keyof CSSObject]: ThemedValue<CSSObject[P] extends object ? ThemedCSSObject : CSSObject[P]>
}

/**
 * The complete type for the `css` prop, combining Emotion's `CSSInterpolation`
 * with a themed version (`ThemedCSSObject`) to support theme-aware styling functions.
 */
export type CssProp = ThemedCSSObject | CSSInterpolation

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
 * - Maintains React's key prop for reconciliation
 * @template E - The element type these props apply to
 */
export type NodeProps<E extends NodeElement> = Omit<PropsOf<E>, keyof CSSProperties | 'children' | 'style' | 'props' | 'key'> &
  ReactAttributes &
  (HasCSSCompatibleStyleProp<PropsOf<E>> extends true ? ThemedCSSProperties : object) &
  (HasNoStyleProp<E> extends false ? Partial<{ css: CssProp }> : object) &
  Partial<{
    disableEmotion: boolean
    props: Partial<Omit<PropsOf<E>, 'children'>>
    children: Children
  }>

/**
 * Function type for dynamic node content generation.
 * Accepts optional NodeProps and returns a ReactNode or NodeInstance.
 * Enables advanced patterns like render props and dynamic theming.
 * @template E - The element type these props apply to
 */
export type NodeFunction<E extends ReactNode | NodeInstance = ReactNode | NodeInstance> = (props?: NodeProps<E>) => ReactNode | NodeInstance | React.Component

/**
 * Props interface for the internal FunctionRenderer component.
 * Handles dynamic function children within React's component lifecycle:
 * - Ensures proper timing of function evaluation
 * - Maintains theme context for rendered content
 * - Enables hook usage in function children
 */
export interface FunctionRendererProps<E extends ReactNode | NodeInstance> {
  /** Function that returns the child content to render */
  render: NodeFunction<E>
  disableEmotion?: boolean
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
  children?: Children

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
 * Interface representing a portal instance with lifecycle methods.
 * Provides methods to unmount the portal and update its content dynamically.
 */
export interface NodePortal {
  unmount: () => void
  update: (node: NodeElement) => void
}

/**
 * Function type for creating portal instances.
 * Allows passing providers through props at portal creation time.
 * @template P The portal content component's prop types
 */
export type PortalLauncher<P extends BasePortalProps | Record<string, any>> = (
  props?: (P & { provider?: NodeInstance<any> }) & Omit<PortalProps<P>, 'portal'>,
) => NodePortal

/**
 * Merges `NodeProps<E>` with additional custom props, giving precedence to `AdditionalProps`.
 * Useful for extending node props with extra properties, while overriding any overlapping keys.
 * @template E - The node element type
 * @template AdditionalProps - The additional props to merge in
 */
export type MergedProps<E extends NodeElement, AdditionalProps extends Record<string, any>> = Omit<NodeProps<E> & AdditionalProps, keyof AdditionalProps> &
  AdditionalProps
