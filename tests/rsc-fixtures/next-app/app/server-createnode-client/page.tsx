import { Div, Node } from '@meonode/ui'
import { SomeClientFactoryClient } from './factory'

// Category B, case 7 — createNode(ClientComp) where the factory module
// itself is marked 'use client'. This is the workaround pattern.
export default function Page() {
  return Div({
    'data-testid': 'createnode-client-page',
    children: Node(SomeClientFactoryClient, { label: 'createnode-client' }),
  }).render()
}
