// @vitest-environment jsdom
//
// The one collision class the identity refactor does NOT fix, pinned so its
// boundaries are explicit rather than folklore.
//
// Cache keys are positional, built as `${parentKey}_${index}:${signature}` down
// from the render root. That chain only spans MeoNode's own children. When a
// component returns `Div({...}).render()`, React composes the result and the
// chain restarts — the inner tree has no idea where its component was mounted.
// So two components rendering structurally identical trees compute identical
// keys and share cache entries, and the second renders the first's content.
//
// Two things fix it, both verified here:
//   - `@meonode/compiler`, because `__meo$k` is a source-position hash, so
//     distinct call sites are distinct by construction
//   - an explicit `key` on the root of each component's tree, which folds into
//     the signature via `_withKeyPrefix`
//
// Props are written as plain object literals on purpose. The compiler only
// marks literal call sites; passing a conditional (`Div(cond ? {..} : {..})`)
// makes it bail, the node falls back to a prop-derived signature, and the
// collision returns even in a compiled build. That bailout is asserted below so
// the limit of the compiler's immunity is recorded rather than assumed.
import { it } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import { COMPILED_MARKER } from '@src/constant/common.const.js'

const COMPILED = process.env.MEONODE_COMPILED === '1'

afterEach(() => {
  cleanup()
  BaseNode.elementCache.clear()
})

const PlainA = () => Div({ children: [Div({ padding: '8px', children: 'AAA' }, [])] }, []).render()
const PlainB = () => Div({ children: [Div({ padding: '8px', children: 'BBB' }, [])] }, []).render()

const KeyedA = () => Div({ key: 'a', children: [Div({ padding: '8px', children: 'AAA' }, [])] }, []).render()
const KeyedB = () => Div({ key: 'b', children: [Div({ padding: '8px', children: 'BBB' }, [])] }, []).render()

const mount = (a: () => unknown, b: () => unknown) => Div({ children: [createElement(a as never), createElement(b as never)] })

describe('cross-component-boundary collisions', () => {
  it.skipIf(!COMPILED)('are impossible under the compiler', () => {
    // `__meo$k` differs per call site, so the two trees never share a key.
    const { container } = render(mount(PlainA, PlainB).render())

    expect(container.textContent).toBe('AAABBB')
    expect(BaseNode.elementCache.size).toBe(4)
  })

  it.skipIf(COMPILED)('still occur uncompiled without a key', () => {
    // Documents the limitation honestly. Uncompiled signatures derive from
    // props, so both components produce the same key chain and collide: the
    // second renders 'AAA'. If this ever starts passing, the limitation is
    // gone and the docs recommending `key` should be revisited.
    const { container } = render(mount(PlainA, PlainB).render())

    expect(container.textContent).toBe('AAAAAA')
    expect(BaseNode.elementCache.size).toBe(2)
  })

  it('are fixed by an explicit key on each component root', () => {
    // The documented workaround, and it must hold in both modes.
    const { container } = render(mount(KeyedA, KeyedB).render())

    expect(container.textContent).toBe('AAABBB')
    expect(BaseNode.elementCache.size).toBe(4)
  })

  it.skipIf(!COMPILED)('lose compiler immunity when props are not a literal', () => {
    // The compiler cannot classify a conditional props argument, so it emits no
    // marker and the node keys off props like an uncompiled one. The collision
    // is back even though the build is compiled — which is why `key` remains
    // the general answer rather than "just use the compiler".
    const cond = true
    const CondA = () => Div(cond ? { children: [Div({ padding: '8px', children: 'AAA' }, [])] } : { children: [] }, []).render()
    const CondB = () => Div(cond ? { children: [Div({ padding: '8px', children: 'BBB' }, [])] } : { children: [] }, []).render()

    const probe = Div(cond ? { padding: '8px' } : { padding: '0' })
    expect(COMPILED_MARKER in (probe.rawProps as Record<string, unknown>)).toBe(false)

    const { container } = render(mount(CondA, CondB).render())
    expect(container.textContent).toBe('AAAAAA')
  })
})
