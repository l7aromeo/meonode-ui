'use client'
import Link from 'next/link'
import { createNode } from '@meonode/ui'

/**
 * Explicitly marked 'use client' module that wraps next/link via createNode.
 * The expected workaround path for the bug documented in link-factory-neutral.
 */
export const NextLinkClient = createNode(Link)
