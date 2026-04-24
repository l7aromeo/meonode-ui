'use server'
import { Div } from '@meonode/ui'
import { SomeClientFactoryClient } from '../../server-createnode-client/factory'

export default async function Page() {
  return Div({
    'data-testid': 'createnode-client-page',
    children: SomeClientFactoryClient({ label: 'createnode-client' }),
  }).render()
}
