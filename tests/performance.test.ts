import { createSerializer } from '@emotion/jest'
import { matchers } from '@emotion/jest'
import { jest } from '@jest/globals'
import { cleanup, render, fireEvent, act } from '@testing-library/react'
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
  Div,
} from '@src/main.js'
import { BaseNode } from '@src/core.node.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Ensure use real timers
jest.useRealTimers()

const css = {
  // Basic styling
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  margin: '10px auto',
  width: '100%',
  maxWidth: '1200px',
  minHeight: '500px',
  backgroundColor: '#f5f5f5',
  color: '#333',
  fontSize: '16px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  lineHeight: 1.6,
  letterSpacing: '0.5px',

  // Border & shadows
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',

  // Transforms & animations
  transform: 'translateY(0) scale(1) rotate(0deg)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: 'fadeIn 0.5s ease-in-out',

  // Pseudo-classes
  '&:hover': {
    backgroundColor: '#ffffff',
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
    '& > .icon': {
      color: '#007bff',
      transform: 'rotate(180deg)',
    },
  },

  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },

  '&:focus': {
    outline: '2px solid #007bff',
    outlineOffset: '2px',
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // Pseudo-elements
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },

  '&::after': {
    content: '"→"',
    marginLeft: '8px',
    transition: 'transform 0.2s ease',
  },

  // Child selectors
  '& > h1': {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  '& > p': {
    fontSize: '16px',
    lineHeight: 1.8,
    color: '#666',
    marginBottom: '12px',
  },

  '& .card': {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  },

  '& button': {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: '#0056b3',
      transform: 'scale(1.05)',
    },

    '&:active': {
      transform: 'scale(0.95)',
    },
  },

  // Sibling selectors
  '& + &': {
    marginTop: '24px',
  },

  '& ~ &': {
    borderTop: '1px solid #eee',
  },

  // Attribute selectors
  '&[data-active="true"]': {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },

  '&[aria-expanded="true"]': {
    '& .chevron': {
      transform: 'rotate(180deg)',
    },
  },

  // Media queries
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    padding: '16px',
    maxWidth: '100%',

    '& > h1': {
      fontSize: '24px',
    },

    '& button': {
      width: '100%',
    },
  },

  '@media (min-width: 769px) and (max-width: 1024px)': {
    padding: '18px',
    maxWidth: '960px',
  },

  '@media (prefers-color-scheme: dark)': {
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    borderColor: 'rgba(255, 255, 255, 0.1)',

    '& > p': {
      color: '#ccc',
    },

    '& .card': {
      backgroundColor: '#2a2a2a',
    },
  },

  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',

    '& *': {
      animation: 'none !important',
      transition: 'none !important',
    },
  },

  // Container queries (Emotion supports this with plugins)
  '@container (min-width: 400px)': {
    '& .card': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
    },
  },

  // Keyframes (defined inline)
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },

  // Advanced positioning
  position: 'relative',
  zIndex: 10,
  isolation: 'isolate',

  // Clipping & masking
  clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
  maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',

  // Filters & backdrop
  filter: 'blur(0px) brightness(1) contrast(1)',
  backdropFilter: 'blur(10px) saturate(180%)',

  // Advanced text
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  textTransform: 'uppercase',
  wordSpacing: '2px',
  textDecoration: 'none',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',

  // CSS variables
  '--primary-color': '#007bff',
  '--secondary-color': '#6c757d',
  '--spacing-unit': '8px',
  '--border-radius': '8px',

  // Using CSS variables
  borderColor: 'var(--primary-color)',
  gap: 'var(--spacing-unit)',

  // Advanced selectors
  '&:not(:last-child)': {
    marginBottom: '16px',
  },

  '&:nth-child(odd)': {
    backgroundColor: '#f9f9f9',
  },

  '&:nth-child(even)': {
    backgroundColor: '#ffffff',
  },

  '&:first-of-type': {
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },

  '&:last-of-type': {
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },

  // Complex nesting
  '& .header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    '& .title': {
      fontSize: '20px',
      fontWeight: 600,

      '& span': {
        color: 'var(--primary-color)',
        fontWeight: 700,
      },
    },

    '& .actions': {
      display: 'flex',
      gap: '8px',

      '& button': {
        padding: '8px 16px',

        '&[data-variant="primary"]': {
          backgroundColor: 'var(--primary-color)',
        },

        '&[data-variant="secondary"]': {
          backgroundColor: 'var(--secondary-color)',
        },
      },
    },
  },

  // Advanced animations
  willChange: 'transform, opacity',
  animationName: 'fadeIn, pulse',
  animationDuration: '0.5s, 2s',
  animationTimingFunction: 'ease-in-out, ease-in-out',
  animationIterationCount: '1, infinite',
  animationDelay: '0s, 0.5s',

  // Print styles
  '@media print': {
    display: 'block',
    pageBreakInside: 'avoid',
    color: 'black',
    backgroundColor: 'white',
    boxShadow: 'none',
  },

  // Focus-visible (modern accessibility)
  '&:focus-visible': {
    outline: '3px solid #007bff',
    outlineOffset: '2px',
    borderRadius: '4px',
  },

  // Logical properties
  insetInlineStart: '0',
  marginBlockEnd: '16px',
  paddingInline: '20px',
  borderInlineStart: '4px solid var(--primary-color)',
}

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
  const performanceMetrics: { test: string; metric: string; value: string | number }[] = []

  afterEach(cleanup)
  afterAll(() => {
    console.log(`\n📊 Performance Metrics Report • ${new Date().toISOString()}\n=====================================================`)
    console.table(performanceMetrics)
  })

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

    const testName = 'Realistic Single-Page Layout'
    console.time('measure-renders')
    const { times, median } = await measureRender(element, { iterations: 5, warmups: 1 })
    console.timeEnd('measure-renders')

    performanceMetrics.push({ test: testName, metric: 'Render Times (ms)', value: times.map(t => t.toFixed(2)).join(', ') })
    performanceMetrics.push({ test: testName, metric: 'Median Render Time (ms)', value: median.toFixed(2) })

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
    const testName = '10,000 Same-Level Nodes'
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

    performanceMetrics.push({ test: testName, metric: `Median Render Time for ${NUM_NODES} Flat Nodes (ms)`, value: median.toFixed(2) })

    // Set a reasonable threshold, may need adjustment for different environments
    const MAX_ALLOWED_MS = 1500
    expect(median).toBeLessThan(MAX_ALLOWED_MS)
  })

  it('should render 10000 deeply nested nodes without stack overflow', async () => {
    const testName = '10,000 Deeply Nested Nodes'
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

    performanceMetrics.push({ test: testName, metric: `Median Render Time for ${NUM_NODES} Nested Nodes (ms)`, value: median.toFixed(2) })

    // Set a reasonable threshold, may need adjustment for different environments
    const MAX_ALLOWED_MS = 2000
    expect(median).toBeLessThan(MAX_ALLOWED_MS)
  })

  it('should handle heavy state changes and varying nodes without memory leaks', async () => {
    const testName = 'Heavy State Changes & Memory Leaks'
    const NUM_INITIAL_NODES = 1000
    const NUM_UPDATES = 50
    const NODES_PER_UPDATE = 100

    // Helper to create varied node structures
    const createComplexNode = (key: string, text: string, depth: number = 0): BaseNode => {
      const MAX_DEPTH = 2 // Limit nesting depth
      const shouldNest = depth < MAX_DEPTH && Math.random() > 0.5 // 50% chance to nest

      const childrenForContainer: BaseNode[] = []
      if (shouldNest) {
        const numChildren = Math.floor(Math.random() * 3) + 1 // 1 to 3 children
        for (let i = 0; i < numChildren; i++) {
          childrenForContainer.push(createComplexNode(`${key}-child-${i}`, `${text} Child ${i}`, depth + 1))
        }
      } else {
        // Add some basic text content
        childrenForContainer.push(P(text))
      }

      const nodeType = Math.random()
      if (nodeType < 0.3) {
        return Div({ key, children: childrenForContainer })
      } else if (nodeType < 0.6) {
        return Container({ key, children: childrenForContainer })
      } else if (nodeType < 0.8) {
        return Button(`Click ${text}`, { key, onClick: () => {} })
      } else {
        return Column({ key, children: childrenForContainer })
      }
    }

    // Force garbage collection before starting to get a clean baseline
    if (global.gc) {
      global.gc()
    }
    const initialMemory = process.memoryUsage().heapUsed

    const DynamicListComponent = () => {
      const [nodes, setNodes] = React.useState(() => {
        const initialNodes: { key: string; text: string }[] = []
        for (let i = 0; i < NUM_INITIAL_NODES; i++) {
          initialNodes.push({ key: `node-${i}`, text: `Initial Node ${i}` })
        }
        return initialNodes
      })
      const updateCounter = React.useRef(0)

      const handleUpdate = () => {
        const updateIndex = updateCounter.current
        setNodes(() => {
          // Using a new array to ensure re-render
          const newNodes: { key: string; text: string }[] = []
          const startIndex = Math.max(0, NUM_INITIAL_NODES - NODES_PER_UPDATE)

          for (let j = 0; j < startIndex; j++) {
            newNodes.push({ key: `node-${j}`, text: `Node ${j}` })
          }
          for (let j = 0; j < NODES_PER_UPDATE; j++) {
            const uniqueId = NUM_INITIAL_NODES + updateIndex * NODES_PER_UPDATE + j
            newNodes.push({ key: `dynamic-node-${uniqueId}`, text: `Dynamic Node ${uniqueId} - Update ${updateIndex}` })
          }
          return newNodes
        })
        updateCounter.current += 1
      }

      return Container({
        children: [
          Div({
            'data-testid': 'update-button',
            onClick: handleUpdate,
            children: 'Update State',
          }),
          Container({
            children: nodes.map(node => createComplexNode(node.key, node.text)),
          }),
        ],
      }).render()
    }

    const { getByTestId, unmount } = render(ThemeProvider({ theme, children: Node(DynamicListComponent).render() }).render())

    const updateButton = getByTestId('update-button')
    const renderTimes: number[] = []

    for (let i = 0; i < NUM_UPDATES; i++) {
      const t0 = performance.now()
      await act(async () => {
        fireEvent.click(updateButton)
      })
      const t1 = performance.now()
      renderTimes.push(t1 - t0)
    }

    const medianRenderTime = renderTimes.sort((a, b) => a - b)[Math.floor(renderTimes.length / 2)]
    performanceMetrics.push({ test: testName, metric: `Median Render Time for ${NUM_UPDATES} State Updates (ms)`, value: medianRenderTime.toFixed(2) })

    expect(medianRenderTime).toBeLessThan(500)

    unmount() // Unmount the component to allow its memory to be garbage collected

    // Force garbage collection again to clean up after the test
    if (global.gc) {
      global.gc()
    }
    const finalMemory = process.memoryUsage().heapUsed
    const memoryLeak = finalMemory - initialMemory

    performanceMetrics.push({ test: testName, metric: 'Initial Heap Size (MB)', value: (initialMemory / 1024 / 1024).toFixed(2) })
    performanceMetrics.push({ test: testName, metric: 'Final Heap Size (MB)', value: (finalMemory / 1024 / 1024).toFixed(2) })
    performanceMetrics.push({ test: testName, metric: `Memory Growth After ${NUM_UPDATES} Updates (MB)`, value: (memoryLeak / 1024 / 1024).toFixed(2) })

    // Allow for a small amount of memory growth, but not a large leak.
    // A threshold of 100MB seems reasonable for this number of operations.
    const MEMORY_THRESHOLD_MB = 100
    expect(memoryLeak).toBeLessThan(MEMORY_THRESHOLD_MB * 1024 * 1024)
  }, 100000)

  describe('Preprocessing and StableKey Performance', () => {
    const testName = 'StableKey Generation'
    const NUM_NODES = 5000

    it('should generate stableKeys efficiently for nodes with identical prop objects', () => {
      const commonProps = { color: 'theme.primary', padding: '10px' }
      const t0 = performance.now()
      for (let i = 0; i < NUM_NODES; i++) {
        Column(commonProps)
      }
      const t1 = performance.now()
      const duration = t1 - t0
      performanceMetrics.push({ test: testName, metric: `Instantiation with Identical Props (ms)`, value: duration.toFixed(2) })
      expect(duration).toBeLessThan(100) // Expect very fast instantiation
    })

    it('should generate stableKeys efficiently for nodes with shallowly equal props', () => {
      const t0 = performance.now()
      for (let i = 0; i < NUM_NODES; i++) {
        Column({ color: 'theme.primary', padding: '10px' })
      }
      const t1 = performance.now()
      const duration = t1 - t0
      performanceMetrics.push({ test: testName, metric: `Instantiation with Shallowly-Equal Props (ms)`, value: duration.toFixed(2) })
      expect(duration).toBeLessThan(250) // Expect slower than identical, but still fast
    })

    it('should generate stableKeys for nodes with unique props', () => {
      const t0 = performance.now()
      for (let i = 0; i < NUM_NODES; i++) {
        Column({ color: 'theme.primary', padding: `${i}px` })
      }
      const t1 = performance.now()
      const duration = t1 - t0
      performanceMetrics.push({ test: testName, metric: `Instantiation with Unique Props (ms)`, value: duration.toFixed(2) })
      expect(duration).toBeLessThan(500) // Expect this to be the slowest
    })

    it('should demonstrate "critical props" optimization for large prop objects', () => {
      const largeProps: Record<string, any> = {}
      for (let i = 0; i < 150; i++) {
        largeProps[`prop${i}`] = `value${i}`
      }

      // Case 1: Unique large props (full serialization)
      const t0 = performance.now()
      for (let i = 0; i < NUM_NODES / 10; i++) {
        Column({ ...largeProps, unique: i })
      }
      const t1 = performance.now()
      const durationFull = t1 - t0
      performanceMetrics.push({ test: testName, metric: `Instantiation with Large Unique Props (ms)`, value: durationFull.toFixed(2) })

      // Case 2: Large props with only critical props changing
      const t2 = performance.now()
      for (let i = 0; i < NUM_NODES / 10; i++) {
        Column({ ...largeProps, color: `red`, padding: `${i}px` })
      }
      const t3 = performance.now()
      const durationCritical = t3 - t2
      performanceMetrics.push({ test: testName, metric: `Instantiation with Large Props (Critical Changing) (ms)`, value: durationCritical.toFixed(2) })

      // The critical path should be faster, but the difference might not be huge
      // depending on the JSON.stringify overhead for the smaller object.
      // This test is more for observation.
      expect(durationCritical).toBeLessThan(durationFull * 1.5) // Allow some leeway
    })

    it('should generate stableKeys efficiently for nodes with complex css prop', () => {
      const t0 = performance.now()
      for (let i = 0; i < NUM_NODES; i++) {
        Column({ css, children: `Styled Node ${i}` })
      }
      const t1 = performance.now()
      const duration = t1 - t0
      performanceMetrics.push({ test: testName, metric: `Instantiation with Complex CSS Prop (ms)`, value: duration.toFixed(2) })
      // Expect this to be relatively fast, as the css object itself is stable (same reference)
      // but the internal processing of the css object for stableKey generation might be complex.
      expect(duration).toBeLessThan(300)
    })
  })
})
