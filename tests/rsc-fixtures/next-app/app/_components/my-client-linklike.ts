'use client'
import { Div } from '@meonode/ui'

/**
 * Plain client component used to mimic Link-like boundary behavior.
 */
export default function MyClientLinkLike({ children }: { children?: string }) {
  return Div({
    'data-testid': 'my-client-linklike',
    children: children ?? 'my-client-linklike',
  }).render()
}
