import { Div } from '@meonode/ui'
import Link from 'next/link'

// Diagnostic case: direct function call Link({...}) from a server page.
export default function Page() {
  const directLinkElement = Link({ href: '/', children: 'direct-link-call' })

  return Div({
    'data-testid': 'next-link-direct-call-page',
    children: directLinkElement,
  }).render()
}
