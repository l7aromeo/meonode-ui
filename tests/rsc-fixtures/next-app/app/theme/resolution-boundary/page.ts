import { Div, Span } from '@meonode/ui'

export default function Page() {
  return Div({
    'data-testid': 'theme-boundary-page',
    children: Div({
      'data-testid': 'theme-boundary-inner',
      backgroundColor: 'theme.base',
      padding: 'theme.spacing.md',
      children: Span('theme-boundary-content', { color: 'theme.base.content' }),
    }),
  }).render()
}
