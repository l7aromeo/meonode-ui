import { Div, createNode } from '@meonode/ui'
import SomeClient from '../../_components/some-client'

const SomeClientFactory = createNode(SomeClient)

export default function Page() {
  return Div({
    'data-testid': 'createnode-neutral-page',
    children: SomeClientFactory({ label: 'createnode-neutral' }),
  }).render()
}
