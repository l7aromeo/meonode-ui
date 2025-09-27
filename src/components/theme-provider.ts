import { createNode } from '@src/core.node.js'
import _ThemeProvider from '@src/components/theme-provider.client.js'

/**
 * A component that provides a theme to its children.
 */
export const ThemeProvider = createNode(_ThemeProvider)
