'use strict'

import { BaseNode, Node } from '@src/core.node.js'
import type { ComponentNode, HasCSSCompatibleStyleProp, NodeElement, Theme } from '@src/node.type.js'
import { type CSSProperties, type ReactElement, type ReactNode } from 'react'

/**
 * Props definition for components wrapped using the `Component` higher-order function.
 *
 * This type adapts based on whether the underlying component defines its own props:
 *
 * - If `TProps` is `undefined`, only `children` and `theme` can be passed.
 * - If `TProps` is defined, the component will accept:
 *   - The full prop shape `TProps`
 *   - Optional `props` to override part of `TProps` (excluding `children`)
 *   - Optional `children`
 *   - Optional `theme`
 *
 * If the component supports inline styles (determined via `HasCSSCompatibleStyleProp`), the props also allow `CSSProperties`.
 */
export type ComponentNodeProps<TProps> = TProps extends undefined
  ? Partial<{
      children: NodeElement | NodeElement[]
      theme: Theme
    }>
  : TProps &
      (HasCSSCompatibleStyleProp<TProps> extends true ? CSSProperties : object) &
      Partial<{
        props: Partial<Omit<TProps, 'children'>>
        children: NodeElement | NodeElement[]
        theme: Theme
      }>

/**
 * Creates a component from a function that uses no custom props.
 * @template TProps Must be `undefined`
 * @param component A function that returns a MeoNode `ComponentNode` and only uses basic props like `children` and `theme`.
 * @returns A React-compatible component that can accept `children` and `theme`.
 * @example
 * ```ts
 * const Title = Component((props) => {
 *   return H1(props.children)
 * })
 *
 * Title({ children: 'Hello' })
 * ```
 */
export function Component<TProps extends undefined>(
  component: (props: ComponentNodeProps<TProps>) => ComponentNode,
): (props?: ComponentNodeProps<TProps>) => ReactElement | Promise<Awaited<ReactElement>>

/**
 * Creates a component from a function that uses a defined props interface.
 * @template TProps Props interface expected by the component.
 * @param component A function that returns a MeoNode `ComponentNode` using props of type `TProps`.
 * @returns A React-compatible component that supports full prop shape and `theme`/`children`/`props` overrides.
 * @example
 * ```ts
 * interface ButtonProps {
 *   label: string
 *   onClick: () => void
 * }
 *
 * const Button = Component<ButtonProps>((props) => {
 *   return Div({
 *     children: props.label,
 *     onClick: props.onClick,
 *   })
 * })
 *
 * Button({ label: 'Click me', onClick: () => alert('clicked')})
 * ```
 */
export function Component<TProps extends Record<string, any>>(
  component: (props: ComponentNodeProps<TProps>) => ComponentNode,
): (props: ComponentNodeProps<TProps>) => ReactElement | Promise<Awaited<ReactElement>>

/**
 * Internal implementation of the `Component` HOC.
 * Handles theme propagation, BaseNode conversion, and wrapper creation.
 */
export function Component<TProps extends Record<string, any> | undefined>(component: (props: ComponentNodeProps<TProps>) => ComponentNode) {
  type RendererProps = ComponentNodeProps<TProps> & { nodetheme?: Theme }

  const Renderer = (props: RendererProps) => {
    const result = component(props)

    if (result instanceof BaseNode) {
      const theme = result.rawProps?.nodetheme || result.rawProps?.theme || props.nodetheme || props.theme
      return Node(result.element, {
        ...result.rawProps,
        nodetheme: theme,
      }).render()
    }

    return result as ReactNode
  }

  return function Func(props: Partial<ComponentNodeProps<TProps>> = {}) {
    return Node(Renderer, props as never).render()
  }
}
