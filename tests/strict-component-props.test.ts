import { Div, Node } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'
import React, { ComponentProps, forwardRef } from 'react'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

afterEach(cleanup)

describe('Strict Component Props', () => {
  it('should allow custom attributes on HTML elements', () => {
    const App = Div({
      'data-testid': 'X',
      children: 'HTML Element',
      'data-custom': 'value', // Should be allowed
      'aria-label': 'test', // Should be allowed
      'random-prop': 'test', // Should be allowed
      alignItems: 'center',
      onClick: () => {},

      // @ts-expect-error - 0 is not a valid value for justifyContent
      justifyContent: 0,
    })

    const { getByText } = render(App.render())
    const element = getByText('HTML Element')
    expect(element).toHaveAttribute('data-custom', 'value')
    expect(element).toHaveAttribute('aria-label', 'test')
    expect(element).toHaveAttribute('random-prop', 'test')
    expect(element).toHaveStyleRule('align-items', 'center')
    expect(element).toHaveStyleRule('justify-content', '0') // Should still pass the invalid style property
  })

  it('should enforce strict props on Components', () => {
    // Component must return a React Element (result of .render())
    const MyComponent = ({ name }: { name: string }) => Div({ children: name }).render()

    // Valid usage
    const ValidApp = Node(MyComponent, { name: 'John' })
    const { getByText } = render(ValidApp.render())
    expect(getByText('John')).toBeInTheDocument()

    // Invalid usage - should cause type error
    const InvalidApp = Node(MyComponent, {
      name: 'Jane',
      // @ts-expect-error - 'typo' is not a valid prop for MyComponent
      typo: 'oops',
    })

    // Runtime behavior should still work (props are passed), but types should fail
    const { getByText: getInvalid } = render(InvalidApp.render())
    expect(getInvalid('Jane')).toBeInTheDocument()
  })

  it('should allow MeoNode specific props on Components', () => {
    const MyComponent = ({ name }: { name: string }) => Div({ children: name }).render()

    const App = Node(MyComponent, {
      name: 'John',
      // These are MeoNode specific props and should be allowed
      disableEmotion: true,
      css: { color: 'red' },
    })

    const { getByText } = render(App.render())
    expect(getByText('John')).toBeInTheDocument()
  })

  it('should enforce strict props on forwardRef components', () => {
    // Create a forwardRef component with specific props
    interface ButtonProps {
      label: string
      variant?: 'primary' | 'secondary'
    }

    const ForwardRefButton = forwardRef<HTMLButtonElement, ComponentProps<'button'> & ButtonProps>(({ label, variant = 'primary', ...props }, ref) => {
      return React.createElement(
        'button',
        {
          ref,
          ...props,
        },
        `${label} (${variant})`,
      )
    })

    // Valid usage with correct props
    const ValidApp = Node(ForwardRefButton, {
      justifyContent: 'center',
      // @ts-expect-error - 0 is not a valid value for alignItems
      alignItems: 0,
      label: 'Click me',
      variant: 'secondary',
    })

    const { getByText } = render(ValidApp.render())
    expect(getByText('Click me (secondary)')).toBeInTheDocument()
    cleanup()

    // Invalid usage - should cause type error
    const InvalidApp = Node(ForwardRefButton, {
      label: 'Invalid',
      // @ts-expect-error - 'invalidProp' is not a valid prop for ForwardRefButton
      invalidProp: 'should fail',
    })

    const { getByText: getInvalid } = render(InvalidApp.render())
    expect(getInvalid('Invalid (primary)')).toBeInTheDocument()
    cleanup()

    // Valid usage with ref
    const ref = { current: null }
    const WithRefApp = Node(ForwardRefButton, {
      ref,
      label: 'With Ref',
    })

    const { getByText: getWithRef } = render(WithRefApp.render())
    expect(getWithRef('With Ref (primary)')).toBeInTheDocument()
    cleanup()

    // Valid usage with ref
    const WithRefAdditionalPropsApp = Node<{ expectString: string; expectNumber: number }, typeof ForwardRefButton>(ForwardRefButton, {
      label: 'With Additional Props Ref App',
      expectString: 'test',
      // @ts-expect-error - 'expectNumber' have invalid expected value type
      expectNumber: 'invalid',
    })

    const { getByText: getWithAdditionalPropsRef } = render(WithRefAdditionalPropsApp.render())
    expect(getWithAdditionalPropsRef('With Additional Props Ref App (primary)')).toBeInTheDocument()
    cleanup()
  })
})
