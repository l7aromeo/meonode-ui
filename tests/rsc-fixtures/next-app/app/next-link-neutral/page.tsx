import { Div } from '@meonode/ui'
import { NextLink } from '../_components/link-factory-neutral'

// Category C, case 12 — THE BUG REPRO.
// createNode(Link) in a neutral (no-directive) module, used from a server
// page. The user reports this errors at client-boundary resolution.
export default function Page() {
  return Div({
    'data-testid': 'next-link-neutral-page',
    children: NextLink({ href: '/', children: 'go-home' }),
  }).render()
}
