import { createRoot } from 'react-dom/client'
import type { NodeInstance } from '@src/node.type.js'
export { Node, createNode, createChildrenFirstNode } from '@src/core.node.js'
export * from '@src/hoc/index.js'
export * from '@src/helper/node.helper.js'
export * from '@src/node.type.js'
export * from '@src/components/html.node.js'

/**
 * Renders a Meonode instance into a DOM container.
 * @param node The Meonode instance to render (e.g., created with Div(), P(), etc.).
 * @param container The DOM element to mount the content into.
 * @returns The React root instance.
 */
export function render(node: NodeInstance<any>, container: Element) {
  const root = createRoot(container)
  root.render(node.render())
  return root
}
