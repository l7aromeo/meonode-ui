import { createSerializer } from '@emotion/jest'
import { matchers } from '@emotion/jest'
import { jest } from '@jest/globals'
import { cleanup, render } from '@testing-library/react'
import React from 'react'
import {
  Node,
  Container,
  Header,
  Nav,
  A,
  H1,
  H2,
  H3,
  P,
  Button,
  Img,
  Section,
  Article,
  Aside,
  Footer,
  Ul,
  Li,
  Strong,
  Small,
  Row,
  Column,
  ThemeProvider,
  type Theme,
} from '@src/main.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Ensure use real timers
jest.useRealTimers()

// Clean up DOM between tests to avoid open handles
afterEach(cleanup)

const theme: Theme = {
  mode: 'light',
  system: {
    base: {
      default: '#ffffff',
      muted: '#f7fafc',
      subtle: '#f0f7ff',
      content: '#000000',
    },
    primary: {
      default: '#007ACC',
      hover: '#005A9E',
      active: '#004578',
      content: '#ffffff',
    },
    secondary: {
      default: '#6C757D',
      hover: '#5A6268',
      active: '#4E555B',
      content: '#ffffff',
    },
  },
}

describe('Performance Testing', () => {
  async function measureRender(element: React.ReactNode, options?: { iterations?: number; warmups?: number }) {
    const iterations = options?.iterations ?? 4
    const warmups = options?.warmups ?? 1

    // Warm-up runs (JIT, initial library setup)
    for (let i = 0; i < warmups; i++) {
      const w = render(element)
      w.unmount()
    }

    const times: number[] = []
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now()
      const r = render(element)
      const t1 = performance.now()
      times.push(t1 - t0)
      r.unmount()
    }

    const sorted = [...times].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    return { times, median }
  }

  it('should render a realistic single-page layout quickly (median render time)', async () => {
    // Realistic single-page layout built with your node factories
    const Page: React.FC = () => {
      return Container({
        padding: '0',
        margin: '0',
        children: [
          Header({
            children: Container({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              backgroundColor: 'theme.base',
              color: 'theme.base.content',
              boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              children: [
                Container({
                  display: 'flex',
                  alignItems: 'center',
                  children: [
                    Img({
                      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="%23007ACC"/></svg>',
                      alt: 'logo',
                      width: 36,
                      height: 36,
                      marginRight: '12px',
                    }),
                    H2('MeoNode', { margin: 0, fontSize: '18px' }),
                  ],
                }),
                Nav({
                  children: Ul({
                    display: 'flex',
                    listStyle: 'none',
                    gap: '16px',
                    margin: 0,
                    padding: 0,
                    children: [
                      Li({ children: A({ href: '#', textDecoration: 'none', color: '#333', children: 'Home' }) }),
                      Li({ children: A({ href: '#features', textDecoration: 'none', color: '#333', children: 'Features' }) }),
                      Li({ children: A({ href: '#docs', textDecoration: 'none', color: '#333', children: 'Docs' }) }),
                      Li({
                        children: Button('Get Started', {
                          padding: '8px 12px',
                          backgroundColor: 'theme.primary',
                          color: 'theme.base',
                          borderRadius: '6px',
                          border: 'none',
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
          }),

          // Hero
          Section({
            id: 'hero',
            padding: '48px 24px',
            backgroundColor: 'theme.base.muted',
            children: Container({
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              gap: '24px',
              children: [
                Column({
                  flex: 1,
                  children: [
                    H1('Build UIs with Type-Safe Fluency', { fontSize: '36px', marginBottom: '12px' }),
                    P('Compose components with a direct CSS-first props API, built-in theming and ergonomic factories. No JSX needed.', {
                      fontSize: '16px',
                      color: '#555',
                      marginBottom: '20px',
                    }),
                    Row({
                      gap: '12px',
                      children: [
                        Button('Get Started', {
                          padding: '12px 18px',
                          backgroundColor: 'theme.primary',
                          color: 'theme.base',
                          borderRadius: '8px',
                          border: 'none',
                        }),
                        Button('View Docs', {
                          padding: '12px 18px',
                          backgroundColor: 'theme.base',
                          color: 'theme.primary',
                          borderRadius: '8px',
                          border: '1px solid theme.primary',
                        }),
                      ],
                    }),
                    Container({
                      marginTop: '20px',
                      display: 'flex',
                      gap: '12px',
                      children: [
                        Strong('Trusted by'),
                        Img({
                          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="24"><rect width="80" height="24" rx="4" fill="%23e6eefc"/></svg>',
                          alt: 'logos',
                          height: '24',
                        }),
                      ],
                    }),
                  ],
                }),
                // Illustration side
                Container({
                  width: '420px',
                  height: '260px',
                  backgroundColor: 'theme.base',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  children: Img({
                    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="200"><rect width="380" height="200" rx="8" fill="%23eef6ff"/></svg>',
                    alt: 'illustration',
                    width: '340',
                    height: '180',
                  }),
                }),
              ],
            }),
          }),

          // Features grid
          Section({
            id: 'features',
            padding: '40px 24px',
            children: Container({
              maxWidth: '1200px',
              margin: '0 auto',
              children: [
                H2('Highlights', { marginBottom: '12px' }),
                P('Everything you need to compose UI quickly and safely.', { color: '#666', marginBottom: '20px' }),
                Container({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  children: [
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
                      children: [H3('Type-safe props'), P('Strongly typed prop factories make components ergonomic and safe.', { color: '#444' })],
                    }),
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
                      children: [H3('Theming'), P('Resolve theme-aware values and maintain consistent design tokens.', { color: '#444' })],
                    }),
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
                      children: [H3('No JSX required'), P('Use expressive factories to eliminate template syntax.', { color: '#444' })],
                    }),
                  ],
                }),
              ],
            }),
          }),

          // Article + Sidebar
          Section({
            padding: '32px 24px',
            children: Container({
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              gap: '24px',
              children: [
                Article({
                  flex: 2,
                  children: [
                    H2('Deep dive: how MeoNode composes components', { marginBottom: '12px' }),
                    P(
                      'MeoNode’s BaseNode abstraction lazily resolves props, applies theme values and normalizes children into a consistent render pipeline. This enables flexible composition patterns and predictable styling.',
                      { color: '#444', marginBottom: '12px' },
                    ),
                    Img({
                      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200"><rect width="800" height="200" rx="8" fill="%23f0f7ff"/></svg>',
                      alt: 'article-figure',
                      width: '100%',
                      height: '200',
                      marginBottom: '12px',
                    }),
                    P('Example usage in real apps: dashboards, design systems, documentation sites.', { color: '#444' }),
                  ],
                }),
                Aside({
                  flex: 1,
                  children: Container({
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'theme.base',
                    boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
                    children: [
                      H3('Quick links'),
                      Ul({
                        listStyle: 'none',
                        padding: 0,
                        children: [
                          Li({ children: A({ href: '#getting-started', children: 'Getting started' }) }),
                          Li({ children: A({ href: '#api', children: 'API reference' }) }),
                          Li({ children: A({ href: '#examples', children: 'Examples' }) }),
                        ],
                      }),
                      Container({
                        marginTop: '12px',
                        children: [
                          Small('v1.0.0'),
                          Button('Open Sandbox', {
                            width: '100%',
                            padding: '10px',
                            marginTop: '8px',
                            backgroundColor: 'theme.primary',
                            color: 'theme.base',
                            border: 'none',
                            borderRadius: '6px',
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              ],
            }),
          }),

          // Testimonials / footer callout
          Section({
            padding: '28px 24px',
            backgroundColor: 'theme.base.muted',
            children: Container({
              maxWidth: '1200px',
              margin: '0 auto',
              children: [
                H2('What people are saying', { marginBottom: '12px' }),
                Container({
                  display: 'flex',
                  gap: '12px',
                  children: [
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      flex: 1,
                      children: [P('"MeoNode made our design system consistent and easy to maintain."', { fontStyle: 'italic' }), Strong('- Product Team')],
                    }),
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      flex: 1,
                      children: [P('"The prop factories remove so much boilerplate."', { fontStyle: 'italic' }), Strong('- Developer Advocate')],
                    }),
                    Container({
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'theme.base',
                      flex: 1,
                      children: [P('"I love the type-safety and theming."', { fontStyle: 'italic' }), Strong('- UX Engineer')],
                    }),
                  ],
                }),
              ],
            }),
          }),

          Footer({
            padding: '24px',
            backgroundColor: '#0b1724',
            color: 'theme.base',
            children: Container({
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              children: [
                Container({ children: [Strong('MeoNode'), P('Copyright © 2025', { color: 'theme.secondary' })] }),
                Nav({
                  children: Ul({
                    display: 'flex',
                    listStyle: 'none',
                    gap: '12px',
                    margin: 0,
                    padding: 0,
                    children: [
                      Li({ children: A({ href: '#', color: 'theme.secondary', children: 'Privacy' }) }),
                      Li({ children: A({ href: '#', color: 'theme.secondary', children: 'Terms' }) }),
                      Li({ children: A({ href: '#', color: 'theme.secondary', children: 'Contact' }) }),
                    ],
                  }),
                }),
              ],
            }),
          }),
        ],
      }).render()
    }

    const element = ThemeProvider({ theme, children: Node(Page).render() }).render()

    console.time('measure-renders')
    const { times, median } = await measureRender(element, { iterations: 5, warmups: 1 })
    console.timeEnd('measure-renders')

    // Logs for debugging / CI

    console.log('Render times (ms):', times.map(t => t.toFixed(2)).join(', '))

    console.log('Median render time (ms):', median.toFixed(2))

    // Verify visible content in final mount
    const finalRender = render(element)
    expect(finalRender.getByText('Build UIs with Type-Safe Fluency')).toBeInTheDocument()
    expect(finalRender.getByText('Highlights')).toBeInTheDocument()
    expect(finalRender.getByText('What people are saying')).toBeInTheDocument()
    finalRender.unmount()

    // Assert median render time is under threshold
    // (Set threshold based on performance goals and test environment)
    const MAX_ALLOWED_MS = 200
    expect(median).toBeLessThan(MAX_ALLOWED_MS)
  })

  it('should render 10,000 same-level nodes quickly', async () => {
    const NUM_NODES = 10000
    const children = []
    for (let i = 0; i < NUM_NODES; i++) {
      children.push(Column({ color: 'theme.primary', children: `Node ${i}` }))
    }

    const App = Column({ children })
    const element = ThemeProvider({ theme, children: App.render() }).render()

    console.time('measure-10k-flat')
    const { median } = await measureRender(element, { iterations: 3, warmups: 1 })
    console.timeEnd('measure-10k-flat')

    console.log(`Median render time for ${NUM_NODES} flat nodes (ms):`, median.toFixed(2))

    // Set a reasonable threshold, may need adjustment for different environments
    const MAX_ALLOWED_MS = 1500
    expect(median).toBeLessThan(MAX_ALLOWED_MS)
  })

  it('should render 10000 deeply nested nodes without stack overflow', async () => {
    const NUM_NODES = 10000
    let nestedNode = Column({ color: 'theme.primary', children: `Deepest Node` })

    for (let i = 0; i < NUM_NODES - 1; i++) {
      nestedNode = Column({ children: nestedNode })
    }

    const App = nestedNode
    const element = ThemeProvider({ theme, children: App.render() }).render()

    console.time('measure-10k-nested')
    const { median } = await measureRender(element, { iterations: 3, warmups: 1 })
    console.timeEnd('measure-10k-nested')

    console.log(`Median render time for ${NUM_NODES} nested nodes (ms):`, median.toFixed(2))

    // Set a reasonable threshold, may need adjustment for different environments
    const MAX_ALLOWED_MS = 2000
    expect(median).toBeLessThan(MAX_ALLOWED_MS)
  })
})
