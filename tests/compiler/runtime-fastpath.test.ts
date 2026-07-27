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

  it('classifies runtime-merged passthrough props like legacy (createNode initialProps merge)', () => {
    // createNode() merges initialProps with call-site props at RUNTIME, after the compiler
    // already rewrote the call site — so the compiler never saw `borderRadius`. It lands as
    // a plain top-level key in restRawProps, not inside `c`/`d`, and must still be classified
    // as CSS (not dumped into DOM props) exactly like the legacy pipeline would.
    const legacyProps = {
      borderRadius: 8,
      padding: '8px',
      backgroundColor: '#fff',
      id: 'card-1',
    } as unknown as Partial<NodeProps>

    const markerProps = {
      borderRadius: 8,
      padding: '8px',
      [COMPILED_MARKER]: 1,
      c: { backgroundColor: '#fff' },
      d: { id: 'card-1' },
    } as unknown as Partial<NodeProps>

    const legacyResult = NodeUtil.processProps(legacyProps)
    const markerResult = NodeUtil.processProps(markerProps)

    expect(markerResult).toEqual(legacyResult)
    expect(markerResult.css).toEqual({ borderRadius: 8, padding: '8px', backgroundColor: '#fff' })
    expect(markerResult.css).not.toHaveProperty('id')
    expect(markerResult.id).toBe('card-1')
    expect((markerResult as Record<string, unknown>).borderRadius).toBeUndefined()
  })

  it('precedence: explicit css prop wins, then c bucket, then top-level passthrough', () => {
    const markerProps = {
      padding: '1px', // top-level passthrough (e.g. runtime-merged initialProps)
      [COMPILED_MARKER]: 1,
      c: { padding: '2px' }, // compiler-classified call-site prop
      css: { padding: '3px' }, // explicit css prop
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(markerProps)

    expect(result.css).toEqual({ padding: '3px' })
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

describe('NodeUtil.processProps — schema 2 (namespaced marker keys)', () => {
  it('schema 2 produces FinalNodeProps deep-equal to the schema 1 equivalent', () => {
    const onClick = () => {}

    const schema1 = {
      [COMPILED_MARKER]: 1,
      c: { padding: '20px', backgroundColor: 'red' },
      d: { onClick, id: 'x' },
    } as unknown as Partial<NodeProps>

    const schema2 = {
      [COMPILED_MARKER]: 2,
      __meo$c: { padding: '20px', backgroundColor: 'red' },
      __meo$d: { onClick, id: 'x' },
    } as unknown as Partial<NodeProps>

    expect(NodeUtil.processProps(schema2)).toEqual(NodeUtil.processProps(schema1))
  })

  it('schema 2 does not collide with a real prop named `d` (SVG path attribute)', () => {
    // The motivating bug: under schema 1 a spread carrying `d` was consumed as the
    // DOM bucket. Under schema 2 the buckets are namespaced, so `d` is just a prop.
    const props = {
      [COMPILED_MARKER]: 2,
      __meo$c: { fill: 'red' },
      d: 'M0 0 L10 10',
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(props) as Record<string, unknown>

    expect(result.d).toBe('M0 0 L10 10')
    expect(result.css).toEqual({ fill: 'red' })
  })

  it('schema 2 does not collide with real props named `c`, `k` or `dyn`', () => {
    const props = {
      [COMPILED_MARKER]: 2,
      __meo$c: { padding: '2px' },
      c: 'user-c',
      k: 'user-k',
      dyn: 'user-dyn',
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(props) as Record<string, unknown>

    expect(result.c).toBe('user-c')
    expect(result.k).toBe('user-k')
    expect(result.dyn).toBe('user-dyn')
  })

  it('strips schema 2 marker keys from output', () => {
    const props = {
      [COMPILED_MARKER]: 2,
      __meo$c: { padding: '1px' },
      __meo$d: { id: 'a' },
      __meo$k: 'msite',
      __meo$dyn: [],
    } as unknown as Partial<NodeProps>

    const result = NodeUtil.processProps(props) as Record<string, unknown>

    for (const markerKey of [COMPILED_MARKER, '__meo$c', '__meo$d', '__meo$k', '__meo$dyn']) {
      expect(markerKey in result).toBe(false)
    }
  })

  it('unsupported schema 3 falls through to the legacy path', () => {
    const props = { [COMPILED_MARKER]: 3, __meo$c: { padding: '1px' } } as unknown as Partial<NodeProps>
    const result = NodeUtil.processProps(props) as Record<string, unknown>

    // Legacy path treats the marker fields as ordinary unknown props.
    expect(result[COMPILED_MARKER]).toBe(3)
    expect(result.css).toEqual({})
  })
})
