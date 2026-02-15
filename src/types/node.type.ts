import React, {
  type CSSProperties,
  type ReactNode,
  type JSX,
  type ElementType,
  type ComponentType,
  type JSXElementConstructor,
  type Component,
  type ComponentProps,
  type ExoticComponent,
  type ReactElement,
} from 'react'
import type { NO_STYLE_TAGS } from '@src/constant/common.const.js'
import type { ComponentNodeProps } from '@src/hoc/component.hoc.js'
import type { CSSInterpolation } from '@emotion/serialize'
import { BaseNode } from '@src/core.node.js'

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Utility to get keys of required properties in a type T */
type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K
}[keyof T]

/** Utility to check if a type T has any required properties */
export type HasRequiredProps<T> = RequiredKeys<T> extends never ? false : true

/**
 * A list of dependencies for a memoized value.
 * Mimics React's `DependencyList`.
 */
export type DependencyList = readonly any[]

/**
 * Excludes array types from ReactNode, ensuring a single, non-array React element or primitive.
 */
export type NonArrayReactNode = Exclude<ReactNode, ReactNode[]>

// ============================================================================
// ELEMENT TYPE DEFINITIONS
// ============================================================================

/**
 * Defines the various types that can represent a "node" in the Meonode system.
 * This includes React elements, components, promises resolving to React nodes, and NodeInstance objects.
 */
export type NodeElement<E extends NodeElementType = NodeElementType, P extends Record<string, unknown> = Record<string, unknown>> =
  | ExoticComponent<P>
  | NonArrayReactNode
  | Promise<Awaited<NonArrayReactNode>>
  | Component<P, any, any>
  | ComponentType<P>
  | NodeInstance<E>
  | NodeFunction<E>
  | E
  | ((props?: Record<string, unknown>) => ExoticComponent | NonArrayReactNode | Component | ComponentType | NodeInstance)

/**
 * Valid element types that can be passed to Node/createNode.
 * More precise type for element type parameters.
 */
export type NodeElementType =
  | ElementType
  | (ExoticComponent & { $$typeof?: symbol })
  | (<TProps extends Record<string, unknown> | undefined>(props: ComponentNodeProps<TProps>) => ComponentNode)

/** A single NodeElement or an array of NodeElements */
export type Children = NodeElement | NodeElement[]

/** List of HTML tags that should not receive style props */
export type NoStyleTags = (typeof NO_STYLE_TAGS)[number]

/**
 * Helper type to determine if the element E is a tag that should not receive style props.
 * Uses the NO_STYLE_TAGS constant to check against known tags.
 * @template E - The element type (e.g., 'div', 'span', 'script')
 */
export type HasNoStyleProp<E extends NodeElement> = E extends NoStyleTags ? true : false

// ============================================================================
// NODE INSTANCE & CACHE
// ============================================================================

/**
 * Forward declaration of the BaseNode interface to avoid circular dependencies.
 * Defines the core structure and capabilities of a BaseNode instance.
 * @template E - The type of React element/component that this node represents
 */
export type NodeInstance<E extends NodeElementType = NodeElementType> = BaseNode<E>

/**
 * Represents an entry in the element cache.
 * Stores the rendered React element and its previous dependencies for memoization.
 */
export interface ElementCacheEntry<E extends NodeElementType = NodeElementType> {
  /** The fully rendered React element, ready to be returned by the component. */
  renderedElement: ReactElement<FinalNodeProps>
  /** The list of dependencies from the previous render, used for change detection. */
  prevDeps?: DependencyList
  /** A weak reference to the `NodeInstance` that owns this cache entry. */
  nodeRef: WeakRef<NodeInstance<E>>
  /** Timestamp of when this cache entry was created. */
  createdAt: number
  /** Number of times this cache entry has been accessed/reused. */
  accessCount: number
  /** Unique identifier of the node instance, used for validation. */
  instanceId: string
}

/**
 * Work item for processing queue.
 */
export interface WorkItem {
  /** The node instance being processed. */
  node: NodeInstance
  /** Flag indicating if the node has been visited (begin phase) or is being completed (end phase). */
  isProcessed: boolean
  /** Flag indicating if the node's children should be skipped (blocked) due to memoization. */
  blocked: boolean
}

// ============================================================================
// PROPS EXTRACTION & VALIDATION
// ============================================================================

/**
 * Extracts props type from a given element type.
 * Uses a hybrid approach for maximum compatibility:
 * - Intrinsic elements (div, span, etc.): JSX.IntrinsicElements
 * - Simple function components: JSXElementConstructor inference (MUST come before ElementType!)
 * - Complex components (MUI, etc.): ComponentProps fallback
 * @template E - The element type to extract props from
 */
export type PropsOf<E extends NodeElementType> = E extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[E]
  : E extends JSXElementConstructor<infer P>
    ? P
    : E extends ElementType
      ? ComponentProps<E>
      : E extends { props: infer Q }
        ? Q
        : never

