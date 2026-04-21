import { Div } from '@meonode/ui'
import SomeClient from '../_components/some-client'

// Category B, case 8 — direct client component call from server (not wrapped).
// SomeClient is a React function component. Calling it directly invokes the
// function; the returned element tree will be evaluated at render time.
// This documents what happens under that anti-pattern.
export default function Page() {
  // Calling SomeClient({}) directly produces a React element via .render()
  // inside the client module. Server passes that element into its own tree.
  const directElement = SomeClient({ label: 'direct-call' })

  return Div({
    'data-testid': 'direct-client-page',
    children: directElement,
  }).render()
}
