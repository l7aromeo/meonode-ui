import { Div } from '@meonode/ui'

// Category A, case 1 — baseline server render of a Div with text.
export default function Page() {
  return Div({
    'data-testid': 'baseline',
    children: 'hi from server',
  }).render()
}