/**
 * Helper type to determine if the props P have a 'style' property
 * that is compatible with CSSProperties.
 * @template P - The props object of a component (e.g., PropsOf<E>)
 */
export type HasCSSCompatibleStyleProp<P> = P extends { style?: infer S } // Does P have a 'style' prop (even optional)?
  ? S extends CSSProperties | Record<string, unknown> | undefined // Is the type of that 'style' prop (S) assignable to CSSProperties or undefined?
    ? true // Yes, it's CSS compatible
    : false // No, 'style' exists but is not CSSProperties (e.g., style: string)
  : false // No, P does not have a 'style' prop at all

/**
 * Helper type to enforce strict prop validation for React components.
 * Uses a mapped type to check each prop against NodeProps.
 * - For HTML elements: allows any props (permissive)
 * - For Components: maps invalid props to `never`, causing a type error on that specific prop
 */
export type ValidateComponentProps<E extends NodeElementType, P> = E extends keyof JSX.IntrinsicElements
  ? P
  : { [K in keyof P]: K extends keyof NodeProps<E> ? P[K] : never }

// ============================================================================
// THEME TYPES
// ============================================================================

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
 * A value that can be a direct value or a function of the theme.
 */
export type ThemedValue<T> = T | ((theme: Theme) => T)

/**
 * A themed version of CSSProperties where each property can be a theme-dependent function.
 */
export type ThemedCSSProperties = {
  [P in keyof CSSProperties]: ThemedValue<CSSProperties[P]>
}

/**
 * A themed version of Emotion's `CSSObject` type. It allows property values to be
 * functions that receive the theme. This is applied recursively to handle
 * nested objects like pseudo-selectors and media queries.
 *
 * Supports theme functions at any nesting level:
 * ```ts
 * css: {
 *   backgroundColor: theme => theme.colors.primary,  // ✓ Top level
 *   '&:hover': {
 *     backgroundColor: theme => theme.colors.hover,  // ✓ Nested level
 *   }
 * }
 * ```
 */
export type ThemedCSSObject = {
  // Standard CSS properties from CSSObject with themed values
  [P in keyof CSSProperties]?: ThemedValue<CSSProperties[P]>
} & {
  // Index signature for nested selectors (pseudo-classes, media queries, child selectors)
  // This allows arbitrary string keys like '&:hover', '@media...', '& .child', etc.
  [key: string]: ThemedValue<ThemedCSSObject> | ThemedValue<CSSProperties[keyof CSSProperties]> | undefined
}

/**
 * The complete type for the `css` prop, combining Emotion's `CSSInterpolation`
 * with a themed version (`ThemedCSSObject`) to support theme-aware styling functions.
 */
export type CssProp = ThemedCSSObject | CSSInterpolation

// ============================================================================
// NODE PROPS TYPES
// ============================================================================

/**
 * Internal props type used by BaseNode instances after initial processing.
 * Ensures consistent prop shape throughout the node's lifecycle:
 * - Normalizes style properties into a CSSProperties object
 * - Processes children into known concrete types
 * @template E - The element type these props apply to
 */
export type FinalNodeProps = React.Attributes &
  Partial<{
    /**
     * Props native to the element (e.g., HTML attributes like `id`, `className`, `src`),
     * excluding `children` and `style` which are handled separately.
     */
    nativeProps: PropsOf<NodeElementType> & { children?: never; style?: never }

    /**
     * React ref to access the underlying DOM element or component instance.
     */
    ref: any | React.Ref<unknown> | undefined

    /**
     * Inline styles for the element.
     * Can be a standard `CSSProperties` object or a themed style function.
     */
    style: any

    /**
     * Emotion CSS prop for styling.
     * Accepts a CSS object, a template literal, or a themed style function that receives the theme.
     */
    css: CssProp

    /**
     * If true, disables the Emotion-based `StyledRenderer` for this node.
     */
    disableEmotion: boolean

    /**
     * The content of the node.
     */
    children: Children

    /**
     * Index signature to allow for any other properties that might be passed
     * (though strict typing usually catches these at the creation site).
     */
    [key: string]: any
  }>

export type BaseNodeProps<E extends NodeElementType> = Partial<{
  /**
   * If true, disables the Emotion-based `StyledRenderer` for this node.
   * This prevents the creation of a styled component wrapper, which can improve performance
   * for nodes that do not require dynamic styling or theme access.
   * When disabled, the `css` prop will be ignored.
   */
  disableEmotion: boolean

  /**
   * The properties of the node, excluding children.
   * We use Omit to safely exclude children even if the component's props type has children as a required property.
   * This allows for cleaner prop spreading and manipulation within the node logic.
   */
  props: Partial<Omit<PropsOf<E>, 'children'> & { children?: never }>

  /**
   * The children of the node.
   * Can be a single `NodeElement` (e.g., a string, a React element, another `NodeInstance`)
   * or an array of `NodeElement`s.
   */
  children: Children
}>

