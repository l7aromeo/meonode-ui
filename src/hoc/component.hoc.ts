'use strict'

import { BaseNode, Node } from '@src/core.node.js'
import type { Children, ComponentNode, HasCSSCompatibleStyleProp } from '@src/node.type.js'
import { type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { getElementTypeName } from '@src/helper/common.helper.js'
import { isNodeInstance } from '@src/helper/node.helper.js'

/**
 * Props definition for components wrapped using the `Component` higher-order function.
 *
 * This type adapts based on whether the underlying component defines its own props:
 *
 * - If `TProps` is `undefined`, only `children` can be passed.
 * - If `TProps` is defined, the component will accept:
 *   - The full prop shape `TProps`
 *   - Optional `props` to override part of `TProps` (excluding `children`)
 *   - Optional `children`
 *
 * If the component supports inline styles (determined via `HasCSSCompatibleStyleProp`), the props also allow `CSSProperties`.
 */
export type ComponentNodeProps<TProps> = TProps extends undefined
  ? Partial<{
      children: Children
    }>
  : TProps &
      (HasCSSCompatibleStyleProp<TProps> extends true ? CSSProperties : object) &
      Partial<{
        props: Partial<Omit<TProps, 'children'>>
        children: Children
      }>

/**
 * Creates a component from a function that uses no custom props.
 * @template TProps Must be `undefined`
 * @param component A function that returns a MeoNode `ComponentNode` and only uses basic props like `children`.
 * @returns A React-compatible component that can accept `children`.
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
 * @returns A React-compatible component that supports full prop shape and `children`/`props` overrides.
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
 * Handles BaseNode conversion and wrapper creation.
 */
export function Component<TProps extends Record<string, any> | undefined>(component: (props: ComponentNodeProps<TProps>) => ComponentNode) {
  type RendererProps = ComponentNodeProps<TProps>

  const displayName = getElementTypeName(component)

  const Renderer = (props: RendererProps) => {
    const result = component(props)

    if (result instanceof BaseNode || isNodeInstance(result)) {
      return Node(result.element, result.rawProps).render()
    }

    return result as ReactNode
  }
  Renderer.displayName = `Renderer(${displayName})`

  function Func(props: Partial<ComponentNodeProps<TProps>> = {}) {
    return Node(Renderer, props as never).render()
  }
  Func.displayName = `Component(${displayName})`

  return Func
}
