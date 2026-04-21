import { Div, ThemeProvider } from '@meonode/ui'

// Category B/E, case 9 + 19 — ThemeProvider wrapping server children.
// The root layout also has a ThemeProvider; this page nests a second scope
// to validate the provider accepts server-composed children through RSC payload.
export default function Page() {
  return ThemeProvider({
    theme: {
      mode: 'light',
      system: {
        primary: { default: 'rgb(0, 128, 0)' },
      },
    },
    children: Div({
      'data-testid': 'theme-children-page',
      children: Div({
        'data-testid': 'theme-children-inner',
        backgroundColor: 'theme.primary',
        children: 'themed-from-server',
      }),
    }),
  }).render()
}
