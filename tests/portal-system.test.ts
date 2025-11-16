import { Div, Portal } from '@src/main.js'
import { act, cleanup } from '@testing-library/react'
import { createSerializer, matchers } from '@emotion/jest'

expect.extend(matchers)
expect.addSnapshotSerializer(createSerializer())

// Clean up DOM and caches between tests
afterEach(cleanup)

describe('Portal System', () => {
  it('should render content in a portal and unmount it', () => {
    // Create content for the portal.
    const PortalContent = Div({ children: 'Portal Content' })
    // Create a Portal component factory.
    const MyPortal = Portal(() => PortalContent)

    let portalInstance: any
    // Act: Render the portal content.
    act(() => {
      portalInstance = MyPortal()
    })
    // Assert: The portal content should be in the document body.
    expect(document.body).toHaveTextContent('Portal Content')

    // Act: Unmount the portal content.
    act(() => {
      portalInstance?.unmount()
    })
    // Assert: The portal content should no longer be in the document body.
    expect(document.body).not.toHaveTextContent('Portal Content')
  })
})
