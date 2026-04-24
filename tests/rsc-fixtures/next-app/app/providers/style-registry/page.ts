import { Div, Span } from '@meonode/ui'

export default function Page() {
  return Div({
    'data-testid': 'style-registry-page',
    css: { backgroundColor: 'rgb(0, 0, 255)' },
    children: [Span('styled-a', { css: { color: 'rgb(255, 255, 0)' } }), Span('styled-b', { css: { fontWeight: 'bold' } })],
  }).render()
}
