import Link from 'next/link'
import { createNode } from '@meonode/ui'

/**
 * Neutral module (no 'use server' / 'use client' directive) that wraps
 * next/link via createNode.
 *
 * This reproduces the reported defect:
 * - createNode(Link) called from a server page can trigger a client-boundary error
 * - because Link is a client component and the wrapping happens in a module
 *   that Next cannot tag as a client boundary on its own.
 */
export const NextLink = createNode(Link)
