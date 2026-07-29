import type { NodeElementType, NodeInstance } from '@src/types/node.type.js'
import { createRoot } from 'react-dom/client'

/**
 * One cache scope per container element, created on first use and reused
 * afterwards. A `WeakMap` so a detached container does not keep its scope alive.
 *
 * The container is the right thing to key on: it is exactly as long-lived as the
 * React root mounted into it, which is the boundary `elementCache` needs in
 * order to tell two roots apart.
 */
const containerScopes = new WeakMap<Element, string>()
let scopeCounter = 0

function scopeFor(container: Element): string {
  let scope = containerScopes.get(container)
  if (scope === undefined) {
    scope = `r${++scopeCounter}`
    containerScopes.set(container, scope)
  }
  return scope
}

/**
 * Renders a Meonode instance into a DOM container.
 *
 * Each container gets its own `elementCache` namespace. Without one, two roots
 * holding structurally identical memoized subtrees compute the same cache keys —
 * keys are positional and bottom out at the root, so two roots look like the
 * same position — and the second mount renders the first one's content.
 * @param node The Meonode instance to render (e.g., created with Div(), P(), etc.).
 * @param container The DOM element to mount the content into.
 * @returns The React root instance.
 */
export function render<E extends NodeElementType>(node: NodeInstance<E>, container: Element) {
  const root = createRoot(container)
  root.render(node.render(false, scopeFor(container)))
  return root
}
