// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { ThemeProvider, type Theme } from '@src/main.js'

const THEME: Theme = {
  mode: 'light',
  system: {
    spacing: { md: '16px' },
    colors: { primary: 'rgb(255, 0, 0)' },
  },
}

const OTHER_THEME: Theme = {
  mode: 'dark',
  system: {
    spacing: { md: '20px' },
    colors: { primary: 'rgb(0, 0, 255)' },
  },
}

/**
 * Theme variables must be emitted by the component that owns the theme, as part
 * of its own render output — not deferred to a global registry consumed at a
 * streaming flush point. The registry approach made emission depend on whether
 * registration happened before the last flush, which silently dropped the
 * `:root{}` block on some routes while leaving hundreds of `var(...)`
 * references pointing at undefined properties.
 */
describe('ThemeProvider server-side theme variables', () => {
  it('emits the :root variable block in its own SSR output', () => {
    const html = renderToString(ThemeProvider({ theme: THEME, children: 'hi' }).render())

    expect(html).toContain('--meonode-theme-colors-primary:rgb(255, 0, 0)')
    expect(html).toContain('--meonode-theme-spacing-md:16px')
    expect(html).toContain(':root{')
  })

  it('marks the style tag so it can be identified', () => {
    const html = renderToString(ThemeProvider({ theme: THEME, children: 'hi' }).render())
    expect(html).toContain('data-meonode-theme-vars')
  })

  it("emits each theme's own variables, so a nested provider is not swallowed", () => {
    const outer = renderToString(ThemeProvider({ theme: THEME, children: 'a' }).render())
    const inner = renderToString(ThemeProvider({ theme: OTHER_THEME, children: 'b' }).render())

    expect(outer).toContain('--meonode-theme-spacing-md:16px')
    expect(inner).toContain('--meonode-theme-spacing-md:20px')
  })

  it('is deterministic across renders of the same theme', () => {
    const a = renderToString(ThemeProvider({ theme: THEME, children: 'x' }).render())
    const b = renderToString(ThemeProvider({ theme: THEME, children: 'x' }).render())
    expect(a).toBe(b)
  })

  it('does not depend on render order relative to any other component', () => {
    // Emission is a pure function of the theme, so rendering the provider last
    // (after every other subtree would already have flushed) still emits.
    const html = renderToString(ThemeProvider({ theme: THEME, children: 'late' }).render())
    expect(html).toContain('--meonode-theme-colors-primary')
  })
})
