import { Div, Span } from '@meonode/ui'

// Category B, case 11 — StyleRegistry at root (layout.tsx). This page uses
// multiple styled nodes and asserts critical CSS ends up in the initial HTML.
export default function Page() {
  return Div({
    'data-testid': 'style-registry-page',
    css: { backgroundColor: 'rgb(0, 0, 255)' },
    children: [Span('styled-a', { css: { color: 'rgb(255, 255, 0)' } }), Span('styled-b', { css: { fontWeight: 'bold' } })],
  }).render()
}
