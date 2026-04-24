'use client'
import { useState } from 'react'
import { Div, Button, Span } from '@meonode/ui'

/**
 * A client-side interactive component with state.
 * Used to verify client boundary is preserved and hydration works.
 */
export default function SomeClient({ label = 'client' }: { label?: string }) {
  const [count, setCount] = useState(0)

  return Div({
    'data-testid': 'some-client',
    children: [
      Span(`${label}:${count}`, { 'data-testid': 'some-client-label' }),
      Button('inc', {
        'data-testid': 'some-client-btn',
        onClick: () => setCount(c => c + 1),
      }),
    ],
  }).render()
}
