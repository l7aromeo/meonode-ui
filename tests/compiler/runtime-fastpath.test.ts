import { NodeUtil } from '@src/util/node.util.js'
import type { NodeProps } from '@src/types/node.type.js'
import { COMPILED_MARKER, setDebugMode } from '@src/constant/common.const.js'

// Clean up caches between tests (mirrors convention used across the suite).
afterEach(() => {
  // no-op: processProps is a pure function w.r.t. these inputs, nothing to clean here.
})

describe('NodeUtil.processProps — compiled marker fast path', () => {
  it('marker schema 1 produces FinalNodeProps deep-equal to legacy path', () => {
    const onClick = () => {}

    const legacyProps = {
      padding: '20px',
      backgroundColor: 'red',
      onClick,
      id: 'x',
    } as unknown as Partial<NodeProps>

    const markerProps = {
      [COMPILED_MARKER]: 1,
      c: { padding: '20px', backgroundColor: 'red' },
      d: { onClick, id: 'x' },
    } as unknown as Partial<NodeProps>

    const legacyResult = NodeUtil.processProps(legacyProps)
    const markerResult = NodeUtil.processProps(markerProps)

    expect(markerResult).toEqual(legacyResult)
  })

  it('non-contract top-level keys (as, theme) pass through unchanged, deep-equal to legacy', () => {
    // `as` (polymorphic element target) and `theme` are read directly off FinalNodeProps
    // elsewhere (core.node.ts) and must survive the fast path exactly like they survive
    // getDOMProps(restRawProps) in the legacy pipeline — the compiler never buckets them
    // into `c`/`d` since they aren't CSS or ordinary DOM props.
    const theme = { mode: 'light', system: {} }

    const legacyProps = {
      padding: '20px',
      as: 'button',
      theme,
    } as unknown as Partial<NodeProps>

    const markerProps = {
      [COMPILED_MARKER]: 1,
      c: { padding: '20px' },
      as: 'button',
      theme,
    } as unknown as Partial<NodeProps>

    const legacyResult = NodeUtil.processProps(legacyProps)
    const markerResult = NodeUtil.processProps(markerProps)

    expect(markerResult).toEqual(legacyResult)
    expect(markerResult.as).toBe('button')
    expect(markerResult.theme).toBe(theme)
  })

  it('merge order preserved: explicit css prop overrides partitioned c bucket', () => {
    const markerProps = {
      [COMPILED_MARKER]: 1,
      c: { padding: '1px' },
      css: { padding: '2px' },
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(markerProps)

    expect(result.css).toEqual({ padding: '2px' })
  })

  it('unknown schema ignored: falls through to legacy processing untouched', () => {
    const onClick = () => {}
    const rawProps = {
      [COMPILED_MARKER]: 99,
      c: { padding: '1px' },
      d: { onClick },
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(rawProps)

    // Unsupported schema must NOT take the fast path. The legacy pipeline treats
    // `__meo$`, `c`, and `d` as ordinary (non-CSS) top-level props here, since none
    // of those key names are valid CSS properties themselves — so they land in the
    // assembled result exactly as any other unrecognized object prop would.
    expect(result).toEqual({
      css: {},
      [COMPILED_MARKER]: 99,
      c: { padding: '1px' },
      d: { onClick },
      nativeProps: {},
    })
  })

  it('marker keys never appear in output for supported schema', () => {
    const markerProps = {
      [COMPILED_MARKER]: 1,
      c: { padding: '20px' },
      d: { onClick: () => {} },
      k: 'some-stable-key-hash',
      dyn: ['onClick'],
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(markerProps)

    expect(result).not.toHaveProperty(COMPILED_MARKER)
    expect(result).not.toHaveProperty('c')
    expect(result).not.toHaveProperty('d')
    expect(result).not.toHaveProperty('k')
    expect(result).not.toHaveProperty('dyn')
  })

  it('special keys stay top-level: ref, key, props, disableEmotion, children handled same as legacy', () => {
    const ref = { current: null }

    const markerProps = {
      [COMPILED_MARKER]: 1,
      c: { padding: '20px' },
      d: { onClick: () => {} },
      ref,
      key: 'my-key',
      props: { id: 'native-id' },
      disableEmotion: true,
      children: 'Hello',
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(markerProps)

    expect(result.ref).toBe(ref)
    expect(result.key).toBe('my-key')
    expect(result.nativeProps).toEqual({ id: 'native-id' })
    expect(result.disableEmotion).toBe(true)
    expect(result.children).toBe('Hello')
  })

  describe('debug-mode validation of malformed marker payloads', () => {
    afterEach(() => {
      // Restore debug mode so other test files aren't affected by this suite.
      setDebugMode(false)
    })

    it('warns when the d bucket contains a reserved special key', () => {
      setDebugMode(true)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const markerProps = {
        [COMPILED_MARKER]: 1,
        c: { padding: '20px' },
        d: { onClick: () => {}, ref: { current: null } },
      } as unknown as Partial<NodeProps>

      NodeUtil.processProps(markerProps)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ref'))
      warnSpy.mockRestore()
    })
  })
})
