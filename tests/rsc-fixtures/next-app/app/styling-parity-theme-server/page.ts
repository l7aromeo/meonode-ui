import { Div } from '@meonode/ui'
import { NextImage } from '../_components/image-factory-neutral'

const SRC =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22500%22 viewBox=%220 0 500 500%22%3E%3Crect width=%22500%22 height=%22500%22 fill=%22%2300a86b%22/%3E%3C/svg%3E'

export default function Page() {
  return Div({
    'data-testid': 'styling-parity-theme-server-page',
    children: NextImage<{ 'data-testid': string }>({
      src: SRC,
      alt: 'styling-parity-theme-server',
      width: 40,
      height: 40,
      backgroundColor: 'theme.primary',
      'data-testid': 'styling-parity-theme-shared',
    }),
  }).render()
}
