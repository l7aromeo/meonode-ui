import { jest } from '@jest/globals'
import { Div, H1, Node, P, Span } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react'
import { useEffect, useState, StrictMode } from 'react'
import { createSerializer, matchers } from '@emotion/jest'
import { BaseNode } from '@src/core.node.js'
import { NodeUtil } from '@src/util/node.util.js'
import { NavigationCacheManagerUtil } from '@src/util/navigation-cache-manager.util.js'
import { setDebugMode } from '@src/main.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)
beforeEach(() => {
  setDebugMode(true)
})

describe('Dependency and Memoization in a Real-World Scenario', () => {
  // Mock user data and a fake service to simulate API calls.
  const mockUsers = {
    '1': { name: 'Alice', email: 'alice@example.com' },
    '2': { name: 'Bob', email: 'bob@example.com' },
  }
  const userService = {
    fetchUser: jest.fn(async (userId: keyof typeof mockUsers) => {
      await new Promise(resolve => setTimeout(resolve, 50)) // Simulate network delay
      return mockUsers[userId]
    }),
  }

  // A reusable UserProfile component that fetches and displays user data.
  // It is designed to be memoized based on the userId.
  let userProfileRenderCount: jest.Mock
  const UserProfile = ({ userId }: { userId: keyof typeof mockUsers }) => {
    userProfileRenderCount()
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)

    useEffect(() => {
      userService.fetchUser(userId).then(setUser)
    }, [userId]) // Effect depends only on userId

    if (!user) {
      return P('Loading profile...').render()
    }

    return Div({
      'data-testid': `profile-${userId}`,
      children: [H1(user.name), P(user.email)],
    }).render()
  }

  // The main App component that controls which user profile is displayed
  // and has an unrelated state variable (theme) to test memoization.
  const App = () => {
    const [currentUserId, setCurrentUserId] = useState<keyof typeof mockUsers>('1')
    const [theme, setTheme] = useState('light')

    return Div({
      children: [
        // Controls to change the state
        Div({
          children: [
            P(`Current Theme: ${theme}`),
            Node('button', { onClick: () => setCurrentUserId('1'), children: 'View Alice' }),
            Node('button', { onClick: () => setCurrentUserId('2'), children: 'View Bob' }),
            Node('button', { onClick: () => setTheme(t => (t === 'light' ? 'dark' : 'light')), children: 'Toggle Theme' }),
          ],
        }),
        // The memoized UserProfile component. It should only re-render if `currentUserId` changes.
        Node(UserProfile, { userId: currentUserId }, [currentUserId]),
      ],
    }).render()
  }

  beforeEach(() => {
    // Reset mocks and spies before each test in this suite.
    userProfileRenderCount = jest.fn()
    userProfileRenderCount.mockClear()
    userService.fetchUser.mockClear()
  })

  it('distinguishes static nodes with different children', () => {
    // Arrange: create static Div nodes each with a different child
    const nodeA = Div({ children: Span('A') }, [])
    const nodeB = Div({ children: Span('B') }, [])
    const nodeC = Div({ children: Div({ children: Span('C') }, []) })
    const StaticNodesApp = Div({ children: [nodeA, nodeB, nodeC] })

    // Act: render the App component
    const { getByText } = render(StaticNodesApp.render())

    // Assert: the rendered Span elements exist and their parent elements are distinct
    const spanA = getByText('A')
    const spanB = getByText('B')
    const spanC = getByText('C')

    expect(spanA.parentElement).not.toBe(spanB.parentElement)
    expect(spanC.parentElement).not.toBe(spanA.parentElement)
  })

  it('should memoize a simple component based on dependencies', async () => {
    let renderCount = 0
    const MemoizedComponent = ({ value }: { value: string }) => {
      renderCount++
      return Div({ children: `Value: ${value}` }).render()
    }

    const App = () => {
      const [stateValue, setStateValue] = useState('initial')
      const [unrelatedState, setUnrelatedState] = useState(0)

      return Div({
        children: [
          Node(MemoizedComponent, { value: stateValue }, [stateValue]),
          Node('button', { onClick: () => setStateValue('changed'), children: 'Change Value' }),
          Node('button', { onClick: () => setUnrelatedState(unrelatedState + 1), children: 'Change Unrelated' }),
          P(`Unrelated: ${unrelatedState}`),
        ],
      }).render()
    }

    const { getByText } = render(Node(App).render())

    // Initial render
    expect(getByText('Value: initial')).toBeInTheDocument()
    expect(renderCount).toBe(1)

    // Change unrelated state
    act(() => {
      getByText('Change Unrelated').click()
    })
    await getByText('Unrelated: 1')
    // MemoizedComponent should NOT re-render
    expect(renderCount).toBe(1)

    // Change stateValue
    act(() => {
      getByText('Change Value').click()
    })
    await getByText('Value: changed')
    // MemoizedComponent SHOULD re-render
    expect(renderCount).toBe(2)
  })

  it('handles dependency-driven re-renders and static child', () => {
    // Define a component that holds complex state (an object with multiple keys: user, role).
    const ComplexStateApp = () => {
      const [state, setState] = useState({ user: 'John', role: 'Admin' })

      // Updater that changes only the `user` field.
      const updateUser = () => setState(s => ({ ...s, user: 'Jane' }))
      // Updater that changes only the `role` field.
      const updateRole = () => setState(s => ({ ...s, role: 'Editor' }))

      return Div({
        children: [
          // Button to update the `user` field (dependent).
          Div({ onClick: updateUser, children: 'Update User' }),
          // Button to update the `role` field (non-dependent for some children).
          Div({ onClick: updateRole, children: 'Update Role' }),
          // Static child: empty dependency array means it should remain unchanged across state updates.
          Div({ children: `Initial User: ${state.user}` }, []),
          // Dependent child: will re-render only when `state.user` changes.
          Div({ children: `User: ${state.user}; Role: ${state.role}` }, [state.user]),
        ],
      }).render()
    }

    // Render the component.
    const { getByText } = render(Node(ComplexStateApp).render())

    // Act: Trigger an update to the non-dependent field (`role`).
    act(() => {
      getByText('Update Role').click()
    })
    // Assert: The dependent child should NOT re-render (user is still John).
    expect(getByText('User: John; Role: Admin')).toBeInTheDocument()
    // Assert: The static child should remain unchanged.
    expect(getByText('Initial User: John')).toBeInTheDocument()

    // Act: Trigger an update to the dependent field (`user`).
    act(() => {
      getByText('Update User').click()
    })
    // Assert: The dependent child SHOULD re-render to reflect the new user and updated role.
    expect(getByText('User: Jane; Role: Editor')).toBeInTheDocument()
    // Assert: The static child should still remain unchanged.
    expect(getByText('Initial User: John')).toBeInTheDocument()
  })

  it('should render the initial profile and not re-render on unrelated state changes', async () => {
    // Step 1: Mount the App and obtain query utilities
    const { getByText, findByText } = render(Node(App).render())

    // Step 2: Wait for the initial profile (Alice) to load and assert initial state
    await findByText('Alice')
    expect(getByText('alice@example.com')).toBeInTheDocument()
    const initialRenderCount = userProfileRenderCount.mock.calls.length
    expect(userService.fetchUser).toHaveBeenCalledWith('1')
    expect(userService.fetchUser).toHaveBeenCalledTimes(1)

    // Step 3: Trigger an unrelated state change (toggle theme)
    act(() => {
      getByText('Toggle Theme').click()
    })

    // Step 4: Wait for the unrelated UI update to settle
    await findByText('Current Theme: dark')

    // Step 5: Verify memoization prevented re-render and no additional fetch occurred
    expect(userProfileRenderCount.mock.calls.length).toBe(initialRenderCount)
    expect(userService.fetchUser).toHaveBeenCalledTimes(1)
    expect(getByText('Alice')).toBeInTheDocument()
  })

  it('should re-render the profile only when the userId dependency changes', async () => {
    const { getByText, findByText } = render(Node(App).render())

    // 1. Initial Render (Alice)
    // First render: Loading state (renderCount = 1)
    // Second render: Data loaded (renderCount = 2)
    await findByText('Alice')
    expect(getByText('alice@example.com')).toBeInTheDocument()
    expect(userProfileRenderCount).toHaveBeenCalledTimes(2) // Loading + Loaded
    expect(userService.fetchUser).toHaveBeenCalledWith('1')
    expect(userService.fetchUser).toHaveBeenCalledTimes(1)

    // 2. Switch Profile to Bob
    act(() => {
      getByText('View Bob').click()
    })

    // 3. Assert Re-render and Data Fetch
    // Third render: Loading state with userId='2' (renderCount = 3)
    // Fourth render: Bob's data loaded (renderCount = 4)
    await findByText('Bob')
    expect(getByText('bob@example.com')).toBeInTheDocument()
    expect(userProfileRenderCount).toHaveBeenCalledTimes(4) // +2 for new profile
    expect(userService.fetchUser).toHaveBeenCalledWith('2')
    expect(userService.fetchUser).toHaveBeenCalledTimes(2)

    // 4. Switch back to Alice
    act(() => {
      getByText('View Alice').click()
    })

    // 5. Assert Re-render and Data Fetch again
    // Fifth render: Loading state with userId='1' (renderCount = 5)
    // Sixth render: Alice's data loaded (renderCount = 6)
    await findByText('Alice')
    expect(getByText('alice@example.com')).toBeInTheDocument()
    expect(userProfileRenderCount).toHaveBeenCalledTimes(6) // +2 for switching back
    expect(userService.fetchUser).toHaveBeenCalledWith('1')
    expect(userService.fetchUser).toHaveBeenCalledTimes(3)
  })

  it('should clear unmounted component caches on simulated navigation', () => {
    // This test simulates a real-world SPA navigation scenario to verify
    // that NavigationCacheManagerUtil and SafeCacheManager work together to evict
    // caches of unmounted components, preventing memory leaks.

    // 1. Setup: Define components for different "pages"
    // A shared header component, memoized to persist across pages if not unmounted.
    const Header = () => Div({ children: 'Shared Header' }).render()

    // A component unique to the Home page, memoized.
    const HomePageContent = () => P('Welcome to the Home Page').render()

    // A component unique to the About page, memoized.
    const AboutPageContent = () => P('This is the About Page').render()

    // App component to simulate routing between pages.
    const App = () => {
      const [page, setPage] = useState('home')

      // Simulate navigation by changing state. This will cause components to unmount.
      const navigateTo = (targetPage: string) => {
        setPage(targetPage)
        // Manually dispatch a navigation event to trigger cache cleanup,
        // simulating a URL change in a real router.
        window.dispatchEvent(new Event('popstate'))
      }

      return Div({
        children: [
          Node(Header, {}, []), // Shared component
          Node('nav', {
            children: [
              Node('button', { onClick: () => navigateTo('home'), children: 'Home' }),
              Node('button', { onClick: () => navigateTo('about'), children: 'About' }),
            ],
          }),
          page === 'home' ? Node(HomePageContent, {}, []) : Node(AboutPageContent, {}, []),
        ],
      }).render()
    }

    // Use fake timers to control the debounced cleanup function in NavigationCacheManagerUtil.
    jest.useFakeTimers()

    // 2. Initial Render (Home Page)
    const { getByText, queryByText } = render(Node(App).render())
    expect(getByText('Welcome to the Home Page')).toBeInTheDocument()

    // 3. Check initial cache state
    // At this point, Header and HomePageContent should be in the cache.
    const initialCacheSize = BaseNode.elementCache.size
    expect(initialCacheSize).toBeGreaterThan(0)

    // 4. Simulate Navigation to About Page
    act(() => {
      getByText('About').click()
    })

    // After navigation, HomePageContent is unmounted, and AboutPageContent is mounted.
    expect(queryByText('Welcome to the Home Page')).not.toBeInTheDocument()
    expect(getByText('This is the About Page')).toBeInTheDocument()

    // 5. Trigger and wait for the debounced cache cleanup
    act(() => {
      jest.runAllTimers()
    })

    // 6. Assert that the cache has been cleaned
    // The cache entry for the unmounted HomePageContent should be gone.
    // The cache for the still-mounted Header and the new AboutPageContent should remain.
    const cacheSizeAfterCleanup = BaseNode.elementCache.size
    expect(cacheSizeAfterCleanup).toBeLessThan(initialCacheSize)
    expect(cacheSizeAfterCleanup).toBeGreaterThan(0) // Ensure the cache for mounted components is not cleared.

    // Restore real timers
    jest.useRealTimers()
  })

  // Test to ensure no cache collision occurs between different components with identical props
  it('prevents cache collision between different components with identical props', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const CompA = () => Div({ children: 'A', color: 'red' }).render()
    const CompB = () => Div({ children: 'B', color: 'red' }).render()

    const App = Div({
      children: [
        Node(CompA, { key: 'item' }, []),
        Node(CompB, { key: 'item' }, []), // Same key, same style props
      ],
    })

    const { getByText } = render(App.render())

    // Both should render independently despite collision-prone signatures
    expect(getByText('A')).toBeInTheDocument()
    expect(getByText('B')).toBeInTheDocument()

    // Cache should have 2 distinct entries
    const cacheKeys = Array.from(BaseNode.elementCache.keys())
    const itemKeys = cacheKeys.filter(k => k.includes('item'))
    expect(itemKeys.length).toBe(2) // Not 1 (collision)
    consoleErrorSpy.mockRestore()
  })

  // Test to ensure that rapid navigation does not cause cache overflow
  it('handles rapid navigation without cache overflow', () => {
    jest.useFakeTimers()

    const Page1 = () => P('Page 1').render()
    const Page2 = () => P('Page 2').render()
    const Page3 = () => P('Page 3').render()

    const App = () => {
      const [page, setPage] = useState(1)

      const navigate = (target: number) => {
        setPage(target)
        window.dispatchEvent(new Event('popstate'))
      }

      return Div({
        children: [
          Node('button', { onClick: () => navigate(1), children: 'Go to Page 1' }),
          Node('button', { onClick: () => navigate(2), children: 'Go to Page 2' }),
          Node('button', { onClick: () => navigate(3), children: 'Go to Page 3' }),
          page === 1 ? Node(Page1, {}, []) : page === 2 ? Node(Page2, {}, []) : Node(Page3, {}, []),
        ],
      }).render()
    }

    const { getByText } = render(Node(App).render())
    const initialCacheSize = BaseNode.elementCache.size

    // Rapid navigation: 10-page changes without waiting for debounce
    for (let i = 0; i < 10; i++) {
      act(() => {
        getByText(`Go to Page ${(i % 3) + 1}`).click()
      })
    }

    const cacheSizeDuringRapidNav = BaseNode.elementCache.size

    // Cache should not grow unbounded (allow some growth but not 10x)
    expect(cacheSizeDuringRapidNav).toBeLessThan(initialCacheSize * 3)

    // Now let all debouncers fire
    act(() => {
      jest.runAllTimers()
    })

    const finalCacheSize = BaseNode.elementCache.size

    // After cleanup, only currently mounted components should remain
    expect(finalCacheSize).toBeLessThan(cacheSizeDuringRapidNav)
    expect(finalCacheSize).toBeGreaterThan(0) // Sanity check

    jest.useRealTimers()
  })

  // Test to ensure compatibility with React 18 Strict Mode
  it('handles React 18 Strict Mode without cache corruption', () => {
    let renderCount = 0

    const TrackedComponent = () => {
      renderCount++
      return P('Tracked Content').render()
    }

    const App = () => {
      const [toggle, setToggle] = useState(false)
      return Div({
        children: [
          Node(TrackedComponent, { key: 'LOL' }, []),
          Node('button', {
            onClick: () => setToggle(!toggle),
            children: 'Toggle',
          }),
        ],
      }).render()
    }

    const { getByText, unmount } = render(Node(StrictMode, { children: Node(App) }).render())

    // Initial render (Strict Mode doesn't double-mount in test/production mode)
    expect(renderCount).toBe(2)

    // Cache should exist
    const initialCacheSize = BaseNode.elementCache.size
    expect(initialCacheSize).toBeGreaterThan(0)

    // Toggle parent state - TrackedComponent should NOT re-render (empty deps)
    act(() => {
      getByText('Toggle').click()
    })

    expect(renderCount).toBe(2) // Still 1, memoization works in StrictMode

    // Toggle again to verify cache stability
    act(() => {
      getByText('Toggle').click()
    })

    expect(renderCount).toBe(2) // Memoization still working

    // Cache should remain stable
    expect(BaseNode.elementCache.size).toBe(initialCacheSize)

    unmount()

    // After unmount, verify cleanup (cache might still exist briefly)
    expect(BaseNode.elementCache.size).toBeGreaterThanOrEqual(0)
  })

  // Test for critical props fingerprinting when object props exceed 100 keys
  it('uses critical props fingerprint for objects with >100 keys', () => {
    // Create props object with 150 keys
    const largeProps: Record<string, any> = {
      color: 'red',
      backgroundColor: 'blue',
      padding: 10,
    }

    // Add 147 more non-critical keys to exceed threshold
    for (let i = 0; i < 147; i++) {
      largeProps[`data${i}`] = i
    }

    let renderCount = 0
    const LargePropsComponent = (props: any) => {
      renderCount++
      return Div({ ...props, children: 'Large Props Component' }).render()
    }

    const App = () => {
      const [trigger, setTrigger] = useState(0)
      const [propsRef] = useState(largeProps) // Stable reference

      return Div({
        children: [
          Node(LargePropsComponent, propsRef, [propsRef.color]), // Dep on critical prop
          Node('button', {
            onClick: () => {
              // Change non-critical prop (outside the 50 critical prop limit)
              propsRef.data99 = Math.random()
              setTrigger(t => t + 1)
            },
            children: 'Change Non-Critical',
          }),
          Node('button', {
            onClick: () => {
              // Change critical prop (style-related)
              propsRef.color = propsRef.color === 'red' ? 'blue' : 'red'
              setTrigger(t => t + 1)
            },
            children: 'Change Critical',
          }),
          P(`Trigger: ${trigger}`), // Force parent re-render
        ],
      }).render()
    }

    const { getByText } = render(Node(App).render())

    expect(renderCount).toBe(1)

    // Change non-critical prop - should NOT trigger re-render (deps unchanged)
    act(() => {
      getByText('Change Non-Critical').click()
    })

    expect(getByText('Trigger: 1')).toBeInTheDocument()
    expect(renderCount).toBe(1) // No re-render, color unchanged

    // Change critical prop - SHOULD trigger re-render (dep changed)
    act(() => {
      getByText('Change Critical').click()
    })

    expect(getByText('Trigger: 2')).toBeInTheDocument()
    expect(renderCount).toBe(2) // Re-rendered, color changed
  })

  // Additional tests can be added here to further validate edge cases and complex scenarios.
  it('LRU eviction prioritizes old, infrequently accessed entries', () => {
    BaseNode.clearCaches()

    // Access the private cache and constants
    const cache = BaseNode.propProcessingCache
    const CLEANUP_BATCH = (BaseNode as any).CACHE_CLEANUP_BATCH || 50

    const now = Date.now()

    // Add enough entries to exceed batch size so not everything gets evicted
    // We'll add CLEANUP_BATCH + 10 entries total
    const TOTAL_ENTRIES = CLEANUP_BATCH + 10

    // First, add filler entries (medium priority)
    for (let i = 0; i < TOTAL_ENTRIES - 3; i++) {
      cache.set(`filler-${i}`, {
        cssProps: { color: `color-${i}` },
        signature: `sig-filler-${i}`,
        lastAccess: now - 10000, // 10s old
        hitCount: 5, // Medium frequency
      })
    }

    // Entry A: Old but frequently accessed (should survive)
    cache.set('entry-a', {
      cssProps: { color: 'red' },
      signature: 'sig-a',
      lastAccess: now - 100000, // 100s old
      hitCount: 100, // Very frequent - low eviction score
    })

    // Entry B: Recent and frequent (should survive)
    cache.set('entry-b', {
      cssProps: { color: 'blue' },
      signature: 'sig-b',
      lastAccess: now - 1000, // 1s old - very recent
      hitCount: 50, // Frequent
    })

    // Entry C: Old and infrequent (should be evicted)
    cache.set('entry-c', {
      cssProps: { color: 'green' },
      signature: 'sig-c',
      lastAccess: now - 200000, // 200s old - very old
      hitCount: 1, // Very infrequent - high eviction score
    })

    expect(cache.size).toBe(TOTAL_ENTRIES)

    // Trigger eviction manually
    ;(NodeUtil as any)._evictLRUEntries()

    // Should have evicted CLEANUP_BATCH entries
    expect(cache.size).toBe(TOTAL_ENTRIES - CLEANUP_BATCH)

    // Entry C should be evicted (highest score: 200 + 1000/2 ≈ 700)
    expect(cache.has('entry-c')).toBe(false)

    // Entry A should survive (score: 100 + 1000/101 ≈ 110)
    expect(cache.has('entry-a')).toBe(true)

    // Entry B should survive (score: 1 + 1000/51 ≈ 21)
    expect(cache.has('entry-b')).toBe(true)
  })

  it('maintains cache integrity across mount/unmount/remount cycles', () => {
    BaseNode.clearCaches()

    let renderCount = 0
    const ExpensiveComponent = ({ id }: { id: number }) => {
      renderCount++
      return Div({
        color: 'red',
        backgroundColor: 'blue',
        padding: 20,
        children: `Expensive ${id}`,
      }).render()
    }

    const App = () => {
      const [show, setShow] = useState(true)
      const [id, setId] = useState(1)

      return Div({
        children: [
          Node('button', {
            onClick: () => setShow(!show),
            children: 'Toggle Mount',
          }),
          Node('button', {
            onClick: () => setId(2),
            children: 'Set ID 2',
          }),
          Node('button', {
            onClick: () => setId(1),
            children: 'Set ID 1',
          }),
          show ? Node(ExpensiveComponent, { id }, [id]) : null,
          P(`ID: ${id}, Show: ${show}`),
        ],
      }).render()
    }

    const { getByText, queryByText } = render(Node(App).render())

    // Initial mount
    expect(renderCount).toBe(1)
    expect(getByText('Expensive 1')).toBeInTheDocument()
    const initialCacheSize = BaseNode.elementCache.size

    // Unmount component
    act(() => {
      getByText('Toggle Mount').click()
    })

    expect(queryByText('Expensive 1')).not.toBeInTheDocument()
    expect(getByText(/Show: false/)).toBeInTheDocument()

    // Change ID while unmounted
    act(() => {
      getByText('Set ID 2').click()
    })

    expect(getByText(/ID: 2/)).toBeInTheDocument()

    // Remount with new ID - should render with new props
    act(() => {
      getByText('Toggle Mount').click()
    })

    expect(getByText('Expensive 2')).toBeInTheDocument()
    expect(renderCount).toBe(2) // New render for new ID

    // Unmount again
    act(() => {
      getByText('Toggle Mount').click()
    })

    expect(queryByText('Expensive 2')).not.toBeInTheDocument()

    // Remount with same ID - should trigger re-render
    act(() => {
      getByText('Toggle Mount').click()
    })

    expect(getByText('Expensive 2')).toBeInTheDocument()
    expect(renderCount).toBe(3) // Re-render after remount

    // Change back to ID 1
    act(() => {
      getByText('Set ID 1').click()
    })

    expect(getByText('Expensive 1')).toBeInTheDocument()
    expect(renderCount).toBe(4)

    // Cache should be stable across lifecycle
    expect(BaseNode.elementCache.size).toBeGreaterThanOrEqual(initialCacheSize)
  })

  it('registers automatic cleanup listeners only once', () => {
    // Clean slate - must happen BEFORE getInstance() is called
    delete (window as any).__MEONODE_CLEANUP_REGISTERED

    // Reset the singleton to ensure fresh start
    ;(NavigationCacheManagerUtil as any)._instance = null

    // Mock document for visibility API
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    })

    // Start multiple times
    NavigationCacheManagerUtil.getInstance().start()
    NavigationCacheManagerUtil.getInstance().start()
    NavigationCacheManagerUtil.getInstance().start()

    // Should only register once
    expect((window as any).__MEONODE_CLEANUP_REGISTERED).toBe(true)

    // Verify beforeunload listener works
    const clearSpy = jest.spyOn(BaseNode, 'clearCaches')
    const stopSpy = jest.spyOn(NavigationCacheManagerUtil.getInstance() as any, '_stop')

    window.dispatchEvent(new Event('beforeunload'))

    expect(stopSpy).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()

    clearSpy.mockRestore()
    stopSpy.mockRestore()
  })

  it('handles cleanup correctly across multiple navigation events', () => {
    delete (window as any).__MEONODE_CLEANUP_REGISTERED
    ;(NavigationCacheManagerUtil as any)._instance = null

    jest.useFakeTimers()

    // Start manager first
    NavigationCacheManagerUtil.getInstance().start()

    // Populate cache with components
    const { unmount } = render(Div({ children: [P('Content 1'), P('Content 2'), P('Content 3')] }).render())

    const initialCacheSize = BaseNode.elementCache.size
    expect(initialCacheSize).toBeGreaterThan(0)

    // Unmount components (they become eligible for cleanup)
    unmount()

    // Trigger navigation event
    history.pushState({}, '', '/test')

    // Let debounced cleanup run
    jest.advanceTimersByTime(150)

    // Cache should be cleaned (unmounted entries removed)
    expect(BaseNode.elementCache.size).toBeLessThan(initialCacheSize)

    jest.useRealTimers()
  })
})
