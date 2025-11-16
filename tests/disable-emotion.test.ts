import { Div } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)

describe('disableEmotion Prop', () => {
  it('should propagate disableEmotion to children and prevent styling', () => {
    // Create a parent Div with `disableEmotion: true` and two children,
    // one direct Div and one rendered via a function, both with styling props.
    const App = Div({
      disableEmotion: true,
      children: [
        Div({
          'data-testid': 'child1',
          children: 'Child 1',
          backgroundColor: 'red', // This style should be ignored
        }),
        () =>
          Div({
            'data-testid': 'child2',
            children: 'Child 2 (from function)',
            color: 'blue', // This style should be ignored
          }),
      ],
    })

    // Render the component and get utilities to query by test ID.
    const { getByTestId } = render(App.render())

    // Get the first child element.
    const child1 = getByTestId('child1')
    // Assert that the Emotion style was NOT applied due to `disableEmotion`.
    expect(child1).not.toHaveStyleRule('background-color', 'red')

    // Get the second child element.
    const child2 = getByTestId('child2')
    // Assert that the Emotion style was NOT applied due to `disableEmotion`.
    expect(child2).not.toHaveStyleRule('color', 'blue')
  })

  it('should propagate disableEmotion to BaseNode children', () => {
    // Create a ChildNode (Div) with some styling.
    const ChildNode = Div({
      'data-testid': 'child-node',
      children: 'Child Node',
      padding: '10px', // This style should be ignored
    })

    // Create a parent Div with `disableEmotion: true` and the ChildNode as its child.
    const App = Div({
      disableEmotion: true,
      children: ChildNode,
    })

    // Render the component and get a utility to query by test ID.
    const { getByTestId } = render(App.render())
    // Get the child element.
    const child = getByTestId('child-node')
    // Assert that the child is in the document.
    expect(child).toBeInTheDocument()
    // Assert that the Emotion style was NOT applied due to `disableEmotion` propagation.
    expect(child).not.toHaveStyleRule('padding', '10px')
  })
})
