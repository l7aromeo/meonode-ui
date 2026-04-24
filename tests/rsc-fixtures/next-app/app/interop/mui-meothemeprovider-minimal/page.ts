'use client'

import { Column, Div, Node, ThemeProvider as MeoThemeProvider, type Theme, Children } from '@meonode/ui'
import { Button, Card, CardContent, Chip, Grid } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

const lightTheme: Theme = {
  mode: 'light',
  system: {
    primary: { default: 'rgb(255, 107, 107)', content: '#fff' },
    base: { default: '#f8f8f8', content: '#222' },
    neutral: { default: '#eee', content: '#666' },
    secondary: { default: '#fff', content: '#444' },
  },
}

const darkTheme: Theme = {
  mode: 'dark',
  system: {
    primary: { default: 'rgb(255, 107, 107)', content: '#fff' },
    base: { default: '#121212', content: '#eee' },
    neutral: { default: '#222', content: '#aaa' },
    secondary: { default: '#1d1d1d', content: '#ddd' },
  },
}

const features = ['Daily check-in', 'Redeem codes', 'Profile cards', 'Build showcase']

function ThemeLikeWrapper({ children, theme }: { children: Children; theme: Theme }) {
  const [loadedTheme, setLoadedTheme] = useState<Theme>(theme)

  useEffect(() => {
    if (!theme) {
      const stored = localStorage.getItem('theme')
      if (!stored) {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        setLoadedTheme(isDark ? darkTheme : lightTheme)
      } else {
        setLoadedTheme(stored === 'dark' ? darkTheme : lightTheme)
      }
    }
  }, [theme])

  return MeoThemeProvider({ theme: loadedTheme, children }).render()
}

export default function Page() {
  const theme = useMemo<Theme>(() => lightTheme, [])

  return Node(ThemeLikeWrapper, {
    theme,
    children: Column({
      'data-testid': 'interop-mui-meothemeprovider-page',
      padding: 20,
      gap: 16,
      children: [
        Node(Chip, {
          label: 'MEO THEME + MUI',
          sx: { backgroundColor: 'theme.primary', color: 'theme.primary.content', fontWeight: 700 },
        }),
        Node(Grid, {
          props: {
            container: true,
          },
          spacing: 2,
          children: features.map(title =>
            Node(Grid, {
              size: { xs: 12, md: 6 },
              children: Node(Card, {
                backgroundColor: 'theme.secondary',
                border: '1px solid theme.neutral',
                borderRadius: 8,
                children: Node(CardContent, {
                  sx: { display: 'flex', flexDirection: 'column', gap: 1 },
                  children: [
                    Div({ children: title }),
                    Node(Button, {
                      variant: 'contained',
                      size: 'small',
                      textTransform: 'none',
                      children: 'Open',
                    }),
                  ],
                }),
              }),
            }),
          ),
        }),
        Node(Button, {
          variant: 'outlined',
          size: 'large',
          textTransform: 'none',
          children: 'Explore Features',
        }),
      ],
    }),
  }).render()
}
