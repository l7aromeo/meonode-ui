import { createNode } from '@src/core.node.js'
import _PortalHost from '@src/components/portal-host.client.js'

/**
 * Renders the portal stack. Place this where portal layers should appear in the DOM.
 * Must be used within a `PortalProvider`.
 */
export const PortalHost = createNode(_PortalHost)
