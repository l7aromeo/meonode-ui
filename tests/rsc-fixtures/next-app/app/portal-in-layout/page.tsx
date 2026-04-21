import { Div } from '@meonode/ui'

// Category B, case 10 — PortalProvider + PortalHost already live in layout.tsx
// (root layout). This page just asserts the layout composition does not
// produce errors and server content renders inside the provider.
export default function Page() {
  return Div({
    'data-testid': 'portal-layout-page',
    children: 'portal-host-present',
  }).render()
}
