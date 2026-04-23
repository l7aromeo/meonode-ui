import { Div, Node, Span } from '@meonode/ui'
import Link from 'next/link'

// Category E, case 20 — server-rendered Div uses theme.* paths. Root layout
// provides the ThemeProvider (client component); this page is server and
// the theme values must resolve in emitted CSS when the node reaches the
// client styled-renderer.
export default function Page() {
  return Div({
    'data-testid': 'theme-boundary-page',
    children: Div({
      'data-testid': 'theme-boundary-inner',
      backgroundColor: 'theme.base',
      padding: 'theme.spacing.md',
      children: [
        Span('theme-boundary-content', { color: 'theme.base.content' }),
        Node(Link, {
          href: '/',
          backgroundColor: 'theme.primary',
          css: {
            '& span': {
              color: 'theme.primary.content',
            },
          },
          children: Span('go-home'),
        }),
      ],
    }),
  }).render()
}
