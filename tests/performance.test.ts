import { createSerializer, matchers } from '@emotion/jest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'
import {
  A,
  Article,
  Aside,
  Button,
  Column,
  Container,
  Div,
  Footer,
  H1,
  H2,
  H3,
  Header,
  Img,
  Input,
  Li,
  Nav,
  Node,
  P,
  Row,
  Section,
  Small,
  Strong,
  type Theme,
  ThemeProvider,
  Ul,
} from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import { COMPILED_MARKER, COMPILER_SCHEMA_KEYS } from '@src/constant/common.const.js'
import Table from 'cli-table3'
import css from '@tests/constant/css.test.const.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

vi.useRealTimers()

/**
 * Formats a number of bytes into a human-readable string.
 * @param bytes The number of bytes to format.
 * @returns A string representing the formatted memory size.
 */
export function formatMemory(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const isNegative = bytes < 0
  const absBytes = Math.abs(bytes)
  const i = Math.floor(Math.log(absBytes) / Math.log(k))
  const formattedValue = i === 0 ? `${absBytes} ${sizes[i]}` : `${parseFloat((absBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  return isNegative ? `-${formattedValue}` : formattedValue
}

afterEach(cleanup)

const theme: Theme = {
  mode: 'light',
  system: {
    base: { default: '#ffffff', muted: '#f7fafc', subtle: '#f0f7ff', content: '#000000' },
    primary: { default: '#007ACC', hover: '#005A9E', active: '#004578', content: '#ffffff' },
    secondary: { default: '#6C757D', hover: '#5A6268', active: '#4E555B', content: '#ffffff' },
  },
}

// 1. Refined hierarchical structure with grouped metrics
interface PerformanceMetric {
  name: string
  value: string | number
}

interface PerformanceTest {
  name: string
  description: string
  metrics: PerformanceMetric[]
}

interface PerformanceGroup {
  description: string
  tests: PerformanceTest[]
}

const performanceMetrics: Record<string, PerformanceGroup> = {}

// 2. Helper to record metrics in grouped structure (parent headings have no values, sub-metrics do)
function recordGroupMetric(groupName: string, groupDescription: string, testName: string, testDescription: string, metricName: string, value: string | number) {
  // Initialize the group if it doesn't exist
  if (!performanceMetrics[groupName]) {
    performanceMetrics[groupName] = {
      description: groupDescription,
      tests: [],
    }
  }

  // Find or create the test entry within the group
  let testEntry = performanceMetrics[groupName].tests.find(t => t.name === testName)
  if (!testEntry) {
    testEntry = {
      name: testName,
      description: testDescription,
      metrics: [],
    }
    performanceMetrics[groupName].tests.push(testEntry)
  }

  // Add the metric to the test
  testEntry.metrics.push({ name: metricName, value })
}

// 3. Updated afterAll to display grouped metrics structure
afterAll(() => {
  const table = new Table({
    colWidths: [60, 20, 40],
    wordWrap: true,
  })

  // Add main title as first row
  table.push([{ content: 'MeoNode Performance Metrics Report', colSpan: 3, hAlign: 'center' }])
  table.push(['Group/Test/Metric', 'Value', 'Description'])

  Object.entries(performanceMetrics).forEach(([groupName, groupData], groupIndex) => {
    // Add a blank row between groups (except for the first group)
    if (groupIndex > 0) {
      table.push([{ colSpan: 3, content: '' }])
    }

    // Add a header row for the group with a single spanned column
    table.push([{ content: groupName, colSpan: 3, hAlign: 'center' }])

    // Add a row with the group description spanning all columns
    table.push([{ content: groupData.description, colSpan: 3, hAlign: 'center' }])

    // Add each test within the group
    groupData.tests.forEach(test => {
      const metricCount = test.metrics.length

      if (metricCount > 0) {
        // Header row for the test: Name spans 2 cols (Name + Value), Description spans all rows
        table.push([
          { content: test.name, colSpan: 2 },
          { rowSpan: metricCount + 1, content: test.description, vAlign: 'center' },
        ])

        // Metric rows
        test.metrics.forEach(metric => {
          table.push([{ content: metric.name, style: { 'padding-left': 2 } }, metric.value])
        })
      } else {
        table.push([test.name, 'No metrics', test.description])
      }
    })
  })

  console.log(table.toString())
})

async function measureRender(element: React.ReactNode, options?: { iterations?: number; warmups?: number }) {
  const iterations = options?.iterations ?? 4
  const warmups = options?.warmups ?? 1

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

describe('Performance Testing', () => {
  // Layout Rendering Group
  describe('Layout Rendering', () => {
    it('should render a realistic single-page layout quickly', async () => {
      const group = 'Layout Rendering Performance'
      const groupDescription = 'Tests for various layout rendering scenarios'
      const testName = 'Single-Page Layout'
      const testDescription = 'Measures performance of rendering a full SPA layout with header, hero, features, article, sidebar, testimonials, and footer'

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
                        'MeoNode’s BaseNode abstraction lazily resolves props, applies theme values and normalizes children into a consistent render pipeline.',
                        {
                          color: '#444',
                          marginBottom: '12px',
                        },
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
                        children: [P('"MeoNode made our design system consistent."', { fontStyle: 'italic' }), Strong('- Product Team')],
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
      const { times, median } = await measureRender(element, { iterations: 5, warmups: 1 })

      recordGroupMetric(group, groupDescription, testName, testDescription, 'Render Times', times.map(t => t.toFixed(2)).join(' ms, '))
      recordGroupMetric(group, groupDescription, testName, testDescription, 'Median Render Time', `${median.toFixed(2)} ms`)
      recordGroupMetric(group, groupDescription, testName, testDescription, 'Iterations', times.length)

      const finalRender = render(element)
      expect(finalRender.getByText('Build UIs with Type-Safe Fluency')).toBeInTheDocument()
      expect(finalRender.getByText('Highlights')).toBeInTheDocument()
      expect(finalRender.getByText('What people are saying')).toBeInTheDocument()
      finalRender.unmount()

      expect(median).toBeLessThan(200)
    })

    it('should render 10,000 same-level nodes quickly', async () => {
      const group = 'Layout Rendering Performance'
      const groupDescription = 'Tests for various layout rendering scenarios'
      const testName = '10,000 Same-Level Nodes'
      const testDescription = 'Measures rendering performance when creating 10,000 flat nodes without nesting'

      const NUM_NODES = 10000
      const children = []
      for (let i = 0; i < NUM_NODES; i++) {
        children.push(Column({ color: 'theme.primary', children: `Node ${i}` }))
      }

      const App = Column({ children })
      const element = ThemeProvider({ theme, children: App.render() }).render()
      const { median } = await measureRender(element, { iterations: 3, warmups: 1 })

      recordGroupMetric(group, groupDescription, testName, testDescription, `Median Render Time for ${NUM_NODES} Flat Nodes (ms)`, `${median.toFixed(2)} ms`)
      expect(median).toBeLessThan(500)
    })

    it('should render 10000 deeply nested nodes without stack overflow', async () => {
      const group = 'Layout Rendering Performance'
      const groupDescription = 'Tests for various layout rendering scenarios'
      const testName = '10,000 Deeply Nested Nodes'
      const testDescription = 'Measures performance when rendering 10,000 deeply nested nodes in a single parent-child chain'

      const NUM_NODES = 10000
      let nestedNode = Column({ color: 'theme.primary', children: `Deepest Node` })

      for (let i = 0; i < NUM_NODES - 1; i++) {
        nestedNode = Column({ children: nestedNode })
      }

      const App = nestedNode
      const element = ThemeProvider({ theme, children: App.render() }).render()
      const { median } = await measureRender(element, { iterations: 3, warmups: 1 })

      recordGroupMetric(group, groupDescription, testName, testDescription, `Median Render Time for ${NUM_NODES} Nested Nodes (ms)`, `${median.toFixed(2)} ms`)
      expect(median).toBeLessThan(2500)
    })

    describe('Memory Management', () => {
      it('should handle heavy state changes and varying nodes without memory leaks', async () => {
        const group = 'Memory Management Performance'
        const groupDescription = 'Tests for memory usage, garbage collection, and resource management'
        const testName = 'State Changes & Memory Leaks'
        const testDescription = 'Measures memory usage under heavy state changes with dynamic nodes, event handlers, and CSS'

        const NUM_INITIAL_NODES = 1000
        const NUM_UPDATES = 50
        const NODES_PER_UPDATE = 100

        const createComplexNode = (key: string, text: string, depth: number = 0): BaseNode => {
          const MAX_DEPTH = 2
          const shouldNest = depth < MAX_DEPTH && Math.random() > 0.5
          const childrenForContainer: BaseNode[] = []

          if (shouldNest) {
            const numChildren = Math.floor(Math.random() * 3) + 1
            for (let i = 0; i < numChildren; i++) {
              childrenForContainer.push(createComplexNode(`${key}-child-${i}`, `${text} Child ${i}`, depth + 1))
            }
          } else {
            childrenForContainer.push(P(text))
          }

          const nodeType = Math.random()
          if (nodeType < 0.25) {
            return Div({
              key,
              children: childrenForContainer,
              onClick: () => console.log(`Clicked ${key}`),
              onMouseEnter: () => console.log(`Mouse entered ${key}`),
              onMouseLeave: () => console.log(`Mouse left ${key}`),
            })
          } else if (nodeType < 0.5) {
            return Container({
              key,
              children: childrenForContainer,
              onClick: () => console.log(`Clicked ${key}`),
              css: {
                padding: '8px',
                margin: '4px',
                borderRadius: '4px',
                backgroundColor: Math.random() > 0.5 ? '#f0f0f0' : '#e0e0e0',
                border: '1px solid #ccc',
                transition: 'all 0.2s ease',
              },
            })
          } else if (nodeType < 0.75) {
            return Button(`Click ${text}`, {
              key,
              onClick: () => console.log(`Button clicked ${key}`),
              css: {
                padding: '8px 12px',
                margin: '4px',
                borderRadius: '4px',
                backgroundColor: '#007ACC',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#005A9E' },
              },
            })
          } else {
            return Column({
              key,
              children: childrenForContainer,
              css: { display: 'flex', flexDirection: 'column', padding: '8px', margin: '4px' },
            })
          }
        }

        const forceGC = () => {
          if (global.gc) {
            global.gc()
            return new Promise(resolve => setTimeout(resolve, 100))
          }
          return Promise.resolve()
        }

        await forceGC()
        const initialMemoryMeasurements = []
        for (let i = 0; i < 3; i++) {
          await forceGC()
          initialMemoryMeasurements.push(process.memoryUsage().heapUsed)
        }
        const initialMemory = initialMemoryMeasurements.reduce((a, b) => a + b) / initialMemoryMeasurements.length

        const createDynamicComponent = (id: number) => {
          return () => {
            const [nodes, setNodes] = React.useState(() => {
              const initialNodes: { key: string; text: string }[] = []
              for (let i = 0; i < NUM_INITIAL_NODES; i++) {
                initialNodes.push({ key: `node-${id}-${i}`, text: `Initial Node ${id}-${i}` })
              }
              return initialNodes
            })
            const updateCounter = React.useRef(0)

            const handleUpdate = () => {
              const updateIndex = updateCounter.current
              setNodes(() => {
                const newNodes: { key: string; text: string }[] = []
                const startIndex = Math.max(0, NUM_INITIAL_NODES - NODES_PER_UPDATE)
                for (let j = 0; j < startIndex; j++) {
                  newNodes.push({ key: `node-${id}-${j}`, text: `Node ${id}-${j}` })
                }
                for (let j = 0; j < NODES_PER_UPDATE; j++) {
                  const uniqueId = NUM_INITIAL_NODES + updateIndex * NODES_PER_UPDATE + j
                  newNodes.push({ key: `dynamic-node-${id}-${uniqueId}`, text: `Dynamic Node ${id}-${uniqueId} - Update ${updateIndex}` })
                }
                return newNodes
              })
              updateCounter.current += 1
            }

            React.useEffect(() => {
              const timer = setTimeout(() => {
                new Array(100).fill(0).map((_, i) => ({ id: i, value: Math.random() }))
              }, 50)
              return () => clearTimeout(timer)
            }, [])

            return Container({
              children: [
                Div({ 'data-testid': `update-button-${id}`, onClick: handleUpdate, children: `Update State ${id}` }),
                Container({ children: nodes.map(node => createComplexNode(node.key, node.text)) }),
              ],
            }).render()
          }
        }

        const renderTimes: number[] = []
        const unmountFunctions: (() => void)[] = []

        for (let i = 0; i < 5; i++) {
          const Component = createDynamicComponent(i)
          const { getByTestId, unmount } = render(ThemeProvider({ theme, children: Node(Component).render() }).render())
          const updateButton = getByTestId(`update-button-${i}`)
          unmountFunctions.push(unmount)

          for (let j = 0; j < Math.floor(NUM_UPDATES / 5); j++) {
            const t0 = performance.now()
            await act(async () => {
              fireEvent.click(updateButton)
            })
            const t1 = performance.now()
            renderTimes.push(t1 - t0)
          }
        }

        const medianRenderTime = renderTimes.length > 0 ? renderTimes.sort((a, b) => a - b)[Math.floor(renderTimes.length / 2)] : 0
        expect(medianRenderTime).toBeLessThan(500)

        unmountFunctions.forEach(unmount => unmount())
        await new Promise(resolve => setTimeout(resolve, 200))
        await forceGC()
        await forceGC()
        await forceGC()

        const finalMemoryMeasurements = []
        for (let i = 0; i < 3; i++) {
          await forceGC()
          finalMemoryMeasurements.push(process.memoryUsage().heapUsed)
        }
        const finalMemory = finalMemoryMeasurements.reduce((a, b) => a + b) / finalMemoryMeasurements.length
        const memoryGrowth = finalMemory - initialMemory

        recordGroupMetric(
          group,
          groupDescription,
          testName,
          testDescription,
          `Median Render Time for ${NUM_UPDATES} State Updates`,
          `${medianRenderTime.toFixed(2)} ms`,
        )
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Initial Heap Size', formatMemory(initialMemory))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Final Heap Size', formatMemory(finalMemory))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Memory Growth After Operations', formatMemory(memoryGrowth))

        expect(memoryGrowth / 1024 / 1024).toBeLessThan(150)
      }, 100000)

      it('should handle multiple mount/unmount cycles without memory leaks', async () => {
        const group = 'Memory Management Performance'
        const groupDescription = 'Tests for memory usage, garbage collection, and resource management'
        const testName = 'Mount/Unmount Cycles'
        const testDescription = 'Measures memory usage during 20 cycles of mounting/unmounting 10 components each, testing cleanup mechanisms'

        const CYCLES = 20
        const COMPONENTS_PER_CYCLE = 10

        const createMountTestComponent = (id: number) => {
          return () => {
            const [counter, setCounter] = React.useState(0)

            React.useEffect(() => {
              const interval = setInterval(() => {
                act(() => setCounter(prev => prev + 1))
              }, 50)
              const timeout = setTimeout(() => {
                new Array(50).fill(null).map((_, i) => ({ id: i, timestamp: Date.now() }))
              }, 100)
              return () => {
                clearInterval(interval)
                clearTimeout(timeout)
              }
            }, [])

            return Container({
              children: [
                Div({ 'data-testid': `component-${id}`, children: `Component ${id} - Counter: ${counter}` }),
                ...Array.from({ length: 5 }, (_, idx) =>
                  Button(`Button ${id}-${idx}`, {
                    onClick: () => console.log(`Button ${id}-${idx} clicked`),
                    css: {
                      margin: '4px',
                      padding: '6px 10px',
                      backgroundColor: '#007ACC',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    },
                  }),
                ),
              ],
            }).render()
          }
        }

        const forceGC = () => {
          if (global.gc) {
            global.gc()
            return new Promise(resolve => setTimeout(resolve, 50))
          }
          return Promise.resolve()
        }

        await forceGC()
        const initialMemory = process.memoryUsage().heapUsed

        for (let cycle = 0; cycle < CYCLES; cycle++) {
          const unmountFunctions: (() => void)[] = []
          for (let i = 0; i < COMPONENTS_PER_CYCLE; i++) {
            const Component = createMountTestComponent(cycle * COMPONENTS_PER_CYCLE + i)
            const { unmount } = render(ThemeProvider({ theme, children: Node(Component).render() }).render())
            unmountFunctions.push(unmount)
          }
          await new Promise(resolve => setTimeout(resolve, 100))
          unmountFunctions.forEach(unmount => unmount())
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        await new Promise(resolve => setTimeout(resolve, 300))
        await forceGC()
        await forceGC()
        await forceGC()
        const finalMemory = process.memoryUsage().heapUsed
        const memoryGrowth = finalMemory - initialMemory
        const memoryGrowthMB = memoryGrowth / 1024 / 1024

        recordGroupMetric(group, groupDescription, testName, testDescription, `Initial Heap Size`, formatMemory(initialMemory))
        recordGroupMetric(group, groupDescription, testName, testDescription, `Final Heap Size`, formatMemory(finalMemory))
        recordGroupMetric(
          group,
          groupDescription,
          testName,
          testDescription,
          `Memory Growth After ${CYCLES} Cycles (${CYCLES * COMPONENTS_PER_CYCLE} mounts/unmounts)`,
          formatMemory(memoryGrowth),
        )

        expect(memoryGrowthMB).toBeLessThan(20)
      }, 30000)

      it('should not leak memory during navigation cycles', async () => {
        const group = 'Memory Management Performance'
        const groupDescription = 'Tests for memory usage, garbage collection, and resource management'
        const testName = 'Navigation Memory Leak Check'
        const testDescription = 'Measures memory usage after simulating navigation between two different pages multiple times to detect leaks.'

        const forceGC = async () => {
          if (global.gc) {
            global.gc()
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }

        const createPage = (pageName: string, numElements: number) => {
          const elements = Array.from({ length: numElements }, (_, i) =>
            Div({
              key: `${pageName}-element-${i}`,
              css: {
                width: '10px',
                height: '10px',
                backgroundColor: i % 2 === 0 ? 'blue' : 'green',
                margin: '2px',
              },
              children: `${pageName} Item ${i}`,
            }),
          )
          return Container({
            children: [
              H1(`${pageName} Page`, { 'data-testid': `${pageName}-header` }),
              ...elements,
              Button(`Go to Other Page from ${pageName}`, {
                'data-testid': `${pageName}-navigate-button`,
                onClick: () => {
                  /* Handled by parent */
                },
              }),
            ],
          }).render()
        }

        const NUM_NAV_CYCLES = 10

        const RootComponent: React.FC = () => {
          const [currentPage, setCurrentPage] = React.useState<'page1' | 'page2'>('page1')

          const handleNavigate = () => {
            setCurrentPage(prev => (prev === 'page1' ? 'page2' : 'page1'))
          }

          const page1 = createPage('Page1', 1000)
          const page2 = createPage('Page2', 1500)

          return ThemeProvider({
            theme,
            children: Div({
              children: [
                currentPage === 'page1'
                  ? Div({ key: 'page1', children: page1, onClick: handleNavigate })
                  : Div({ key: 'page2', children: page2, onClick: handleNavigate }),
              ],
            }).render(),
          }).render()
        }

        // Initial memory measurement
        await forceGC()
        const initialMemory = process.memoryUsage().heapUsed

        const { getByTestId, unmount } = render(Node(RootComponent).render())

        const memorySnapshots: { cycle: number; page: string; memory: number }[] = []

        for (let i = 0; i < NUM_NAV_CYCLES; i++) {
          await act(async () => {
            const currentPageId = i % 2 === 0 ? 'Page1' : 'Page2'
            fireEvent.click(getByTestId(`${currentPageId}-navigate-button`))
          })

          await forceGC()
          const currentMemory = process.memoryUsage().heapUsed
          memorySnapshots.push({ cycle: i + 1, page: i % 2 === 0 ? 'page2' : 'page1', memory: currentMemory })

          // Add a small delay to allow potential async operations to complete
          await new Promise(resolve => setTimeout(resolve, 20))
        }

        unmount()
        await forceGC()
        const finalMemoryAfterUnmount = process.memoryUsage().heapUsed

        // Calculate peak memory usage during navigation
        const peakMemory = Math.max(...memorySnapshots.map(s => s.memory))

        // Analyze memory trends
        // We expect the memory usage to stabilize, not constantly grow.
        // A simple check is to compare the initial memory to the final memory after unmounting,
        // and also ensure that the peak during navigation isn't excessively high compared to initial.
        const memoryGrowthAfterNavigations = peakMemory - initialMemory
        const memoryGrowthAfterUnmount = finalMemoryAfterUnmount - initialMemory

        recordGroupMetric(group, groupDescription, testName, testDescription, 'Initial Heap Size', formatMemory(initialMemory))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Peak Heap Size During Navigation', formatMemory(peakMemory))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Final Heap Size After Unmount', formatMemory(finalMemoryAfterUnmount))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Memory Growth (Peak - Initial)', formatMemory(memoryGrowthAfterNavigations))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Memory Growth (Final Unmount - Initial)', formatMemory(memoryGrowthAfterUnmount))

        // Allow for some fluctuation, but not a continuous leak.
        // For example, allow up to 50 MB growth during operations, and expect it to return closer to initial after unmount.
        const PEAK_MEMORY_TOLERANCE_MB = 50
        const UNMOUNT_MEMORY_TOLERANCE_MB = 20

        expect(memoryGrowthAfterNavigations / 1024 / 1024).toBeLessThan(PEAK_MEMORY_TOLERANCE_MB)
        expect(memoryGrowthAfterUnmount / 1024 / 1024).toBeLessThan(UNMOUNT_MEMORY_TOLERANCE_MB)

        // Additionally, check that memory tends to return to a baseline after unmount for each cycle
        // This is a more robust check for continuous leaks than just initial vs final.
        // For simplicity, we'll check that the last snapshot is not drastically higher than the first.
        if (memorySnapshots.length > 1) {
          const firstNavMemory = memorySnapshots[0].memory
          const lastNavMemory = memorySnapshots[memorySnapshots.length - 1].memory
          const memoryChangeDuringCycles = lastNavMemory - firstNavMemory
          recordGroupMetric(
            group,
            groupDescription,
            testName,
            testDescription,
            'Memory Change Across Cycles (Last Nav - First Nav)',
            formatMemory(memoryChangeDuringCycles),
          )
          expect(memoryChangeDuringCycles / 1024 / 1024).toBeLessThan(15) // Small growth allowed
        }
      }, 100000)
    })

    // Prop Processing Group
    describe('Preprocessing and StableKey Performance', () => {
      const group = 'Prop Processing Performance'
      const groupDescription = 'Tests for prop preprocessing, stableKey generation, and object handling efficiency'

      it('should generate stableKeys efficiently for nodes with identical prop objects', () => {
        const testName = 'Identical Props'
        const testDescription = 'Measures performance of node instantiation with identical prop objects to test stableKey generation efficiency'
        const NUM_NODES = 5000

        const commonProps = { color: 'theme.primary', padding: '10px' }
        const t0 = performance.now()
        for (let i = 0; i < NUM_NODES; i++) {
          Column(commonProps)
        }
        const t1 = performance.now()
        const duration = t1 - t0

        recordGroupMetric(group, groupDescription, testName, testDescription, `Duration`, `${duration.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Nodes Processed', NUM_NODES)
        expect(duration).toBeLessThan(100)
      })

      it('should generate stableKeys for nodes with unique props', () => {
        const testName = 'Unique Props'
        const testDescription = 'Measures performance of node instantiation with unique props to test stableKey generation efficiency'
        const NUM_NODES = 5000

        const t0 = performance.now()
        for (let i = 0; i < NUM_NODES; i++) {
          Column({ color: 'theme.primary', padding: `${i}px` })
        }
        const t1 = performance.now()
        const duration = t1 - t0

        recordGroupMetric(group, groupDescription, testName, testDescription, `Duration`, `${duration.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Nodes Processed', NUM_NODES)
        expect(duration).toBeLessThan(500)
      })

      it('should demonstrate "critical props" optimization for large prop objects', () => {
        const testName = 'Large Prop Objects'
        const testDescription = 'Measures performance of node instantiation with large prop objects to test critical props optimization'
        const NUM_NODES = 5000

        const largeProps: Record<string, any> = {}
        for (let i = 0; i < 150; i++) {
          largeProps[`prop${i}`] = `value${i}`
        }

        const t0 = performance.now()
        for (let i = 0; i < NUM_NODES; i++) {
          Column({ ...largeProps, unique: i })
        }
        const t1 = performance.now()
        const durationFull = t1 - t0

        recordGroupMetric(group, groupDescription, testName, testDescription, `Duration with Large Unique Props`, `${durationFull.toFixed(2)} ms`)

        const t2 = performance.now()
        for (let i = 0; i < NUM_NODES; i++) {
          Column({ ...largeProps, color: `red`, padding: `${i}px` })
        }
        const t3 = performance.now()
        const durationCritical = t3 - t2

        recordGroupMetric(group, groupDescription, testName, testDescription, `Duration with Critical Changing Props`, `${durationCritical.toFixed(2)} ms`)
        expect(durationCritical).toBeLessThan(durationFull * 1.5)
      })

      it('should generate stableKeys efficiently for nodes with complex css prop', () => {
        const testName = 'Complex CSS Prop'
        const testDescription = 'Measures performance of node instantiation with a complex CSS prop to test stableKey generation efficiency'
        const NUM_NODES = 5000

        const t0 = performance.now()
        for (let i = 0; i < NUM_NODES; i++) {
          Column({ css, children: `Styled Node ${i}` })
        }
        const t1 = performance.now()
        const duration = t1 - t0

        recordGroupMetric(group, groupDescription, testName, testDescription, `Duration`, `${duration.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Nodes Processed', NUM_NODES)
        expect(duration).toBeLessThan(300)
      })
    })

    // Compiled Marker Fast Path vs Legacy Group
    // Compares the compiler-marker fast path (pre-partitioned `c`/`d` props + `k`/`dyn` stable-key
    // hash, see src/util/node.util.ts `getCompiledSchema`/`processProps` and src/core.node.ts
    // `_getStableKey`) against the legacy path (per-key CSS/DOM classification + full
    // `createPropSignature`) for an identical component tree built both ways.
    //
    // Env note: this suite runs under vitest.perf.config.ts, which inherits `environment: 'jsdom'`
    // from vitest.config.ts (not overridden). Under jsdom, `window` is defined, so
    // `NodeUtil.isServer` is `false` and the stableKey fast path in `_getStableKey` is exercised
    // (that path is skipped entirely in a server/node environment). Both node construction
    // (stableKey, computed synchronously in the BaseNode constructor) and `.props` access
    // (processProps, lazy) are forced for every node in the tree, so both fast paths are measured.
    describe('Compiled Marker vs Legacy Fast Path', () => {
      const group = 'Compiled Marker vs Legacy Fast Path'
      const groupDescription =
        'Compares the compiled-marker fast path (schema 2: pre-partitioned __meo$c/__meo$d props + __meo$k/__meo$dyn stable-key hash) against the legacy per-key CSS/DOM classification + full createPropSignature path, for an identical component tree'

      // Tree shape: depth 3, breadth 4 => 1 + 4 + 16 + 64 = 85 nodes/tree, ~9 props/node (6 CSS + 3 DOM/event).
      const TREE_DEPTH = 3
      const TREE_BREADTH = 4
      const ITERATIONS = 150
      const WARMUP_ITERATIONS = 10

      function countTreeNodes(depth: number, breadth: number): number {
        let total = 0
        for (let i = 0; i <= depth; i++) total += breadth ** i
        return total
      }
      const NODES_PER_TREE = countTreeNodes(TREE_DEPTH, TREE_BREADTH)

      // Raw-props tree, e.g. Div({ padding: '20px', backgroundColor: 'red', onClick, id: 'x', children: [...] })
      // built recursively so every node in the tree gets its own distinct props (~9/node: 6 CSS-ish + 3 DOM/event).
      function buildLegacyTree(depth: number, breadth: number, path: string): BaseNode {
        const children: Array<BaseNode | string> =
          depth > 0 ? Array.from({ length: breadth }, (_, i) => buildLegacyTree(depth - 1, breadth, `${path}-${i}`)) : [`Leaf ${path}`]

        return Div({
          id: `node-${path}`,
          'data-testid': `node-${path}`,
          padding: '20px',
          backgroundColor: path.length % 2 === 0 ? 'red' : 'blue',
          margin: '4px',
          borderRadius: '4px',
          display: 'flex',
          color: '#333',
          onClick: () => {},
          children,
        } as any)
      }

      // Equivalent pre-partitioned marker-props tree: same CSS/DOM props split into the
      // CSS/DOM buckets ahead of time, the site key standing in for the compiler's
      // call-site stable-key hash, and the dyn list naming the one prop whose value is
      // not literal at the call site (the click handler).
      //
      // Uses **schema 2**, the shape `@meonode/compiler` actually emits. This bench
      // previously hand-wrote schema 1 (`__meo$: 1` with bare `c`/`d`/`k`/`dyn`), which
      // the runtime still supports but no released compiler produces — so it was
      // measuring a path no user is on. Schema 2 namespaces every bucket under the
      // marker prefix, which is also what makes it safe against a spread carrying a real
      // prop named `d` (a valid SVG `<path>` attribute).
      //
      // Bucket names come from COMPILER_SCHEMA_KEYS rather than string literals so this
      // tracks the contract instead of drifting from it silently.
      function buildMarkerTree(depth: number, breadth: number, path: string): BaseNode {
        const children: Array<BaseNode | string> =
          depth > 0 ? Array.from({ length: breadth }, (_, i) => buildMarkerTree(depth - 1, breadth, `${path}-${i}`)) : [`Leaf ${path}`]

        const schemaKeys = COMPILER_SCHEMA_KEYS[2]

        return Div({
          [COMPILED_MARKER]: 2,
          [schemaKeys.css]: {
            padding: '20px',
            backgroundColor: path.length % 2 === 0 ? 'red' : 'blue',
            margin: '4px',
            borderRadius: '4px',
            display: 'flex',
            color: '#333',
          },
          [schemaKeys.dom]: {
            id: `node-${path}`,
            'data-testid': `node-${path}`,
            onClick: () => {},
          },
          [schemaKeys.key]: `bench-${path}`,
          [schemaKeys.dyn]: ['onClick'],
          children,
        } as any)
      }

      // Walks the raw (pre-processed) children tree and forces `.props` (processProps) on every
      // node, so the benchmark exercises processProps for the whole tree, not just the root
      // (construction alone already exercises stableKey for every node via the constructor).
      function forceProps(node: BaseNode): number {
        let count = 1
        void node.props
        const children = (node.rawProps as { children?: unknown }).children
        if (children) {
          const childArray = Array.isArray(children) ? children : [children]
          for (const child of childArray) {
            if (child && (child as BaseNode).isBaseNode) {
              count += forceProps(child as BaseNode)
            }
          }
        }
        return count
      }

      function runBench(build: (i: number) => BaseNode): number {
        const t0 = performance.now()
        for (let i = 0; i < ITERATIONS; i++) {
          forceProps(build(i))
        }
        return performance.now() - t0
      }

      it('should process compiled-marker props at least as fast as legacy per-key classification', () => {
        const testName = 'Tree Construction + Props Processing + StableKey'
        const testDescription = `Builds an identical ${NODES_PER_TREE}-node component tree (depth ${TREE_DEPTH}, breadth ${TREE_BREADTH}, ~9 props/node) ${ITERATIONS} times via the legacy per-key CSS/DOM classification path and via the pre-partitioned compiled-marker schema 2 (__meo$c/__meo$d/__meo$k/__meo$dyn) fast path, forcing both node construction (stableKey) and .props access (processProps) for every node`

        const forceGC = () => {
          if (global.gc) global.gc()
        }

        // Warm up both paths together (interleaved) so JIT warmup/GC timing doesn't
        // systematically favor whichever path is measured first.
        for (let i = 0; i < WARMUP_ITERATIONS; i++) {
          forceProps(buildLegacyTree(TREE_DEPTH, TREE_BREADTH, `warmup-legacy-${i}`))
          forceProps(buildMarkerTree(TREE_DEPTH, TREE_BREADTH, `warmup-marker-${i}`))
        }

        forceGC()
        const legacyDuration = runBench(i => buildLegacyTree(TREE_DEPTH, TREE_BREADTH, `legacy-${i}`))

        forceGC()
        const markerDuration = runBench(i => buildMarkerTree(TREE_DEPTH, TREE_BREADTH, `marker-${i}`))

        const legacyOpsPerSec = (ITERATIONS / legacyDuration) * 1000
        const markerOpsPerSec = (ITERATIONS / markerDuration) * 1000
        const ratio = markerOpsPerSec / legacyOpsPerSec

        recordGroupMetric(group, groupDescription, testName, testDescription, 'Nodes Per Tree', NODES_PER_TREE)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Iterations (Trees Built)', ITERATIONS)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Legacy Path Duration', `${legacyDuration.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Marker Path Duration', `${markerDuration.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Legacy Path Ops/Sec (trees/sec)', legacyOpsPerSec.toFixed(1))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Marker Path Ops/Sec (trees/sec)', markerOpsPerSec.toFixed(1))
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Marker/Legacy Ops Ratio', ratio.toFixed(2))

        // Soft guard only: the compiled fast path must not regress meaningfully below legacy.
        // Not a hard "must be faster" assertion — direct-loop timing in jsdom has enough jitter
        // that a tight bound would be flaky; a 0.9 floor only catches a real regression (marker
        // meaningfully SLOWER than legacy), not ordinary noise.
        expect(ratio).toBeGreaterThanOrEqual(0.9)
      })
    })

    // Form Input Performance Group
    describe('Form Input Performance', () => {
      const group = 'Form Input Performance'
      const groupDescription = 'Tests for controlled input performance with simulated human typing'

      it('should handle 100 controlled inputs with deps-based memoization efficiently', async () => {
        const testName = '100 Controlled Inputs with Typing Simulation'
        const testDescription =
          'Measures performance of 100 controlled inputs with simulated human typing (200ms/char). Each input uses deps for optimized re-rendering.'

        const NUM_INPUTS = 100
        const CHARS_TO_TYPE = 5 // Type 5 characters per input
        const TYPING_DELAY = 200 // Average human typing: ~200ms per character

        const FormComponent: React.FC = () => {
          // Initialize state for all inputs
          const [inputValues, setInputValues] = React.useState<Record<number, string>>(() => {
            const initial: Record<number, string> = {}
            for (let i = 0; i < NUM_INPUTS; i++) {
              initial[i] = ''
            }
            return initial
          })

          const handleChange = (index: number, value: string) => {
            setInputValues(prev => ({ ...prev, [index]: value }))
          }

          // Create input fields using MeoNode with deps
          const inputFields = []
          for (let i = 0; i < NUM_INPUTS; i++) {
            const value = inputValues[i]
            inputFields.push(
              Container(
                {
                  key: `input-row-${i}`,
                  marginBottom: '8px',
                  children: [
                    Node('label', {
                      marginRight: '8px',
                      children: `Input ${i + 1}:`,
                    }),
                    Input(
                      {
                        type: 'text',
                        value,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value),
                        css: {
                          padding: '4px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        },
                      },
                      [value], // Only re-render when this specific input's value changes
                    ),
                  ],
                },
                [value], // Container also uses deps for double optimization
              ),
            )
          }

          return Container({
            padding: '16px',
            children: [
              H2('Form Performance Test', { marginBottom: '16px' }),
              Container({
                maxHeight: '400px',
                overflow: 'auto',
                children: inputFields,
              }),
            ],
          }).render()
        }

        // Initial render
        const { container, unmount } = render(ThemeProvider({ theme, children: Node(FormComponent).render() }).render())

        // Track typing performance
        const typingTimes: number[] = []
        const inputsToTest = [0, 25, 50, 75, 99] // Test a subset across the range

        // Get all inputs once (they all have identical props, differentiated only by deps)
        const allInputs = container.querySelectorAll('input')
        expect(allInputs.length).toBe(NUM_INPUTS)

        for (const inputIndex of inputsToTest) {
          // Select input by index from the NodeList
          const input = allInputs[inputIndex] as HTMLInputElement
          expect(input).toBeTruthy()
          expect(input.value).toBe('') // Verify initial state

          for (let charIndex = 0; charIndex < CHARS_TO_TYPE; charIndex++) {
            const char = String.fromCharCode(65 + charIndex) // A, B, C, D, E
            const newValue = input.value + char

            const t0 = performance.now()
            await act(async () => {
              fireEvent.change(input, { target: { value: newValue } })
            })
            const t1 = performance.now()
            typingTimes.push(t1 - t0)

            // Verify the input has the expected value (no cache collision)
            // Expected: A, AB, ABC, ABCD, ABCDE
            const expectedValue = String.fromCharCode(...Array.from({ length: charIndex + 1 }, (_, i) => 65 + i))
            expect(input.value).toBe(expectedValue)

            // Simulate human typing delay
            await new Promise(resolve => setTimeout(resolve, TYPING_DELAY))
          }

          // Final verification: input should have 'ABCDE' typed
          expect(input.value).toBe('ABCDE')
        }

        unmount()

        // Calculate metrics
        const avgTypingTime = typingTimes.reduce((sum, t) => sum + t, 0) / typingTimes.length
        const maxTypingTime = Math.max(...typingTimes)
        const p95TypingTime = typingTimes.sort((a, b) => a - b)[Math.floor(typingTimes.length * 0.95)]

        recordGroupMetric(group, groupDescription, testName, testDescription, 'Number of Inputs', NUM_INPUTS)
        recordGroupMetric(
          group,
          groupDescription,
          testName,
          testDescription,
          'Characters Typed Per Input',
          `${CHARS_TO_TYPE} (${inputsToTest.length} inputs tested)`,
        )
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Avg Input Response Time', `${avgTypingTime.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'Max Input Response Time', `${maxTypingTime.toFixed(2)} ms`)
        recordGroupMetric(group, groupDescription, testName, testDescription, 'P95 Input Response Time', `${p95TypingTime.toFixed(2)} ms`)

        // Performance assertions
        expect(avgTypingTime).toBeLessThan(50) // Average should be very fast
        expect(p95TypingTime).toBeLessThan(100) // P95 should still be responsive
        expect(maxTypingTime).toBeLessThan(200) // Even worst case should be decent
      }, 60000)
    })
  })
})
