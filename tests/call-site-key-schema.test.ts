// @vitest-environment jsdom
//
// Schema 3 of the compiled marker contract: a call-site key with no `c`/`d`
// buckets.
//
// The plugin can only partition props it can read statically. A conditional, a
// spread, or an object built elsewhere makes it bail — and until now bailing
// threw away the call-site key too, even though that key is a hash of filename
// and span and needs no knowledge of the props at all. So a compiled build
// silently lost collision immunity on exactly those call sites.
//
// Schema 3 emits the key alone. There is no performance benefit: props are
// classified at runtime exactly as an uncompiled call site would be. The point
// is correctness — two structurally identical memoized subtrees written in
// different places stop sharing a cache entry.
//
// The key **prefixes** the computed signature rather than replacing it. That
// distinction is the whole design: replacing it would freeze the key per call
// site, so a memoized node whose props changed but whose `deps` did not would be
// served a stale render where today it gets a fresh one.
import { render, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { Div } from '@src/main.js'
import { BaseNode } from '@src/core.node.js'
import { COMPILED_MARKER, COMPILER_SCHEMA_KEYS } from '@src/constant/common.const.js'

const SK = COMPILER_SCHEMA_KEYS[3]

/** What the plugin emits for an unpartitionable call site: key, nothing else. */
const marked = (site: string, props: Record<string, unknown>) => Div({ [COMPILED_MARKER]: 3, [SK.key]: site, ...props } as never)

afterEach(() => {
  cleanup()
  BaseNode.elementCache.clear()
})

describe('schema 3 — call-site key only', () => {
  it('prefixes the signature instead of replacing it', () => {
    // The load-bearing assertion. Same call site, different props: the
    // signatures must still differ, or memoized nodes go stale on prop changes.
    const a = marked('site-a', { padding: '8px', children: 'hi' })
    const b = marked('site-a', { padding: '99px', children: 'hi' })

    expect(a.signature).not.toBe(b.signature)
    expect(a.signature!.startsWith('site-a:')).toBe(true)
    expect(b.signature!.startsWith('site-a:')).toBe(true)
  })

  it('disambiguates identical props written at different call sites', () => {
    // The reason schema 3 exists.
    const a = marked('site-a', { padding: '8px', children: 'hi' })
    const b = marked('site-b', { padding: '8px', children: 'hi' })

    expect(a.signature).not.toBe(b.signature)
  })

  it('keeps the signature stable for the same call site and props', () => {
    // Memoization has to keep working: identical input must agree, or the cache
    // never hits and schema 3 has quietly disabled it.
    const a = marked('site-a', { padding: '8px', children: 'hi' })
    const b = marked('site-a', { padding: '8px', children: 'hi' })

    expect(a.signature).toBe(b.signature)
  })

  it('ignores children, so content changes do not move the key', () => {
    // The `deps` contract, unchanged by schema 3.
    const a = marked('site-a', { padding: '8px', children: 'AAA' })
    const b = marked('site-a', { padding: '8px', children: 'BBB' })

    expect(a.signature).toBe(b.signature)
  })

  it('classifies props at runtime with no c/d buckets present', () => {
    // Schema 3 carries no partitioning, so everything falls through to the
    // passthrough path and is classified exactly as legacy would.
    const { container } = render(marked('site-a', { padding: '8px', id: 'target', children: 'hi' }).render())
    const el = container.querySelector('#target') as HTMLElement

    expect(el).not.toBeNull()
    // `padding` became an Emotion class, not a DOM attribute.
    expect(el.getAttribute('padding')).toBeNull()
    expect(el.className).toMatch(/css-/)
    expect(el.textContent).toBe('hi')
  })

  it('still folds in an explicit React key', () => {
    const withKey = Div({ [COMPILED_MARKER]: 3, [SK.key]: 'site-a', key: 'k1', padding: '8px' } as never)
    const without = Div({ [COMPILED_MARKER]: 3, [SK.key]: 'site-a', padding: '8px' } as never)

    expect(withKey.signature).toBe(`k1:${without.signature}`)
  })

  it('falls back to the legacy signature when the key is missing', () => {
    // A malformed marker must degrade, not corrupt the key. It does not produce
    // the *same* signature as an unmarked node — the marker prop is part of
    // props and feeds the hash — so what matters is that the result is a normal
    // signature: stable for equal input, discriminating for different input,
    // and carrying no stray prefix.
    const a = Div({ [COMPILED_MARKER]: 3, padding: '8px' } as never)
    const b = Div({ [COMPILED_MARKER]: 3, padding: '8px' } as never)
    const c = Div({ [COMPILED_MARKER]: 3, padding: '99px' } as never)

    expect(a.signature).toBe(b.signature)
    expect(a.signature).not.toBe(c.signature)
    expect(a.signature).not.toContain(':')
  })

  it('fixes the cross-component-boundary collision', () => {
    // The end-to-end payoff, mirroring tests/cross-component-collision.test.ts:
    // two components with structurally identical trees. Uncompiled, the second
    // renders 'AAA'. With a per-call-site key it does not.
    const A = () => marked('site-A', { children: [marked('site-A-child', { padding: '8px', children: 'AAA' }).valueOf()] }).render()
    const B = () => marked('site-B', { children: [marked('site-B-child', { padding: '8px', children: 'BBB' }).valueOf()] }).render()

    const { container } = render(Div({ children: [createElement(A as never), createElement(B as never)] }).render())

    expect(container.textContent).toBe('AAABBB')
  })
})
