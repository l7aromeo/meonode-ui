'use client'
import { Div, Node } from '@meonode/ui'
import { PlainServer } from '../_components/plain-server'

// Diagnostic target: client component calls Node(ServerComponent).
export default function Page() {
  return Div({
    'data-testid': 'client-node-server-page',
    children: Node(PlainServer, { label: 'from-client' }),
  }).render()
}
