import { Div, Node } from '@meonode/ui'
import Link from 'next/link'

export default function Page() {
  return Div({
    'data-testid': 'next-link-inline-page',
    children: Node(Link, { href: '/', children: 'go-home-inline' }),
  }).render()
}
