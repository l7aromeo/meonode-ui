'use client'

import { Column, Div, Node } from '@meonode/ui'
import { Button, Card, CardContent, Chip, Grid } from '@mui/material'

const features = ['Daily check-in', 'Redeem codes', 'Profile cards', 'Build showcase']

export default function Page() {
  return Column({
    'data-testid': 'interop-mui-without-meothemeprovider-page',
    padding: 20,
    gap: 16,
    children: [
      Node(Chip, {
        label: 'MUI WITHOUT MEO THEME WRAPPER',
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
              sx: {
                backgroundColor: 'theme.secondary',
                border: '1px solid theme.neutral',
                borderRadius: 8,
              },
              children: Node(CardContent, {
                sx: { display: 'flex', flexDirection: 'column', gap: 1 },
                children: [
                  Div({ children: title }),
                  Node(Button, {
                    variant: 'contained',
                    size: 'small',
                    sx: { textTransform: 'none' },
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
  }).render()
}
