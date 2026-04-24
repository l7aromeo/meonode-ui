'use client'
import { Div } from '@meonode/ui'
import Link from 'next/link'

export default function Page() {
  const directLinkElement = Link({ href: '/', children: 'direct-link-call-client' })

  return Div({
    'data-testid': 'next-link-direct-call-client-page',
    children: directLinkElement,
  }).render()
}
