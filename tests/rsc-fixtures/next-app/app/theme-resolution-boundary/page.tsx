import { Div } from '@meonode/ui'

// Category E, case 20 — server-rendered Div uses theme.* paths. Root layout
// provides the ThemeProvider (client component); this page is server and
// the theme values must resolve in emitted CSS when the node reaches the
// client styled-renderer.
export default function Page() {
  return Div({
    'data-testid': 'theme-boundary-page',
    children: Div({
      'data-testid': 'theme-boundary-inner',
      backgroundColor: 'theme.primary',
      padding: 'theme.spacing.md',
      children: 'theme-boundary-content',
    }),
  }).render()
}
