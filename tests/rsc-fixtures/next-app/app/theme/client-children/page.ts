'use client'
import { ThemeProvider } from '@meonode/ui'
import { ThemeScopeBlock } from '../../_components/theme-scope-block'

export default function Page() {
  return ThemeProvider({
    theme: {
      mode: 'light',
      system: {
        primary: { default: 'rgb(0, 128, 0)' },
      },
    },
    children: ThemeScopeBlock({
      pageTestId: 'theme-client-children-page',
      innerTestId: 'theme-client-children-inner',
      text: 'themed-from-client-page',
    }),
  }).render()
}
