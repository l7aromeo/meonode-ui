'use client'

import { Column, H2, Node, P, Row, Section } from '@meonode/ui'
import { Button, Card, CardContent, Chip, Grid } from '@mui/material'
import { useState } from 'react'

const features = [
  { title: 'Daily check-in', description: 'Automated rewards collection', color: '#4caf50' },
  { title: 'Redeem codes', description: 'Batch code redemption', color: '#ff9800' },
  { title: 'Profile cards', description: 'Visual account snapshots', color: '#2196f3' },
]

export default function Page() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return Section({
    'data-testid': 'interop-mui-chutao-minimal-page',
    padding: 24,
    display: 'flex',
    justifyContent: 'center',
    children: Column({
      gap: 24,
      width: '100%',
      maxWidth: 1000,
      children: [
        Row({
          justifyContent: 'space-between',
          alignItems: 'center',
          children: [
            H2('ChuTao-style Interop Minimal', { margin: 0 }),
            Node(Chip, {
              label: 'PREVIEW',
              sx: {
                backgroundColor: 'rgb(255, 107, 107)',
                color: '#fff',
                fontWeight: 700,
              },
            }),
          ],
        }),
        P('MUI components rendered through MeoNode wrappers with mapped sx objects.', {
          margin: 0,
          color: '#666',
        }),
        Node(Grid, {
          props: {
            container: true,
          },
          spacing: 2,
          children: features.map((feature, index) =>
            Node(Grid, {
              key: feature.title,
              size: { xs: 12, md: 4 },
              children: Node(Card, {
                onMouseEnter: () => setHoveredFeature(index),
                onMouseLeave: () => setHoveredFeature(null),
                sx: {
                  borderRadius: 3,
                  border: `1px solid ${hoveredFeature === index ? feature.color : '#ddd'}`,
                  transition: 'all 0.2s ease',
                  backgroundColor: hoveredFeature === index ? '#fff7f7' : '#fff',
                },
                children: Node(CardContent, {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  children: [
                    Node(Chip, {
                      label: feature.title,
                      sx: {
                        alignSelf: 'flex-start',
                        backgroundColor: feature.color,
                        color: '#fff',
                      },
                    }),
                    P(feature.description, { margin: 0 }),
                    Node(Button, {
                      variant: hoveredFeature === index ? 'contained' : 'outlined',
                      size: 'small',
                      children: 'Open',
                    }),
                  ],
                }),
              }),
            }),
          ),
        }),
        Row({
          gap: 12,
          children: [
            Node(Button, { variant: 'contained', size: 'large', children: 'Get Started' }),
            Node(Button, { variant: 'outlined', size: 'large', children: 'Explore Features' }),
          ],
        }),
      ],
    }),
  }).render()
}
