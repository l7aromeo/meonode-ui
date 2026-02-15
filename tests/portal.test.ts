import { createDataChannel, Node, PortalHost, type PortalLayerProps, PortalProvider } from '@src/main.js'
import { usePortal } from '@src/hook/usePortal.js'
import { useDataChannel } from '@src/hook/useDataChannel.js'
import { act, cleanup, render } from '@testing-library/react'
import React, { type ReactNode, useState } from 'react'

afterEach(cleanup)

/**
 * Helper: wraps content in PortalProvider + PortalHost and renders it.
 */
function renderWithPortal(content: ReactNode) {
  const App = PortalProvider({
    children: [content, PortalHost()],
  }).render()
  return render(App)
}

/**
 * Helper: creates a test app component that uses usePortal hook.
 */
function createTestApp<T>(ContentComponent: React.ComponentType<PortalLayerProps<T>>, initialData?: T) {
  return () => {
    const portal = usePortal()
    return Node('div', {
      children: [
        Node('button', {
          onClick: () => portal.open(ContentComponent, initialData),
          children: 'Open Portal',
        }).render(),
        Node('button', {
          onClick: () => portal.close(),
          children: 'Close Portal',
        }).render(),
      ],
    }).render()
  }
}

describe('Portal System', () => {
  describe('PortalProvider + PortalHost', () => {
    it('should render PortalHost without errors when stack is empty', () => {
      const { container } = renderWithPortal(Node('div', { children: 'Main Content' }).render())
      expect(container).toHaveTextContent('Main Content')
    })

    it('should throw when usePortal is used outside PortalProvider', () => {
      const BadComponent = () => {
        usePortal()
        return null
      }

      expect(() => {
        render(Node(BadComponent).render())
      }).toThrow('usePortal must be used within a PortalProvider')
    })
  })

  describe('usePortal hook', () => {
    it('should open and close a portal via usePortal', async () => {
      const PortalContent = (_props: PortalLayerProps) => {
        return Node('div', { children: 'Portal Content' }).render()
      }

      const TestApp = createTestApp(PortalContent)
      const { getByText } = renderWithPortal(Node(TestApp).render())

      // Open portal
      await act(async () => {
        getByText('Open Portal').click()
      })

      expect(document.body).toHaveTextContent('Portal Content')

      // Close portal
      await act(async () => {
        getByText('Close Portal').click()
      })

      expect(document.body).not.toHaveTextContent('Portal Content')
    })

    it('should pass data and depth to portal content', async () => {
      const PortalContent = ({ data, depth }: PortalLayerProps<{ message: string }>) => {
        return Node('div', {
          children: `${data?.message} at depth ${depth}`,
        }).render()
      }

      const TestApp = createTestApp(PortalContent, { message: 'Hello' })
      const { getByText } = renderWithPortal(Node(TestApp).render())

      await act(async () => {
        getByText('Open Portal').click()
      })

      expect(document.body).toHaveTextContent('Hello at depth 1')
    })

    it('should support updateData to sync data without re-rendering parent', async () => {
      const PortalContent = ({ data }: PortalLayerProps<{ count: number }>) => {
        return Node('div', { children: `Count: ${data?.count ?? 0}` }).render()
      }

      const TestApp = () => {
        const portal = usePortal()
        return Node('div', {
          children: [
            Node('button', {
              onClick: () => {
                portal.open(PortalContent, { count: 0 })
              },
              children: 'Open',
            }).render(),
            Node('button', {
              onClick: () => portal.updateData({ count: 42 }),
              children: 'Update Data',
            }).render(),
          ],
        }).render()
      }

      const { getByText } = renderWithPortal(Node(TestApp).render())

      await act(async () => {
        getByText('Open').click()
      })
      expect(document.body).toHaveTextContent('Count: 0')

      await act(async () => {
        getByText('Update Data').click()
      })
      expect(document.body).toHaveTextContent('Count: 42')
    })

    it('should support nested portals (portal opening another portal)', async () => {
      const InnerContent = ({ data, close }: PortalLayerProps<{ label: string }>) => {
        return Node('div', {
          children: [Node('span', { children: `Inner: ${data?.label}` }).render(), Node('button', { onClick: close, children: 'Close Inner' }).render()],
        }).render()
      }

      const OuterContent = ({ data }: PortalLayerProps<{ label: string }>) => {
        const portal = usePortal()
        return Node('div', {
          children: [
            Node('span', { children: `Outer: ${data?.label}` }).render(),
            Node('button', {
              onClick: () => portal.open(InnerContent, { label: 'Nested' }),
              children: 'Open Nested',
            }).render(),
          ],
        }).render()
      }

      const TestApp = createTestApp(OuterContent, { label: 'Root' })
      const { getByText } = renderWithPortal(Node(TestApp).render())

      // Open outer portal
      await act(async () => {
        getByText('Open Portal').click()
      })
      expect(document.body).toHaveTextContent('Outer: Root')

      // Open inner portal
      await act(async () => {
        getByText('Open Nested').click()
      })
      expect(document.body).toHaveTextContent('Outer: Root')
      expect(document.body).toHaveTextContent('Inner: Nested')

      // Close inner
      await act(async () => {
        getByText('Close Inner').click()
      })
      expect(document.body).not.toHaveTextContent('Inner: Nested')
      expect(document.body).toHaveTextContent('Outer: Root')
    })

    it('should support multiple independent portals', async () => {
      const ContentA = ({ data }: PortalLayerProps<{ name: string }>) => {
        return Node('div', { children: `Portal A: ${data?.name}` }).render()
      }
      const ContentB = ({ data }: PortalLayerProps<{ name: string }>) => {
        return Node('div', { children: `Portal B: ${data?.name}` }).render()
      }

      const TestApp = () => {
        const portalA = usePortal()
        const portalB = usePortal()
        return Node('div', {
          children: [
            Node('button', {
              onClick: () => portalA.open(ContentA, { name: 'First' }),
              children: 'Open A',
            }).render(),
            Node('button', {
              onClick: () => portalB.open(ContentB, { name: 'Second' }),
              children: 'Open B',
            }).render(),
            Node('button', { onClick: () => portalA.close(), children: 'Close A' }).render(),
          ],
        }).render()
      }

      const { getByText } = renderWithPortal(Node(TestApp).render())

      await act(async () => {
        getByText('Open A').click()
      })
      await act(async () => {
        getByText('Open B').click()
      })

      expect(document.body).toHaveTextContent('Portal A: First')
      expect(document.body).toHaveTextContent('Portal B: Second')

      // Close only A
      await act(async () => {
        getByText('Close A').click()
      })
      expect(document.body).not.toHaveTextContent('Portal A: First')
      expect(document.body).toHaveTextContent('Portal B: Second')
    })
  })

  describe('DataChannel', () => {
    it('should create a data channel and subscribe to updates', () => {
      const channel = createDataChannel<number>(0)
      const values: number[] = []

      const unsub = channel.subscribe(val => values.push(val))

      channel.set(1)
      channel.set(2)
      channel.set(3)

      expect(values).toEqual([1, 2, 3])
      expect(channel.get()).toBe(3)

      unsub()
      channel.set(4)

      // Should not receive after unsubscribe
      expect(values).toEqual([1, 2, 3])
    })

    it('should work with useDataChannel hook', async () => {
      const channel = createDataChannel<string>('initial')

      const Display = () => {
        const data = useDataChannel(channel)
        return Node('div', { children: `Value: ${data}` }).render()
      }

      const { getByText } = render(Node(Display).render())
      expect(getByText('Value: initial')).toBeInTheDocument()

      await act(async () => {
        channel.set('updated')
      })

      expect(getByText('Value: updated')).toBeInTheDocument()
    })
  })

  describe('Portal close via close prop', () => {
    it('should allow portal content to close itself via close prop', async () => {
      const PortalContent = ({ close }: PortalLayerProps) => {
        return Node('div', {
          children: [Node('span', { children: 'Self-closing portal' }).render(), Node('button', { onClick: close, children: 'Self Close' }).render()],
        }).render()
      }

      const TestApp = createTestApp(PortalContent)
      const { getByText } = renderWithPortal(Node(TestApp).render())

      await act(async () => {
        getByText('Open Portal').click()
      })
      expect(document.body).toHaveTextContent('Self-closing portal')

      await act(async () => {
        getByText('Self Close').click()
      })
      expect(document.body).not.toHaveTextContent('Self-closing portal')
    })
  })

  describe('usePortal Auto-Sync', () => {
    it('should update portal content automatically when using usePortal(data) in a RootLayout setup', async () => {
      interface CountData {
        count: number
        setCount: React.Dispatch<React.SetStateAction<number>>
      }

      const PortalContent = ({ data, close }: PortalLayerProps<CountData>) => {
        return Node('div', {
          children: [
            Node('span', { children: `Portal Count: ${data?.count}` }).render(),
            Node('button', {
              onClick: () => data?.setCount(c => c + 1),
              children: 'Increment from Portal',
            }).render(),
            Node('button', {
              onClick: close,
              children: 'Close Portal',
            }).render(),
          ],
        }).render()
      }

      const MyComponent = () => {
        const [count, setCount] = useState(0)
        // Auto-sync feature
        const portal = usePortal({ count, setCount })

        return Node('div', {
          children: [
            Node('span', { children: `App Count: ${count}` }).render(),
            Node('button', {
              onClick: () => portal.open(PortalContent),
              children: 'Open Portal',
            }).render(),
          ],
        }).render()
      }

      // RootLayout style setup
      const RootLayout = ({ children }: { children: ReactNode }) => {
        return PortalProvider({
          children: [children, PortalHost()],
        }).render()
      }

      const { getByText } = render(Node(RootLayout, { children: Node(MyComponent).render() }).render())

      // Open portal
      await act(async () => {
        getByText('Open Portal').click()
      })

      expect(document.body).toHaveTextContent('App Count: 0')
      expect(document.body).toHaveTextContent('Portal Count: 0')

      // Increment from portal
      await act(async () => {
        getByText('Increment from Portal').click()
      })

      // Both App and Portal should update automatically
      expect(document.body).toHaveTextContent('App Count: 1')
      expect(document.body).toHaveTextContent('Portal Count: 1')

      // Close portal from within
      await act(async () => {
        getByText('Close Portal').click()
      })
      expect(document.body).not.toHaveTextContent('Portal Count: 1')
    })
  })
})
