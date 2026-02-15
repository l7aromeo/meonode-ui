import { createNode } from '@src/core.node.js'
import _PortalProvider from '@src/components/portal-provider.client.js'

/**
 * A component that provides portal context to its children.
 * Must wrap any components that use `usePortal()` or `PortalHost`.
 */
export const PortalProvider = createNode(_PortalProvider)
