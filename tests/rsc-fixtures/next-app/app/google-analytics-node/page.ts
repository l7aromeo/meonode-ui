import { Div, Node } from '@meonode/ui'
import { GoogleAnalytics } from '@next/third-parties/google'

// Category I — Node(client third-party reference) from a server page.
export default function Page() {
  return Div({
    'data-testid': 'ga-node-page',
    children: [
      Div({
        'data-testid': 'ga-node-label',
        children: 'ga-node-mounted',
      }),
      Node<{ nonce: string; gaId: string; debugMode: boolean }, typeof GoogleAnalytics>(GoogleAnalytics, {
        nonce: 'fixture-nonce',
        gaId: 'G-TEST1234',
        debugMode: false,
      }),
    ],
  }).render()
}