/**
 * Public API for node creation props, providing a flexible and type-safe interface:
 * - Preserves original component props while allowing direct style properties (conditionally)
 * - Supports both single and array children
 * - Maintains React's key prop for reconciliation
 * @template E - The element type these props apply to
 */
export type NodeProps<E extends NodeElementType = NodeElementType> = Omit<PropsOf<E>, keyof CSSProperties | 'children' | 'props' | 'key'> &
  React.Attributes &
  React.RefAttributes<unknown> &
  (HasCSSCompatibleStyleProp<PropsOf<E>> extends true ? ThemedCSSProperties : object) &
  (HasNoStyleProp<E> extends false ? Partial<{ css: CssProp }> : object) &
  BaseNodeProps<E>

/**
 * Merges `NodeProps<E>` with additional custom props, giving precedence to `AdditionalProps`.
 * Useful for extending node props with extra properties, while overriding any overlapping keys.
 * @template E - The node element type
 * @template AdditionalProps - The additional props to merge in
 */
export type MergedProps<E extends NodeElementType, AdditionalProps, ExactProps> = NodeProps<E> &
  ValidateComponentProps<E, ExactProps> &
  (AdditionalProps extends undefined ? ValidateComponentProps<E, ExactProps> : AdditionalProps)

// ============================================================================
// FUNCTION CHILDREN
// ============================================================================

/**
 * Function type for dynamic node content generation.
 * Accepts optional NodeProps and returns a ReactNode or NodeInstance.
 * Enables advanced patterns like render props and dynamic theming.
 * @template E - The element type these props apply to
 */
export type NodeFunction<E extends NodeElementType = NodeElementType> = (props?: NodeProps<E>) => ReactNode | NodeInstance | React.Component

/**
 * Props interface for the internal FunctionRenderer component.
 * Handles dynamic function children within React's component lifecycle:
 * - Ensures proper timing of function evaluation
 * - Maintains theme context for rendered content
 * - Enables hook usage in function children
 */
export interface FunctionRendererProps<E extends NodeElementType> {
  /** Function that returns the child content to render */
  render: NodeFunction<E>

  /**
   * If true, disables the Emotion-based `StyledRenderer` for this node.
   */
  disableEmotion?: boolean
}

/**
 * Represents a component node which can be:
 * - A `NodeInstance` (created via `Node()` or `createNode()`)
 * - A standard `ReactNode`
 * - A function returning either of the above (for lazy evaluation)
 */
export type ComponentNode = (NodeInstance | ReactNode) | (() => NodeInstance | ReactNode)

// ============================================================================
// PORTAL TYPES
// ============================================================================

/**
 * A ref-based pub/sub data channel for pushing updates to portal layers
 * without re-rendering the parent component.
 * @template T The data type managed by the channel.
 */
export interface DataChannel<T = any> {
  /** Returns the current data value */
  get: () => T
  /** Sets a new data value and notifies all subscribers */
  set: (next: T) => void
  /** Subscribes to data changes. Returns an unsubscribe function. */
  subscribe: (cb: (data: T) => void) => () => void
}

/**
 * An entry in the portal stack managed by PortalProvider.
 * @template T The data type for this portal layer.
 * @internal
 */
export interface PortalStackEntry<T = any> {
  id: number
  Component: React.ComponentType<PortalLayerProps<T>>
  channel: DataChannel<T>
}

/**
 * Props received by components rendered inside a portal layer.
 * @template T The data type passed via the data channel.
 */
export interface PortalLayerProps<T = any> {
  /** Current data from the data channel */
  data: T
  /** The depth of this layer in the portal stack (1-indexed from bottom) */
  depth: number
  /** Closes this specific portal layer */
  close: () => void
}

/**
 * Handle returned by `showPortal` or `usePortal().open` for controlling a portal instance.
 * @template T The data type for this portal.
 */
export interface PortalHandle<T = any> {
  /** Unique identifier for this portal layer */
  id: number
  /** Pushes new data to the portal layer without re-rendering the parent */
  updateData: (next: T) => void
  /** Closes this specific portal layer */
  close: () => void
}

/**
 * The value provided by PortalContext for managing the portal stack.
 */
export interface PortalContextValue {
  /** Current portal stack entries */
  stack: PortalStackEntry[]
  /** Opens a new portal layer with a component and optional initial data */
  showPortal: <T>(Component: React.ComponentType<PortalLayerProps<T>>, initialData?: T) => PortalHandle<T>
  /** Closes the topmost portal layer */
  hidePortal: () => void
  /** Closes a specific portal layer by its id */
  hidePortalById: (id: number) => void
  /** Closes all portal layers */
  hideAll: () => void
}
