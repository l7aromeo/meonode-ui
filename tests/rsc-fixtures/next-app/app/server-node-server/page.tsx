import { Div, Node } from '@meonode/ui'
import { PlainServer } from '../_components/plain-server'

// Diagnostic: server page calling Node(ServerComponent).
export default function Page() {
  return Div({
    'data-testid': 'server-node-server-page',
    children: Node(PlainServer, { label: 'from-server' }),
  }).render()
}
