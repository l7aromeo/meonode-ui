import { Div, Node } from '@meonode/ui'
import { AsyncServer } from '../_components/async-server'

// Diagnostic target: client component calls Node(AsyncServerComponent).
export default function Page() {
  return Div({
    'data-testid': 'client-node-async-server-page',
    children: Node(AsyncServer, { label: 'from-client' }),
  }).render()
}
