// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { matchers } from '@emotion/jest'
import { Div, ThemeProvider } from '@src/main.js'
import { ThemeUtil } from '@src/util/theme.util.js'
import { buildThemeVariablesCss } from '@src/util/server-theme.util.js'
import { isLengthProperty } from '@src/util/css-unit.util.js'

/**
 * Properties that accept a length **and** a bare number, where the bare number
 * is a distinct, meaningful value rather than a mistake.
 *
 * `lineHeight: 1.25` is a ratio; `lineHeight: 24px` is a length. Both are
 * valid and they mean different things, so a numeric token here must stay bare
 * — appending `px` would silently change the author's meaning. These are the
 * only properties where "give the number a unit" is the wrong answer, which is
 * why the length set subtracts Emotion's unitless table rather than treating
 * every length-accepting property the same.
 *
 * Derived as `csstype(TLength)` INTERSECT `CSSPropertySet` INTERSECT
 * `@emotion/unitless`. Hard-coded here deliberately: if the derivation ever
 * changes this set, that is a behavioural change worth failing on rather than
 * absorbing silently.
 */
expect.extend(matchers)

const DUAL_UNIT_PROPERTIES = ['borderImageOutset', 'borderImageWidth', 'columns', 'flex', 'lineHeight', 'tabSize'] as const

const theme = {
  mode: 'light',
  system: {
    // One bare number and one unit-bearing value, reused across every property.
    dual: { bare: 24, ratio: 1.5, withUnit: '24px', pct: '150%' },
  },
} as never

const resolve = (props: Record<string, string>) => ThemeUtil.resolveObjWithTheme(props, theme, { themeStringsMode: 'vars' }) as Record<string, string>

describe('properties that take a length or a bare number', () => {
  it.each(DUAL_UNIT_PROPERTIES)('`%s` is not treated as a length property', property => {
    expect(isLengthProperty(property)).toBe(false)
  })

  it.each(DUAL_UNIT_PROPERTIES)('`%s` never references the --len variant, so a bare token stays bare', property => {
    const out = resolve({ [property]: 'theme.dual.bare' })
    expect(out[property]).toBe('var(--meonode-theme-dual-bare)')
    expect(out[property]).not.toContain('--len')
  })

  it.each(DUAL_UNIT_PROPERTIES)('`%s` passes a unit-bearing token through unchanged', property => {
    const out = resolve({ [property]: 'theme.dual.withUnit' })
    expect(out[property]).toBe('var(--meonode-theme-dual-withUnit)')
  })

  /**
   * The variable itself still holds exactly what the theme declared, so the
   * property receives the author's value verbatim — `24` stays `24`, not
   * `24px`.
   */
  it('the plain variable carries the raw theme value', () => {
    const root = buildThemeVariablesCss(theme)
    expect(root).toContain('--meonode-theme-dual-bare:24;')
    expect(root).toContain('--meonode-theme-dual-ratio:1.5;')
    expect(root).toContain('--meonode-theme-dual-withUnit:24px;')
    expect(root).toContain('--meonode-theme-dual-pct:150%;')
  })

  /**
   * The `--len` variants are still emitted for numeric values — they are
   * property-agnostic — but nothing in this family references them.
   */
  it('emits --len variants that these properties simply never use', () => {
    const root = buildThemeVariablesCss(theme)
    expect(root).toContain('--meonode-theme-dual-bare--len:24px;')
    for (const property of DUAL_UNIT_PROPERTIES) {
      expect(resolve({ [property]: 'theme.dual.bare' })[property]).not.toContain('--len')
    }
  })

  /**
   * The distinction is per usage site, not per token: one value can be a ratio
   * here and a length there.
   */
  it('resolves the same token as a ratio or a length depending on the property', () => {
    const out = resolve({ lineHeight: 'theme.dual.bare', padding: 'theme.dual.bare' })
    expect(out.lineHeight).toBe('var(--meonode-theme-dual-bare)')
    expect(out.padding).toBe('var(--meonode-theme-dual-bare--len, var(--meonode-theme-dual-bare))')
  })
})

/**
 * The same six properties through real factory call sites.
 *
 * The tests above drive `resolveObjWithTheme` directly, which the build-time
 * plugin never sees. These are literal `Div({ … })` calls, so under
 * `vitest.compiled.config.ts` the plugin rewrites the tokens at build time and
 * under `vitest.config.ts` the runtime does it — and both must land on the
 * same declaration. That equality is the actual contract; a divergence here
 * would mean adding or removing the compiler changes what the page looks like.
 */
describe('dual-unit properties through real call sites', () => {
  afterEach(cleanup)

  const KEBAB: Record<string, string> = {
    borderImageOutset: 'border-image-outset',
    borderImageWidth: 'border-image-width',
    columns: 'columns',
    flex: 'flex',
    lineHeight: 'line-height',
    tabSize: 'tab-size',
  }

  it.each(DUAL_UNIT_PROPERTIES)('`%s` emits the plain variable, compiled or not', property => {
    const { getByText } = render(ThemeProvider({ theme, children: Div({ [property]: 'theme.dual.bare', children: 'dual' } as never) }).render() as never)
    expect(getByText('dual')).toHaveStyleRule(KEBAB[property], 'var(--meonode-theme-dual-bare)')
  })

  it('a length property alongside them still gets the unit', () => {
    const { getByText } = render(
      ThemeProvider({ theme, children: Div({ lineHeight: 'theme.dual.bare', padding: 'theme.dual.bare', children: 'mixed' }) }).render() as never,
    )
    const el = getByText('mixed')
    expect(el).toHaveStyleRule('line-height', 'var(--meonode-theme-dual-bare)')
    expect(el).toHaveStyleRule('padding', 'var(--meonode-theme-dual-bare--len, var(--meonode-theme-dual-bare))')
  })
})
