import { render, cleanup } from '@testing-library/react'
import { Node, BaseNode } from '@src/core.node'
import { MountTrackerUtil } from '@src/util/mount-tracker.util'
import React from 'react'

describe('Leak and Cache Integrity Repro', () => {
  beforeEach(() => {
    BaseNode.clearCaches()
    cleanup()
  })

  it('should not leak static keyed nodes', () => {
    // This test verifies that static nodes (nodes with empty dependency arrays)
    // are properly tracked and cleaned up to prevent memory leaks.
    //
    // Key behavior being tested:
    // 1. Static nodes should be registered in the mount tracker when rendered
    // 2. Static nodes must be wrapped with MeoNodeUnmounter to enable cleanup
    // 3. When unmounted, their entries should be removed from the mount tracker
    //
    // Without proper wrapping, the node would remain tracked after unmount,
    // causing a memory leak as the reference would never be released.

    const TestComponent = () => React.createElement('div', null, 'Static')
    const MyNode = Node(TestComponent)

    const { unmount } = render(MyNode.render())

    // Verify the node is tracked while mounted
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(true)

    unmount()

    // Verify the node is properly untracked after unmount (no leak)
    expect(MountTrackerUtil.isMounted(MyNode.stableKey!)).toBe(false)
  })
})
