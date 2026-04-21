import { Div } from '@meonode/ui'

// Category A, case 3 — styled Div from server. StyleRegistry in layout
// should extract Emotion critical CSS and inline a <style> tag.
export default function Page() {
  return Div({
    'data-testid': 'server-css',
    css: { color: 'rgb(255, 0, 0)', padding: '12px' },
    children: 'styled from server',
  }).render()
}
