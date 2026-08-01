'use client'
// Interop fixture: MUI's own `createTheme` + `ThemeProvider` nested with
// MeoNode's ThemeProvider on one page.
//
// The scenario this guards: MUI's `createTheme()` returns an object with
// read-only/derived properties, so anything that tried to mutate it — or to
// forward it into the DOM — would break. Both providers must coexist, MUI
// components must pick up the MUI palette, and MeoNode nodes must still
// resolve `theme.*` tokens from the MeoNode theme.
//
// Also a leak guard: neither theme object may reach the DOM as an attribute.
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiButton from '@mui/material/Button'
import { Column, Div, Node, Span, ThemeProvider as MeoThemeProvider, type Theme } from '@meonode/ui'

const muiTheme = createTheme({
  palette: {
    primary: { main: '#1c7ed6' },
  },
})

const meoTheme: Theme = {
  mode: 'light',
  system: {
    colors: { brand: 'rgb(255, 107, 107)' },
    spacing: { md: '16px' },
  },
}

export default function Page() {
  return Node(MuiThemeProvider, {
    theme: muiTheme,
    children: MeoThemeProvider({
      theme: meoTheme,
      children: Column({
        'data-testid': 'interop-mui-theme-nested-page',
        children: [
          Span('interop:mui-theme-provider-nested', { 'data-testid': 'interop-nested-title' }),
          // MUI component: must take its colour from the MUI palette.
          // `data-testid` goes through `props`: MUI's Button prop types reject
          // unknown keys, and MeoNode maps those to `never` rather than
          // silently forwarding them.
          Node(MuiButton, {
            variant: 'contained',
            props: { 'data-testid': 'interop-nested-mui-button' },
            children: 'mui-themed',
          }),
          // MeoNode node: must resolve `theme.*` against the MeoNode theme.
          Div({
            'data-testid': 'interop-nested-meo-box',
            backgroundColor: 'theme.colors.brand',
            padding: 'theme.spacing.md',
            children: 'meo-themed',
          }),
        ],
      }),
    }),
  }).render()
}
