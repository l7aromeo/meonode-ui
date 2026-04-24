'use server'
import { Div, Node } from '@meonode/ui'
import MyClientLinkLike from '../../_components/my-client-linklike'

export default async function Page() {
  return Div({
    'data-testid': 'client-function-prop-page',
    children: Node(MyClientLinkLike, {
      children: 'function-prop-repro',
    }),
  }).render()
}
