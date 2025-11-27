import { BaseNode } from '@src/core.node'
import { NodeUtil } from '@src/util/node.util'
import { render, cleanup } from '@testing-library/react'
import { Node } from '@src/core.node'
import { MountTrackerUtil } from '@src/util/mount-tracker.util'
import React from 'react'

describe('Props Caching Memory Leak Check', () => {
  beforeEach(() => {
    BaseNode.clearCaches()
  })

  it('should respect cache limits under high load', async () => {
    const limit = 500 // NodeUtil.CACHE_SIZE_LIMIT
    const totalItems = 2000

    // Simulate adding many unique items
    for (let i = 0; i < totalItems; i++) {
      const props = {
        uniqueId: `id-${i}`,
        someValue: Math.random(),
        // Add enough keys to ensure unique signature
        [`key-${i}`]: i,
      }

      // This triggers processProps -> createPropSignature -> getCachedCssProps
      // which populates propProcessingCache
      NodeUtil.processProps('div', props)
    }

    // Check size immediately after loop
    const initialSize = BaseNode.propProcessingCache.size
    console.log(`Cache size after ${totalItems} additions: ${initialSize}`)

    // Wait for async cleanup (setTimeout 100ms in NodeUtil)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check size after cleanup
    const sizeAfterCleanup = BaseNode.propProcessingCache.size
    console.log(`Cache size after cleanup: ${sizeAfterCleanup}`)

    // The current implementation should clean up effectively
    // We expect size to be close to limit (limit + buffer)
    expect(sizeAfterCleanup).toBeLessThanOrEqual(limit + 100)
  })
})

describe('MeoNodeUnmounter Leak Check', () => {
  beforeEach(() => {
    BaseNode.clearCaches()
    cleanup() // Clean up RTL
  })

  it('should untrack mounted nodes even when cached', () => {
    const TestComponent = () => React.createElement('div', null, 'Hello')
    // Pass deps as 3rd argument to enable caching
    const MyNode = Node(TestComponent, { stableKey: 'test-node' }, [])

    // First render
    const { unmount } = render(MyNode.render())

    // Check if tracked
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(true)

    // Unmount
    unmount()
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(false)

    // Second render (should hit cache)
    // We need a new instance with same stableKey to simulate re-render or navigation back
    const MyNode2 = Node(TestComponent, { stableKey: 'test-node' }, [])

    const { unmount: unmount2 } = render(MyNode2.render())

    // Check if tracked
    expect(MountTrackerUtil.isMounted(MyNode2.stableKey!)).toBe(true)

    // Unmount
    unmount2()

    // If bug exists, this will fail (it will still be true)
    // Because the cached element didn't have MeoNodeUnmounter wrapper
    expect(MountTrackerUtil.isMounted(MyNode2.stableKey!)).toBe(false)
  })
})
