import { Div, Node } from '@meonode/ui'
import { AsyncServer } from '../_components/async-server'

// Category D, case 17 — Node(AsyncServerComp) from server.
// Anti-pattern: Node() wraps the component into a BaseNode; when rendered
// React tries to render the Promise-returning function directly, which
// Next surfaces as an error boundary or hydration mismatch.
// We capture current behavior so we can see whether it errors today.
export default async function Page() {
  return Div({
    'data-testid': 'async-node-wrap-page',
    children: Node(AsyncServer as any, { label: 'node-wrapped' }),
  }).render()
}
