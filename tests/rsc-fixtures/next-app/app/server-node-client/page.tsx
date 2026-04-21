import { Div, Node } from '@meonode/ui'
import SomeClient from '../_components/some-client'

// Category B, case 5 — Node(ClientComp) inline from server page.
export default function Page() {
  return Div({
    'data-testid': 'node-client-page',
    children: Node(SomeClient, { label: 'node-inline' }),
  }).render()
}
