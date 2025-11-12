import { Button, Div, Node, Portal, Text, type PortalProps, Column } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react' // Added waitFor
import { useState } from 'react'
import { createSerializer, matchers } from '@emotion/jest'
import { createPortal } from 'react-dom'
import { BaseNode } from '@src/core.node.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

afterEach(() => {
  cleanup()
  BaseNode.clearCaches()
})

describe('Portal System', () => {
  it('should handle dynamic portal creation, update, and unmounting', async () => {
    // Made async
    const PortalComp = ({ portal }: PortalProps) => {
      const [state, setState] = useState<number>(0)

      return Column({
        gap: 10,
        children: [
          Text('This is portal content!'),
          Button(`Update Portal (${state})`, {
            onClick: () => setState(c => c + 1),
          }),
          Button('Close Portal', {
            onClick: portal.unmount,
          }),
        ],
      }).render()
    }

    const App = Div({
      children: [
        Button('Open Portal', {
          onClick: () => Portal(PortalComp)(),
        }),
      ],
    }).render()

    const { getByText } = render(App)

    const openPortalButton = getByText('Open Portal')
    expect(openPortalButton).toBeInTheDocument()

    act(() => {
      openPortalButton.click()
    })

    expect(document.body).toHaveTextContent('This is portal content!')

    const updateButton = getByText('Update Portal (0)')
    expect(updateButton).toBeInTheDocument()

    act(() => {
      updateButton.click()
    })

    expect(document.body).toHaveTextContent('Update Portal (1)')

    const closeButton = getByText('Close Portal')
    expect(closeButton).toBeInTheDocument()

    act(() => {
      closeButton.click()
    })

    expect(document.body).not.toHaveTextContent('This is portal content!')
  })

  it('allow portal to be children of node', () => {
    const MyPortal = () => {
      return Div({
        children: [createPortal(Node('div', { children: 'Portal Content' }).render(), document.body)],
      }).render()
    }

    const { getByText } = render(Node(MyPortal).render())
    expect(getByText('Portal Content')).toBeInTheDocument()
  })
})
