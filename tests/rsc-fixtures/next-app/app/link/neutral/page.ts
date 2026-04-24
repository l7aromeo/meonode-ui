import { Div } from '@meonode/ui'
import { NextLink } from '../../_components/link-factory-neutral'

export default function Page() {
  return Div({
    'data-testid': 'next-link-neutral-page',
    children: NextLink({ href: '/', children: 'go-home' }),
  }).render()
}
