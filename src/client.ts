import type { NodeInstance } from '@src/node.type.js'
import { createRoot } from 'react-dom/client'

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
