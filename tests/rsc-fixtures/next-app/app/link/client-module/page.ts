import { Div } from '@meonode/ui'
import { NextLinkClient } from '../../_components/link-factory-client'

export default function Page() {
  return Div({
    'data-testid': 'next-link-client-module-page',
    children: NextLinkClient({ href: '/', children: 'go-home-client-module' }),
  }).render()
}
