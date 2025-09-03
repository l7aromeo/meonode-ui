import type { NodeElement, NodeInstance } from '@src/node.type.js'
import _StyleRegistry from '@src/components/registry.client.js'
import { Node } from '@src/main.js'

export const StyleRegistry = <E extends NodeElement>(props: { children: NodeInstance<E> }) => Node(_StyleRegistry, props)
