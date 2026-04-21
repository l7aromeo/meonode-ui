import { Div } from '@meonode/ui'
import { AsyncServer } from '../_components/async-server'

// Category D, case 16 — await AsyncServerComp() inside children.
// Positive case: this is the correct way to use async server components.
export default async function Page() {
  return Div({
    'data-testid': 'async-await-page',
    children: await AsyncServer({ label: 'awaited' }),
  }).render()
}
