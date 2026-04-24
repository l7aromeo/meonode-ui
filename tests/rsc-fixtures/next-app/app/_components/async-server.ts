'use server'
import { Div, Span } from '@meonode/ui'

/**
 * An async (server) component. Must be awaited at the call site;
 * wrapping in Node() would return a Promise element and break rendering.
 */
export async function AsyncServer({ label }: { label: string }) {
  // Simulate a server-side async op
  await new Promise(resolve => setTimeout(resolve, 5))

  return Div({
    'data-testid': 'async-server',
    children: Span(`async:${label}`, { 'data-testid': 'async-server-label' }),
  }).render()
}

/**
 * Nested async. Used to verify two-level async composition works.
 */
export async function AsyncOuter() {
  const inner = await AsyncServer({ label: 'inner' })
  return Div({
    'data-testid': 'async-outer',
    children: [Span('outer', { 'data-testid': 'async-outer-label' }), inner],
  }).render()
}
