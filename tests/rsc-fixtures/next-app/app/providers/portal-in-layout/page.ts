import { Div } from '@meonode/ui'

export default function Page() {
  return Div({
    'data-testid': 'portal-layout-page',
    children: 'portal-host-present',
  }).render()
}
