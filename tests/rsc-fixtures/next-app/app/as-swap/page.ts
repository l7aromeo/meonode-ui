import { Div } from '@meonode/ui'

// `as` polymorphism from the server: a styled Div that renders as an <a>.
// Verifies the render-target swap reuses the same Emotion server path (critical
// CSS still emitted), narrows to the anchor element, and never leaks `as` to the DOM.
export default function Page() {
  return Div({
    as: 'a',
    href: '/home',
    'data-testid': 'as-swap',
    css: { color: 'rgb(255, 0, 0)', padding: '8px' },
    children: 'as-swap from server',
  }).render()
}
