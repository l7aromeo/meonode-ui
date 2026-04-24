import { Button, Div, Node, Span } from '@meonode/ui'
import MuiButton from '@mui/material/Button'

// Interop fixture: mix a third-party MUI component with MeoNode nodes
// on the same server-rendered page.
export default function Page() {
  return Div({
    'data-testid': 'interop-mui-meonode-page',
    children: [
      Span('interop:mui-meonode', { 'data-testid': 'interop-title' }),
      Node(MuiButton, {
        variant: 'contained',
        size: 'small',
        color: 'theme.primary',
        children: 'mui-contained',
      }),
      Button('meonode-button', {
        'data-testid': 'interop-meonode-button',
      }),
    ],
  }).render()
}
