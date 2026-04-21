'use client'
import { Div, Node } from '@meonode/ui'
import Link from 'next/link'

/**
 * The user's reported workaround: wrap the navbar itself with 'use client'
 * and reference Link via Node(Link) inside. This is consumed from a server
 * page via Node(ClientNavbar).
 */
export default function ClientNavbar() {
  return Div({
    'data-testid': 'client-navbar',
    children: Node(Link, { href: '/', children: 'home' }),
  }).render()
}
