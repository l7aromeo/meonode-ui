import { Div, Node } from '@meonode/ui'
import { NextLinkClient } from '../_components/link-factory-client'

// Category C, case 14 — createNode(Link) in a 'use client' module,
// consumed from a server page. The expected workaround path.
export default function Page() {
  return Div({
    'data-testid': 'next-link-client-module-page',
    children: Node(NextLinkClient, { href: '/', children: 'go-home-client-module' }),
  }).render()
}
