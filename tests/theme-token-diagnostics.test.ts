import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Div, ThemeProvider, setDebugMode } from '@src/main.js'
import { __resetThemeDiagnostics } from '@src/util/theme-diagnostics.util.js'

/**
 * A token that resolves to nothing, or to a bare number used as a length,
 * produces no error and no visible style — the element is simply missing a
 * declaration. These tests pin the warnings that make those cases findable,
 * and pin that nothing about the emitted CSS changes.
 */

const theme = {
  mode: 'light',
  system: {
    primary: { default: '#3B82F6', content: '#FFFFFF' },
    // No `default`: `theme.brand` names a variable that is never emitted.
    brand: { light: '#AAAAAA', dark: '#333333' },
    // Bare numbers: fine for `zIndex`/`lineHeight`, invalid for lengths.
    spacing: { md: 16, mdAsString: '16', none: 0, proper: '16px' },
    layer: { modal: 40 },
    text: { tight: 1.25 },
    breakpoint: { md: 768, mdProper: '768px', zero: 0 },
  },
}

const captured: string[] = []
let originalWarn: typeof console.warn

beforeEach(() => {
  __resetThemeDiagnostics()
  captured.length = 0
  originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    captured.push(String(args[0]))
  }
})

afterEach(() => {
  console.warn = originalWarn
})

const render = (props: Record<string, unknown>) => renderToStaticMarkup(ThemeProvider({ theme, children: Div(props) }).render())

describe('theme token diagnostics', () => {
  it('warns when a token path is not defined by the theme', () => {
    render({ color: 'theme.primry' })
    const m = captured.find(x => x.includes('theme.primry')) ?? ''
    expect(m).toContain('is not defined by the active theme')
    expect(m).toContain('used for `color`')
    expect(m).toContain('--meonode-theme-primry')
  })

  it('warns when a path stops on an object with no `default`, and suggests its leaves', () => {
    render({ backgroundColor: 'theme.brand' })
    const m = captured.find(x => x.includes('theme.brand')) ?? ''
    expect(m).toContain('is not defined by the active theme')
    expect(m).toContain('theme.brand.light')
    expect(m).toContain('theme.brand.dark')
  })

  it('stays quiet for numeric tokens on unitless properties', () => {
    render({ zIndex: 'theme.layer.modal', lineHeight: 'theme.text.tight' })
    expect(captured).toEqual([])
  })

  /**
   * The numeric-token warning must fire for exactly the properties Emotion
   * would have added `px` to, and no others. `flex`, `order`, `opacity` and
   * friends legitimately take a bare number, so warning on them would be noise
   * that teaches people to ignore the warning. Emotion's own unitless table is
   * the source of truth, so the two cannot drift.
   */

  /**
   * Emotion adds `px` on `typeof value === 'number'`, so a string that merely
   * looks numeric slips through: `padding: '16'` serialises to `padding:16`,
   * which is dropped. The same applies to a token holding `'16'` rather than
   * `16` — both reach CSS as a bare number.
   */

  it('warns for a numeric string written directly on a style prop', () => {
    render({ padding: '16' })
    const m = captured.find(x => x.includes('padding')) ?? ''
    expect(m).toContain('number written as a string')
    expect(m).toContain('padding: 16')
    expect(m).toContain("Write it as 16 or '16px'")
  })

  it('stays quiet for a real number written directly, which Emotion handles', () => {
    render({ padding: 16, margin: 24 })
    expect(captured).toEqual([])
  })

  it('stays quiet for a numeric string on a unitless property', () => {
    render({ zIndex: '40', flexGrow: '1' })
    expect(captured).toEqual([])
  })

  it('stays quiet for values that already carry a unit', () => {
    render({ padding: '16px', width: '50%', margin: '1rem', gap: 'theme.spacing.proper' })
    expect(captured).toEqual([])
  })

  it('stays quiet for non-numeric strings', () => {
    render({ padding: 'auto', width: 'calc(100% - 16px)', color: 'red' })
    expect(captured).toEqual([])
  })

  it('stays quiet for tokens that resolve correctly', () => {
    render({ color: 'theme.primary', backgroundColor: 'theme.primary.content' })
    expect(captured).toEqual([])
  })

  it('keeps the plain variables and adds a length variant for numeric tokens', () => {
    const html = render({ padding: 'theme.spacing.md', backgroundColor: 'theme.brand' })
    // Plain variables are unchanged, so anything referencing them directly still works.
    expect(html).toContain('--meonode-theme-spacing-md:16;')
    expect(html).toContain('--meonode-theme-spacing-md--len:16px;')
    expect(html).toContain('--meonode-theme-brand-light:#AAAAAA;')
    // No variable is invented for the `default`-less path.
    expect(html).not.toContain('--meonode-theme-brand:')
    // The node still renders with an Emotion class.
    expect(html).toMatch(/class="css-\w+"/)
  })

  it('does not throw for any reported case', () => {
    expect(() => render({ color: 'theme.nope', padding: 'theme.spacing.md', backgroundColor: 'theme.brand' })).not.toThrow()
  })

  it('is silent in production, and emits byte-identical output either way', () => {
    const bad = { backgroundColor: 'theme.brand', color: 'theme.nope', padding: '16' }

    vi.stubEnv('NODE_ENV', 'production')
    __resetThemeDiagnostics()
    captured.length = 0
    const productionHtml = render(bad)
    const productionWarnings = [...captured]
    vi.unstubAllEnvs()

    __resetThemeDiagnostics()
    captured.length = 0
    const developmentHtml = render(bad)

    expect(productionWarnings).toEqual([])
    expect(captured.length).toBeGreaterThan(0)
    expect(productionHtml).toBe(developmentHtml)
  })

  it('still reports in production when debug mode is on', () => {
    vi.stubEnv('NODE_ENV', 'production')
    __resetThemeDiagnostics()
    captured.length = 0
    setDebugMode(true)
    render({ color: 'theme.nope' })
    setDebugMode(false)
    vi.unstubAllEnvs()

    expect(captured.some(m => m.includes('theme.nope'))).toBe(true)
  })

  /**
   * Keys take the `resolve` path, not the `var` path — a custom property is
   * invalid inside a media feature — so a numeric breakpoint token is
   * substituted as bare text. `@media (max-width: 768)` is not a valid feature
   * and the browser drops the entire block, verified in Chromium.
   */
  it('warns when a numeric breakpoint token strips the unit off a media query', () => {
    render({ css: { '@media (max-width: theme.breakpoint.md)': { padding: '8px' } } })
    const m = captured.find(x => x.includes('@media')) ?? ''
    expect(m).toContain('length with no unit')
    expect(m).toContain('drops the whole block')
    expect(m).toContain("'768px'")
  })

  it('stays quiet for a breakpoint token that carries its unit', () => {
    render({ css: { '@media (max-width: theme.breakpoint.mdProper)': { padding: '8px' } } })
    expect(captured).toEqual([])
  })

  it('stays quiet for a zero-valued media feature, which needs no unit', () => {
    render({ css: { '@media (min-width: theme.breakpoint.zero)': { padding: '8px' } } })
    expect(captured).toEqual([])
  })

  it('stays quiet for media features that legitimately take a bare number', () => {
    render({ css: { '@media (monochrome: 0)': { padding: '8px' }, '@media (min-color: 8)': { margin: '8px' } } })
    expect(captured).toEqual([])
  })

  it('stays quiet for non-length media features', () => {
    render({ css: { '@media (prefers-color-scheme: dark)': { padding: '8px' }, '@media (orientation: landscape)': { margin: '8px' } } })
    expect(captured).toEqual([])
  })
})
