import { Div, Node } from '@meonode/ui'
import ClientNavbar from '../../_components/client-navbar'

export default function Page() {
  return Div({
    'data-testid': 'next-link-wrapped-client-page',
    children: Node(ClientNavbar),
  }).render()
}
