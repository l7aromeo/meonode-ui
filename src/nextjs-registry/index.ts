import type { NodeElement, NodeInstance } from '@src/node.type'
import _StyleRegistry from '@src/components/registry.client'
import { Node } from '@src/main'

export const StyleRegistry = <E extends NodeElement>(props: { children: NodeInstance<E> }) => Node(_StyleRegistry, props)
