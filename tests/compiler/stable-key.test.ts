import { BaseNode } from '@src/core.node.js'
import { NodeUtil } from '@src/util/node.util.js'
import type { NodeProps } from '@src/types/node.type.js'
import { COMPILED_MARKER, setDebugMode } from '@src/constant/common.const.js'

describe('BaseNode._getStableKey — compiled marker fast path', () => {
  it('empty dyn: stableKey equals k with no user key', () => {
    const node = new BaseNode('div', {
      [COMPILED_MARKER]: 1,
      k: 'k-hash-1',
      c: { padding: '1px' },
      d: {},
    } as unknown as Partial<NodeProps>)

    expect(node.stableKey).toBe('k-hash-1')
  })

  it('user key prefix preserved: key + marker -> `${key}:${k}`', () => {
    const node = new BaseNode('div', {
      key: 'user-key',
      [COMPILED_MARKER]: 1,
      k: 'k-hash-2',
    } as unknown as Partial<NodeProps>)

    expect(node.stableKey).toBe('user-key:k-hash-2')
  })

  it('dyn values hashed: same values produce same key, changed value produces different key', () => {
    const makeNode = (color: string) =>
      new BaseNode('div', {
        [COMPILED_MARKER]: 1,
        k: 'k-hash-3',
        dyn: ['backgroundColor'],
        c: { backgroundColor: color },
      } as unknown as Partial<NodeProps>)

    const nodeA = makeNode('red')
    const nodeB = makeNode('red')
    const nodeC = makeNode('blue')

    expect(nodeA.stableKey).toBe(nodeB.stableKey)
    expect(nodeA.stableKey).not.toBe(nodeC.stableKey)
    // Must incorporate the dyn hash, not collapse back to the bare k.
    expect(nodeA.stableKey).not.toBe('k-hash-3')
    expect(nodeA.stableKey?.startsWith('k-hash-3:')).toBe(true)
  })

  it('dyn function value: same function ref is stable, different function body differs', () => {
    const fnA = () => 'a'
    const fnB = () => 'a totally different implementation body'

    const makeNode = (handler: () => unknown) =>
      new BaseNode('button', {
        [COMPILED_MARKER]: 1,
        k: 'k-hash-4',
        dyn: ['onClick'],
        d: { onClick: handler },
      } as unknown as Partial<NodeProps>)

    const nodeSameRefA = makeNode(fnA)
    const nodeSameRefB = makeNode(fnA)
    const nodeDiffBody = makeNode(fnB)

    expect(nodeSameRefA.stableKey).toBe(nodeSameRefB.stableKey)
    expect(nodeSameRefA.stableKey).not.toBe(nodeDiffBody.stableKey)
  })

  it('dyn name resolved from top-level (e.g. theme) affects the key', () => {
    // `theme` (and other MARKER_SPECIAL_KEYS) live at the top level of the marker
    // payload, not nested inside `c`/`d` — the dyn resolver must fall back there.
    const makeNode = (mode: string) =>
      new BaseNode('div', {
        [COMPILED_MARKER]: 1,
        k: 'k-hash-5',
        dyn: ['theme'],
        theme: mode,
      } as unknown as Partial<NodeProps>)

    const nodeLight = makeNode('light')
    const nodeLightAgain = makeNode('light')
    const nodeDark = makeNode('dark')

    expect(nodeLight.stableKey).toBe(nodeLightAgain.stableKey)
    expect(nodeLight.stableKey).not.toBe(nodeDark.stableKey)
    expect(nodeLight.stableKey?.startsWith('k-hash-5:')).toBe(true)
  })

  describe('debug-mode validation of unresolved dyn names', () => {
    afterEach(() => {
      // Restore debug mode so other test files aren't affected by this suite.
      setDebugMode(false)
    })

    it('warns when a dyn name is absent from c, d, and top-level props', () => {
      setDebugMode(true)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const node = new BaseNode('div', {
        [COMPILED_MARKER]: 1,
        k: 'k-hash-6',
        dyn: ['missingProp'],
        c: { padding: '1px' },
      } as unknown as Partial<NodeProps>)

      expect(node.stableKey).toBeDefined()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missingProp'))
      warnSpy.mockRestore()
    })

    it('does not warn when a resolved value is legitimately undefined (own-property check)', () => {
      setDebugMode(true)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      new BaseNode('div', {
        [COMPILED_MARKER]: 1,
        k: 'k-hash-7',
        dyn: ['onClick'],
        d: { onClick: undefined },
      } as unknown as Partial<NodeProps>)

      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  it('element function body does not affect the compiled key (contrast with legacy path)', () => {
    // Same name so `getElementTypeName` (used by the legacy path) can't be what
    // distinguishes them — only `element.toString()` differs.
    const CompA = function Comp() {
      return null
    }
    const CompB = function Comp() {
      return 'different body entirely, quite a bit longer than the other one'
    }

    const markerProps = { [COMPILED_MARKER]: 1, k: 'shared-k' } as unknown as Partial<NodeProps>

    const nodeA = new BaseNode(CompA, markerProps)
    const nodeB = new BaseNode(CompB, markerProps)

    expect(nodeA.stableKey).toBe('shared-k')
    expect(nodeB.stableKey).toBe('shared-k')
    expect(nodeA.stableKey).toBe(nodeB.stableKey)

    // Contrast: without the marker, the legacy path hashes element.toString(),
    // so two components with different bodies (but same name, no props) diverge.
    const legacyA = new BaseNode(CompA, {} as unknown as Partial<NodeProps>)
    const legacyB = new BaseNode(CompB, {} as unknown as Partial<NodeProps>)

    expect(legacyA.stableKey).not.toBe(legacyB.stableKey)
  })

  it('marker without k falls back to the legacy signature path', () => {
    const props = {
      [COMPILED_MARKER]: 1,
      c: { padding: '1px' },
    } as unknown as Partial<NodeProps>

    const node = new BaseNode('div', props)

    const { key, ...rest } = props as Record<string, unknown>
    const expectedSignature = NodeUtil.createPropSignature('div', rest)

    expect(node.stableKey).toBeDefined()
    expect(node.stableKey).toBe(expectedSignature)
  })

  it('uncompiled nodes: legacy signatures are unchanged (regression)', () => {
    const onClick = () => {}
    const propsA = { className: 'foo', onClick } as unknown as Partial<NodeProps>

    const nodeA1 = new BaseNode('div', propsA)
    const nodeA2 = new BaseNode('div', propsA)

    const { key, ...rest } = propsA as Record<string, unknown>
    const expected = NodeUtil.createPropSignature('div', rest)

    expect(nodeA1.stableKey).toBe(expected)
    expect(nodeA2.stableKey).toBe(expected)
  })
})
