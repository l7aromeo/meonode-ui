import { Div, Node } from '@meonode/ui'
import ClientNavbar from '../_components/client-navbar'

// Category C, case 15 — the user's reported workaround:
// wrap the Link consumer in 'use client' (ClientNavbar) and reference
// it from server via Node(ClientNavbar).
export default function Page() {
  return Div({
    'data-testid': 'next-link-wrapped-client-page',
    children: Node(ClientNavbar),
  }).render()
}
