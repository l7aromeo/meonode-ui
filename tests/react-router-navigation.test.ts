import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Link, useNavigate, Outlet } from 'react-router-dom'
import { Node, Div, P, H1, Fragment } from '@src/main'
import { BaseNode } from '@src/core.node'

describe('React Router Navigation with MeoNode', () => {
  beforeEach(() => {
    BaseNode.clearCaches()
    cleanup()
  })

  it('should clean up cached components during React Router navigation', async () => {
    // Page components with caching enabled
    const HomePage = () => {
      return Div({
        children: [H1('Home Page'), P('Welcome to the home page'), Node(Link, { to: '/about', children: 'Go to About' }, []).render()],
      }).render()
    }

    const AboutPage = () => {
      return Div({
        children: [H1('About Page'), P('This is the about page'), Node(Link, { to: '/', children: 'Go to Home' }, []).render()],
      }).render()
    }

    // Shared header component
    const Header = () => {
      return Div({
        children: H1('Shared Header'),
      }).render()
    }

    // Layout component
    const Layout = () => {
      return Fragment({
        children: [Header(), Node(Outlet).render()],
      }).render()
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: Node(Layout).render(),
        children: [
          {
            path: '/',
            element: Node(HomePage).render(),
          },
          {
            path: '/about',
            element: Node(AboutPage).render(),
          },
        ],
      },
    ])

    // Render app with RouterProvider
    const { getByText, queryByText } = render(Node(RouterProvider, { router }).render())

    // Check initial render
    await waitFor(() => expect(getByText('Home Page')).toBeInTheDocument())
    expect(getByText('Welcome to the home page')).toBeInTheDocument()

    const initialCacheSize = BaseNode.elementCache.size
    expect(initialCacheSize).toBeGreaterThan(0)

    // Navigate to About page
    fireEvent.click(getByText('Go to About'))

    // Check About page is rendered
    await waitFor(() => expect(getByText('About Page')).toBeInTheDocument())
    expect(getByText('This is the about page')).toBeInTheDocument()
    expect(queryByText('Welcome to the home page')).not.toBeInTheDocument()

    // Check cache state after navigation
    const cacheAfterAbout = BaseNode.elementCache.size
    // Header should still be cached, About page should be cached
    // Home page may or may not be cleaned up yet (async cleanup)
    expect(cacheAfterAbout).toBeGreaterThan(0)

    // Navigate back to Home
    fireEvent.click(getByText('Go to Home'))

    // Check Home page is rendered again
    await waitFor(() => expect(getByText('Home Page')).toBeInTheDocument())
    expect(queryByText('This is the about page')).not.toBeInTheDocument()

    // Final cache check
    const finalCacheSize = BaseNode.elementCache.size
    expect(finalCacheSize).toBeGreaterThan(0)
    // Cache should be stable, not growing unbounded
    expect(finalCacheSize).toBeLessThan(initialCacheSize * 3)
  })

  it('should handle programmatic navigation correctly', async () => {
    const HomePage = () => {
      const navigate = useNavigate()
      return Div({
        children: [
          H1('Home'),
          Node(
            'button',
            {
              onClick: () => navigate('/about'),
              children: 'Navigate to About',
            },
            [],
          ).render(),
        ],
      }).render()
    }

    const AboutPage = () => {
      const navigate = useNavigate()
      return Div({
        children: [
          H1('About'),
          Node(
            'button',
            {
              onClick: () => navigate('/'),
              children: 'Navigate to Home',
            },
            [],
          ).render(),
        ],
      }).render()
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: Node(HomePage).render(),
      },
      {
        path: '/about',
        element: Node(AboutPage).render(),
      },
    ])

    const { getByText, queryByText } = render(Node(RouterProvider, { router }).render())

    await waitFor(() => expect(getByText('Home')).toBeInTheDocument())

    // Programmatic navigation
    fireEvent.click(getByText('Navigate to About'))

    await waitFor(() => expect(getByText('About')).toBeInTheDocument())
    expect(queryByText('Home')).not.toBeInTheDocument()

    // Navigate back
    fireEvent.click(getByText('Navigate to Home'))

    await waitFor(() => expect(getByText('Home')).toBeInTheDocument())
    expect(queryByText('About')).not.toBeInTheDocument()

    // Cache should remain stable
    expect(BaseNode.elementCache.size).toBeGreaterThan(0)
  })
})
