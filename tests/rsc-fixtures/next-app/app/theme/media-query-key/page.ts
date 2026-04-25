'use client'
import { Div } from '@meonode/ui'

// Reproduces the docs hydration mismatch: a `css` prop whose **key** is a
// media query embedding a theme token. Server must resolve the key to a
// concrete value (e.g. `1024px`) — CSS variables are invalid inside media
// features — so server and client emit the same Emotion class hash.
export default function Page() {
  return Div({
    'data-testid': 'theme-media-query-key',
    padding: 'theme.spacing.md',
    backgroundColor: 'theme.primary',
    css: {
      '@media (max-width: theme.breakpoint.md)': {
        padding: 'theme.spacing.lg',
      },
    },
    children: 'media-query-key fixture',
  }).render()
}
