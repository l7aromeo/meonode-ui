import { Div, Span } from '@meonode/ui'

/**
 * Plain sync server component (no "use client").
 */
export function PlainServer({ label }: { label: string }) {
  return Div({
    'data-testid': 'plain-server',
    children: Span(`plain-server:${label}`, { 'data-testid': 'plain-server-label' }),
  }).render()
}
