'use server'
import { Div } from '@meonode/ui'
import { AsyncOuter } from '../_components/async-server'

// Category D, case 18 — two-level async composition via await.
export default async function Page() {
  return Div({
    'data-testid': 'async-nested-page',
    children: await AsyncOuter(),
  }).render()
}
