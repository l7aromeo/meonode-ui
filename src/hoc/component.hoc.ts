'use strict'
import { BaseNode, Node } from '@src/core.node'
import type { ComponentNode, NodeElement, Theme } from '@src/node.type'
import type { ReactNode } from 'react'

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
export function Component<P>(
  component: (
    props: P & {
      props?: Partial<Omit<P, 'children'>>
      children?: NodeElement
    },
  ) => ComponentNode,
) {
  // Create a wrapper component that handles theme and rendering
  const Renderer = (props: P & { props?: Partial<Omit<P, 'children'>>; children?: NodeElement; nodetheme?: Theme; theme?: Theme }) => {
    const result = component(props) // Execute wrapped component

    // Handle BaseNode results - requires special processing
    if (result instanceof BaseNode) {
      return Node(result.element, {
        ...result.rawProps,
        nodetheme: result.rawProps?.nodetheme || result.rawProps?.theme || props.nodetheme || props.theme,
      }).render()
    }

    return result as ReactNode
  }

  return function Func(props: P = {} as P) {
    return Node(Renderer, props as never).render()
  }
}
