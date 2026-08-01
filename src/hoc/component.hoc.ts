import type React from 'react'
import { BaseNode, Node } from '@src/core.node.js'
import type { Children, ComponentNode, DependencyList, HasCSSCompatibleStyleProp, ThemedCSSProperties } from '@src/types/node.type.js'
import type { ReactElement, ReactNode } from 'react'
import { getElementTypeName } from '@src/helper/common.helper.js'
import { NodeUtil } from '@src/util/node.util.js'

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
      key: React.Key
      children: Children
    }>
  : (
      | TProps
      // `props` is the escape hatch for component props whose names collide
      // with CSS properties ("wrap it in `props` so the styling engine ignores
      // it"). A caller using it must not also be forced to repeat those props
      // at the top level, so this branch accepts them there instead.
      | (Partial<TProps> & { props: Partial<TProps> & { children?: never } })
    ) &
      (HasCSSCompatibleStyleProp<TProps> extends true ? ThemedCSSProperties : object) &
      Partial<{
        /**
         * React's key. Never required — children are spread variadically into
         * `createElement`, so React does not ask for one — but always allowed,
         * for callers who want to pin identity across a reorder. It is consumed
         * by the node and never forwarded to the component's own props.
         */
        key: React.Key
        props: Partial<TProps> & { children?: never }
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
): (props?: ComponentNodeProps<TProps>, deps?: DependencyList) => ReactElement | Promise<Awaited<ReactElement>>

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
): (props: ComponentNodeProps<TProps>, deps?: DependencyList) => ReactElement | Promise<Awaited<ReactElement>>

/**
 * Internal implementation of the `Component` HOC.
 * Handles BaseNode conversion and wrapper creation.
 */
export function Component<TProps extends Record<string, any> | undefined>(component: (props: ComponentNodeProps<TProps>) => ComponentNode) {
  type RendererProps = ComponentNodeProps<TProps>

  const displayName = getElementTypeName(component)

  const Renderer = (props: RendererProps) => {
    const result = component(props)

    if (result instanceof BaseNode || NodeUtil.isNodeInstance(result)) {
      return Node(result.element, result.rawProps).render()
    }

    return result as ReactNode
  }
  Renderer.displayName = `Renderer(${displayName})`
  ;(Renderer as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true

  function Func(props: Partial<ComponentNodeProps<TProps>> = {}, deps?: DependencyList) {
    return Node(Renderer, props as never, deps).render()
  }
  Func.displayName = `Component(${displayName})`
  ;(Func as { __meonodeAcceptsServerCss?: boolean }).__meonodeAcceptsServerCss = true
  // Signals that this target runs its own `Node()` over whatever props it is
  // given, so the caller must not flatten `props` into the top level — doing so
  // would send shielded values back through classification. See
  // `NodeUtil.shieldsOwnProps`.
  ;(Func as { __meonodeShieldsOwnProps?: boolean }).__meonodeShieldsOwnProps = true

  return Func
}
