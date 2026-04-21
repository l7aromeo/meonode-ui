import type { ReactElement } from 'react'
import { Node, createNode } from '@src/main.js'

interface AsyncProps {
  label: string
}

async function AsyncComponent({ label }: AsyncProps): Promise<ReactElement> {
  return { type: 'div', props: { children: label }, key: null } as unknown as ReactElement
}

// Positive type checks
const asyncNode = Node(AsyncComponent, { label: 'ok' })
const asyncNodeFactory = createNode(AsyncComponent)
const asyncNodeFromFactory = asyncNodeFactory({ label: 'ok' })

void asyncNode
void asyncNodeFromFactory

// Negative type checks
// @ts-expect-error missing required prop
Node(AsyncComponent, {})

// @ts-expect-error wrong prop type
asyncNodeFactory({ label: 123 })
