import { Div } from '@meonode/ui'
import SomeClient from '../../_components/some-client'

export default function Page() {
  const directElement = SomeClient({ label: 'direct-call' })

  return Div({
    'data-testid': 'direct-client-page',
    children: directElement,
  }).render()
}
