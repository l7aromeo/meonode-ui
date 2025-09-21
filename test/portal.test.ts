import { Button, Div, Node, Portal, type PortalProps } from '@src/main.js'
import { act, cleanup, render } from '@testing-library/react'
import { useState } from 'react'
import { createSerializer, matchers } from '@emotion/jest'
import { usePortal } from '@src/hook/index.js'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM between tests to avoid open handles
afterEach(() => {
  cleanup()
})

describe('Portal System', () => {
  it('should handle dynamic portal creation, update, and unmounting', () => {
    const PortalContent = ({ portal, count, increment, text }: PortalProps<any>) => {
      return Div({
        children: [
          'This is portal content!',
          text,
          Button(`Update Portal (${count})`, {
            onClick: increment,
          }),
          Button('Close Portal', {
            onClick: () => {
              portal.unmount()
            },
          }),
        ],
      }).render()
    }

    const MyPortal = () => {
      const [state, setState] = useState<number>(0)
      const { setPortal, createComponent } = usePortal([state])

      const PortalComp = createComponent(({ portal }) =>
        PortalContent({
          text: `Text prop still passed`,
          count: state,
          increment: () => setState((s: number) => s + 1),
          portal,
        }),
      )

      return Div({
        children: [
          Button('Open Portal', {
            onClick: () => {
              const portal = Portal(PortalComp)()
              setPortal(portal)
            },
          }),
        ],
      }).render()
    }

    const { getByText } = render(Node(MyPortal).render())

    const openPortalTwoButton = getByText('Open Portal')
    expect(openPortalTwoButton).toBeInTheDocument()

    act(() => {
      openPortalTwoButton.click()
    })

    expect(document.body).toHaveTextContent('This is portal content!')

    const updateButton = getByText('Update Portal (0)')
    expect(updateButton).toBeInTheDocument()
    expect(document.body).toHaveTextContent(`Text prop still passed`)
    act(() => {
      updateButton.click()
    })
    expect(document.body).toHaveTextContent('Update Portal (1)')
    expect(document.body).toHaveTextContent(`Text prop still passed`)

    const closeButton = getByText('Close Portal')
    expect(closeButton).toBeInTheDocument()

    act(() => {
      closeButton.click()
    })
    expect(document.body).not.toHaveTextContent('This is portal content!')
  })
})
