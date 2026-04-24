import { Component, Div, Node, Span } from '@meonode/ui'

// Category A, case 4 — Component HOC invoked from a server page.
const Label = Component<{ text: string }>(({ text }) =>
  Div({
    'data-testid': 'hoc-label',
    children: Span(text),
  }),
)

export default function Page() {
  return Div({
    'data-testid': 'hoc-page',
    children: Node(Label, { text: 'hoc-rendered' }),
  }).render()
}
