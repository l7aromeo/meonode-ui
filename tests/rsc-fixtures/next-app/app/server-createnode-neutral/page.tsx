import { Div, createNode } from '@meonode/ui'
import SomeClient from '../_components/some-client'

// Category B, case 6 — createNode(ClientComp) in a neutral (no-directive) module.
// This file has no directive either; both files are "neutral" and rely on
// Next's module graph to treat SomeClient as a client reference.
const SomeClientFactory = createNode(SomeClient)

export default function Page() {
  return Div({
    'data-testid': 'createnode-neutral-page',
    children: SomeClientFactory({ label: 'createnode-neutral' }),
  }).render()
}
