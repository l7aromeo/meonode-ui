import { StyleRegistry } from '@meonode/ui/nextjs-registry'
import { ThemeProvider, PortalProvider, PortalHost } from '@meonode/ui'
import type { ReactNode } from 'react'

const theme = {
  mode: 'light' as const,
  system: {
    primary: { default: 'rgb(255, 107, 107)', content: '#FFFFFF' },
    base: { default: '#F8F8F8', content: '#333333' },
    spacing: { sm: 8, md: 16, lg: 24 },
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {StyleRegistry({
          children: ThemeProvider({
            theme,
            children: PortalProvider({
              children: [children, PortalHost()],
            }),
          }),
        }).render()}
      </body>
    </html>
  )
}

export const metadata = {
  title: 'MeoNode RSC Fixture',
}
