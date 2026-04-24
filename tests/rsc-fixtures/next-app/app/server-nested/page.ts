import { Div, Span } from '@meonode/ui'

// Category A, case 2 — nested server components via function composition.
function Header() {
  return Div({
    'data-testid': 'nested-header',
    children: Span('header-text'),
  })
}

function Section() {
  return Div({
    'data-testid': 'nested-section',
    children: [Header(), Span('section-text')],
  })
}

export default function Page() {
  return Section().render()
}
