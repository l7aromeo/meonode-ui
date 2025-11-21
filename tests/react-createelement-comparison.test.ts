import React from 'react'
import { render } from '@testing-library/react'
import { Column } from '@src/main.js'
import Table from 'cli-table3'

// Helper function to measure render time and memory
async function measureInitialPerformance(element: React.ReactNode, options?: { iterations?: number; warmups?: number }) {
  const iterations = options?.iterations ?? 4
  const warmups = options?.warmups ?? 1

  if (global.gc) {
    global.gc()
  }

  for (let i = 0; i < warmups; i++) {
    const w = render(element)
    w.unmount()
  }

  const times: number[] = []
  const memories: number[] = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    const r = render(element)
    const mem0 = process.memoryUsage().heapUsed
    const t1 = performance.now()
    times.push(t1 - t0)
    memories.push(mem0)
    r.unmount()
  }

  const sortedTimes = [...times].sort((a, b) => a - b)
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]

  const sortedMemories = [...memories].sort((a, b) => a - b)
  const medianMemory = sortedMemories[Math.floor(sortedMemories.length / 2)]

  return { medianTime, medianMemory }
}

// Helper function to measure memory usage after state updates
async function measureMemoryOnUpdate(element: React.ReactElement, options?: { stateChanges?: number; iterations?: number; warmups?: number }) {
  const stateChanges = options?.stateChanges ?? 100
  const iterations = options?.iterations ?? 3
  const warmups = options?.warmups ?? 1

  if (global.gc) {
    global.gc()
  }

  const memories: number[] = []

  for (let i = 0; i < iterations + warmups; i++) {
    const { rerender, unmount } = render(element)

    for (let j = 0; j < stateChanges; j++) {
      // Re-render with a changing prop to simulate state updates
      rerender(React.cloneElement<any>(element, { 'data-state': j }))
    }

    if (i >= warmups) {
      memories.push(process.memoryUsage().heapUsed)
    }
    unmount()
  }

  const sorted = [...memories].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  return median
}

