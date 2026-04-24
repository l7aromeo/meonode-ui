'use client'
import { Div } from '@meonode/ui'

export default function Page() {
  return Div({
    'data-testid': 'client-page-css-direct-page',
    padding: 8,
    children: Div({
      'data-testid': 'client-page-css-direct-inner',
      backgroundColor: 'theme.primary',
      color: 'white',
      padding: 4,
      children: 'client-direct-css',
    }),
  }).render()
}
