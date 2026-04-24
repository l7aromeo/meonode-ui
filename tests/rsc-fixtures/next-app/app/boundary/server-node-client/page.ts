'use server'
import { Div, Node } from '@meonode/ui'
import SomeClient from '../../_components/some-client'

export default async function Page() {
  return Div({
    'data-testid': 'node-client-page',
    children: Node(SomeClient, { label: 'node-inline' }),
  }).render()
}
