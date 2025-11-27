import { render, cleanup, act } from '@testing-library/react'
import { Node, BaseNode } from '@src/core.node'
import { MountTrackerUtil } from '@src/util/mount-tracker.util'
import React, { useState } from 'react'

describe('Leak and Cache Integrity Repro', () => {
  beforeEach(() => {
    BaseNode.clearCaches()
    cleanup()
  })

  it('should not leak static keyed nodes', () => {
    const TestComponent = () => React.createElement('div', null, 'Static')
    // Static node (no deps), but has key.
    // Current code tracks it (line 275) but doesn't wrap it (line 461).
    const MyNode = Node(TestComponent, { stableKey: 'static-node' })

    const { unmount } = render(MyNode.render())

    // It should be tracked because of line 275
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(true)

    unmount()

    // It should be untracked. If not wrapped, it won't be.
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(false)
  })

  it('should maintain cache across updates', () => {
    let renderCount = 0
    const Expensive = () => {
      renderCount++
      return React.createElement('div', null, 'Expensive')
    }

    // Create node outside to access stableKey
    const expensiveNode = Node(Expensive, {}, [])

    const App = () => {
      const [, setCount] = useState(0)
      return React.createElement('div', null, expensiveNode.render(), React.createElement('button', { onClick: () => setCount(c => c + 1) }, 'Update'))
    }

    const { getByText } = render(Node(App).render())

    expect(renderCount).toBe(1)
    expect(BaseNode.elementCache.has(expensiveNode.stableKey!)).toBe(true)

    // Trigger update
    act(() => {
      getByText('Update').click()
    })

    // Should hit cache and NOT re-render
    // If fast return path returns unwrapped element, wrapper unmounts -> deletes cache.
    // So next render (this one) will be a cache MISS if cache was deleted.
    // If cache was preserved, it should be 1.
    expect(renderCount).toBe(1)

    // Cache should still exist
    expect(BaseNode.elementCache.has(expensiveNode.stableKey!)).toBe(true)
  })
})
