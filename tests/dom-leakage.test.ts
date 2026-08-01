// @vitest-environment jsdom
//
// Nothing internal may reach the DOM.
//
// Two classes of leak are covered:
//
//   1. Compiled marker fields. Stripped on every schema this runtime knows.
//      Also stripped on schemas it does *not* know — output from a newer
//      compiler against an older `@meonode/ui`. React happens to reject
//      `__meo$`-prefixed names as invalid attributes so nothing reached the DOM
//      even before, but it warned once per field per node; forward
//      compatibility should be silent, not noisy.
//
//   2. MeoNode-specific config props. `theme` is deliberately not destructured
//      off props, because components like ThemeProvider take it as a real prop
//      and dropping it was a regression once already. An intrinsic element has
//      no use for it, and forwarding it stringified the object into the DOM as
//      `theme="[object Object]"`.
//
// Not covered on purpose: an arbitrary unknown prop holding an object, e.g.
// `Div({ someObj: { a: 1 } })`, still renders `someObj="[object Object]"`.
// That matches what React does with unknown attributes, so changing it would
// diverge from React rather than fix a bug.
import { renderToStaticMarkup } from 'react-dom/server'
import { vi } from 'vitest'
import { Div, ThemeProvider, type Theme } from '@src/main.js'
import { COMPILED_MARKER, COMPILER_SCHEMA_KEYS } from '@src/constant/common.const.js'

const S2 = COMPILER_SCHEMA_KEYS[2]
const THEME: Theme = { mode: 'light', system: { colors: { primary: 'rgb(1, 2, 3)' } } }

const html = (node: { render: () => unknown }) => renderToStaticMarkup(node.render() as never)

/** Captures React's attribute warnings, which is how invalid names surface. */
function captureWarnings(run: () => void) {
  const messages: string[] = []
  const spies = (['error', 'warn'] as const).map(level =>
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      messages.push(args.map(String).join(' '))
    }),
  )
  try {
    run()
  } finally {
    spies.forEach(s => s.mockRestore())
  }
  return messages
}

describe('compiled marker fields never reach the DOM', () => {
  it('strips a fully partitioned schema 2 marker', () => {
    const out = html(Div({ [COMPILED_MARKER]: 2, [S2.css]: { padding: '8px' }, [S2.dom]: { id: 'a' }, [S2.key]: 'k1', [S2.dyn]: [], children: 'x' } as never))

    expect(out).not.toContain('__meo')
    expect(out).not.toContain('[object Object]')
    expect(out).toContain('id="a"')
  })

  it('strips a key-only schema 3 marker', () => {
    const out = html(Div({ [COMPILED_MARKER]: 3, [S2.key]: 'k1', padding: '8px', id: 'b', children: 'x' } as never))

    expect(out).not.toContain('__meo')
    expect(out).not.toContain('[object Object]')
    // Non-vacuity: the props still had to be classified, not merely dropped.
    expect(out).toContain('id="b"')
    expect(out).toMatch(/class="css-/)
  })

  it('strips an unsupported schema and warns about nothing', () => {
    // Output from a newer compiler than this runtime understands. Props take
    // the legacy path, which is correct — but the marker fields must not be
    // handed to React, or it warns once per field per node.
    let out = ''
    const warnings = captureWarnings(() => {
      out = html(Div({ [COMPILED_MARKER]: 99, [S2.key]: 'k1', padding: '8px', id: 'c', children: 'x' } as never))
    })

    expect(out).not.toContain('__meo')
    expect(out).toContain('id="c"')
    expect(warnings.filter(m => /invalid attribute/i.test(m))).toEqual([])
  })
})

describe('MeoNode config props never reach the DOM', () => {
  it('does not forward theme to an intrinsic element', () => {
    const out = html(Div({ id: 'g', theme: THEME, children: 'x' } as never))

    expect(out).not.toContain('[object Object]')
    expect(out).not.toMatch(/\stheme=/)
    expect(out).toContain('id="g"')
  })

  it('still delivers theme to a component that consumes it', () => {
    // The other half of the rule: dropping `theme` wholesale was a regression.
    // ThemeProvider must still receive it and resolve tokens.
    const out = renderToStaticMarkup(
      ThemeProvider({
        theme: THEME,
        children: Div({ id: 'h', color: 'theme.colors.primary', children: 'x' }),
      }).render() as never,
    )

    expect(out).toContain('id="h"')
    expect(out).not.toMatch(/\stheme=/)
    expect(out).not.toContain('[object Object]')
  })

  it('does not forward disableEmotion or css objects', () => {
    const out = html(Div({ id: 'i', disableEmotion: true, css: { color: 'red' }, children: 'x' } as never))

    expect(out).not.toMatch(/\sdisableEmotion=/)
    expect(out).not.toMatch(/\scss=/)
    expect(out).not.toContain('[object Object]')
  })

  it('forwards nativeProps as real attributes', () => {
    // Non-vacuity for the whole file: props that *should* reach the DOM still do.
    const out = html(Div({ id: 'j', props: { 'data-n': '1' }, children: 'x' } as never))

    expect(out).toContain('data-n="1"')
    expect(out).toContain('id="j"')
  })
})
