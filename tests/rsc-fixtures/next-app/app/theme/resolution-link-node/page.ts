import { Div, Node, Span } from '@meonode/ui'
import Link from 'next/link'

export default function Page() {
  return Div({
    'data-testid': 'theme-link-boundary-page',
    children: Node(Link, {
      href: '/',
      backgroundColor: 'theme.primary',
      css: {
        '& span': {
          color: 'theme.primary.content',
        },
      },
      children: Span('go-home-theme-link'),
    }),
  }).render()
}