describe('React.createElement vs MeoNode Comparison', () => {
  const NUM_NODES = 5000 // Test with 5000 nodes for nested structures
  // Table to store results - will be created fresh for the final output
  let resultsTable: Table.Table

  it('should compare 10,000 flat nodes between React.createElement and MeoNode', async () => {
    // This test still uses 10,000 nodes as flat structures are less prone to stack overflow
    const NUM_NODES_FLAT = 10000

    // React.createElement implementation (with basic div)
    const createReactElementFlatNodes = () => {
      const children = []
      for (let i = 0; i < NUM_NODES_FLAT; i++) {
        children.push(React.createElement('div', { key: i }, `Node ${i}`))
      }
      return React.createElement('div', null, ...children)
    }

    // React.createElement implementation with additional props (similar to MeoNode's processing)
    const createReactElementFlatNodesWithProps = () => {
      const children = []
      for (let i = 0; i < NUM_NODES_FLAT; i++) {
        children.push(React.createElement('div', { key: i, style: { color: 'black' } }, `Node ${i}`))
      }
      return React.createElement('div', null, ...children)
    }

    // MeoNode implementation (basic)
    const createMeoNodeFlatNodes = () => {
      const children = []
      for (let i = 0; i < NUM_NODES_FLAT; i++) {
        children.push(Column({ children: `Node ${i}` }))
      }
      return Column({ children }).render()
    }

    // MeoNode implementation with additional props (similar complexity to styled elements)
    const createMeoNodeFlatNodesWithProps = () => {
      const children = []
      for (let i = 0; i < NUM_NODES_FLAT; i++) {
        children.push(Column({ children: `Node ${i}`, color: 'black', padding: '4px' }))
      }
      return Column({ children, margin: '8px' }).render()
    }

    // Measure React.createElement performance (basic)
    const reactElementResult = await measureInitialPerformance(createReactElementFlatNodes(), { iterations: 3, warmups: 1 })
    const reactMemoryUpdate = await measureMemoryOnUpdate(createReactElementFlatNodes(), { stateChanges: 100 })

    // Measure React.createElement performance (with props)
    const reactElementWithPropsResult = await measureInitialPerformance(createReactElementFlatNodesWithProps(), {
      iterations: 3,
      warmups: 1,
    })
    const reactWithPropsMemoryUpdate = await measureMemoryOnUpdate(createReactElementFlatNodesWithProps(), { stateChanges: 100 })

    // Measure MeoNode performance (basic)
    const meoNodeResult = await measureInitialPerformance(createMeoNodeFlatNodes(), { iterations: 3, warmups: 1 })
    const meoNodeMemoryUpdate = await measureMemoryOnUpdate(createMeoNodeFlatNodes(), { stateChanges: 100 })

    // Measure MeoNode performance (with props)
    const meoNodeWithPropsResult = await measureInitialPerformance(createMeoNodeFlatNodesWithProps(), {
      iterations: 3,
      warmups: 1,
    })
    const meoNodeWithPropsMemoryUpdate = await measureMemoryOnUpdate(createMeoNodeFlatNodesWithProps(), {
      stateChanges: 100,
    })

    // Create table with title in first row
    resultsTable = new Table({
      colWidths: [25, 25, 15, 20, 25],
    })

    // Add main title as first row
    resultsTable.push([{ content: 'React.createElement vs MeoNode Performance Comparison', colSpan: 5, hAlign: 'center' }])
    resultsTable.push(['Test Type', 'Implementation', 'Time (ms)', 'Initial Mem (MB)', 'Mem @ 100 Updates (MB)'])

    // Add to results table
    resultsTable.push([
      '10k Flat Nodes',
      'React.createElement',
      reactElementResult.medianTime.toFixed(2),
      (reactElementResult.medianMemory / 1024 / 1024).toFixed(2),
      (reactMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '10k Flat Nodes',
      'React.createElement+Props',
      reactElementWithPropsResult.medianTime.toFixed(2),
      (reactElementWithPropsResult.medianMemory / 1024 / 1024).toFixed(2),
      (reactWithPropsMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '10k Flat Nodes',
      'MeoNode',
      meoNodeResult.medianTime.toFixed(2),
      (meoNodeResult.medianMemory / 1024 / 1024).toFixed(2),
      (meoNodeMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '10k Flat Nodes',
      'MeoNode+Props',
      meoNodeWithPropsResult.medianTime.toFixed(2),
      (meoNodeWithPropsResult.medianMemory / 1024 / 1024).toFixed(2),
      (meoNodeWithPropsMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
  })

  it('should compare 5,000 nested nodes between React.createElement and MeoNode', async () => {
    // React.createElement implementation (deeply nested)
    const createReactElementNestedNodes = () => {
      let nestedNode = React.createElement('div', null, `Deepest Node`)
      for (let i = 0; i < NUM_NODES - 1; i++) {
        nestedNode = React.createElement('div', null, nestedNode)
      }
      return nestedNode
    }

    // React.createElement implementation with props (deeply nested)
    const createReactElementNestedNodesWithProps = () => {
      let nestedNode = React.createElement('div', { style: { color: 'black' } }, `Deepest Node`)
      for (let i = 0; i < NUM_NODES - 1; i++) {
        nestedNode = React.createElement('div', { style: { color: 'black' } }, nestedNode)
      }
      return nestedNode
    }

    // MeoNode implementation (deeply nested)
    const createMeoNodeNestedNodes = () => {
      let nestedNode = Column({ children: `Deepest Node` })
      for (let i = 0; i < NUM_NODES - 1; i++) {
        nestedNode = Column({ children: nestedNode })
      }
      return nestedNode.render()
    }

    // MeoNode implementation with props (deeply nested)
    const createMeoNodeNestedNodesWithProps = () => {
      let nestedNode = Column({ children: `Deepest Node`, color: 'black' })
      for (let i = 0; i < NUM_NODES - 1; i++) {
        nestedNode = Column({ children: nestedNode, color: 'black' })
      }
      return nestedNode.render()
    }

    // Measure React.createElement performance (basic)
    const reactElementResult = await measureInitialPerformance(createReactElementNestedNodes(), {
      iterations: 3,
      warmups: 1,
    })
    const reactMemoryUpdate = await measureMemoryOnUpdate(createReactElementNestedNodes(), { stateChanges: 100 })

    // Measure React.createElement performance (with props)
    const reactElementWithPropsResult = await measureInitialPerformance(createReactElementNestedNodesWithProps(), {
      iterations: 3,
      warmups: 1,
    })
    const reactWithPropsMemoryUpdate = await measureMemoryOnUpdate(createReactElementNestedNodesWithProps(), {
      stateChanges: 100,
    })

    // Measure MeoNode performance (basic)
    const meoNodeResult = await measureInitialPerformance(createMeoNodeNestedNodes(), { iterations: 3, warmups: 1 })
    const meoNodeMemoryUpdate = await measureMemoryOnUpdate(createMeoNodeNestedNodes(), { stateChanges: 100 })

    // Measure MeoNode performance (with props)
    const meoNodeWithPropsResult = await measureInitialPerformance(createMeoNodeNestedNodesWithProps(), {
      iterations: 3,
      warmups: 1,
    })
    const meoNodeWithPropsMemoryUpdate = await measureMemoryOnUpdate(createMeoNodeNestedNodesWithProps(), {
      stateChanges: 100,
    })

    // Add nested results to the table that was already started in the previous test
    resultsTable.push([
      '5k Nested Nodes',
      'React.createElement',
      reactElementResult.medianTime.toFixed(2),
      (reactElementResult.medianMemory / 1024 / 1024).toFixed(2),
      (reactMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '5k Nested Nodes',
      'React.createElement+Props',
      reactElementWithPropsResult.medianTime.toFixed(2),
      (reactElementWithPropsResult.medianMemory / 1024 / 1024).toFixed(2),
      (reactWithPropsMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '5k Nested Nodes',
      'MeoNode',
      meoNodeResult.medianTime.toFixed(2),
      (meoNodeResult.medianMemory / 1024 / 1024).toFixed(2),
      (meoNodeMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
    resultsTable.push([
      '5k Nested Nodes',
      'MeoNode+Props',
      meoNodeWithPropsResult.medianTime.toFixed(2),
      (meoNodeWithPropsResult.medianMemory / 1024 / 1024).toFixed(2),
      (meoNodeWithPropsMemoryUpdate / 1024 / 1024).toFixed(2),
    ])
  })

  afterAll(() => {
    // Make sure garbage collection is available for memory measurements
    if (!global.gc) {
      console.log('Warning: Garbage collection is not exposed. Memory measurements may be inaccurate.')
      console.log('Run tests with "--expose-gc" flag through node.')
    }
    console.log('\nFinal Comparison Results:')
    console.log(resultsTable.toString())
  })
})
