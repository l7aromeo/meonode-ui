// @vitest-environment node
//
// Unit coverage for `ThemeUtil.resolveObjWithTheme`, which had none of its own
// despite running once per styled node on every render (it was only exercised
// indirectly, through rendering tests).
//
// It gained an allocation-free pre-scan (`scanForThemeWork`) that returns the
// input untouched when it can prove there is nothing to resolve. That scan has
// to reach exactly the same conclusion as the full walk it short-circuits, so
// these tests pin the equivalence. Its three ways of being wrong, each covered
// below:
//   - missing a token in a *key* (media queries / selectors, which the walk
//     rewrites and which `replaceThemeTokensWithCssVars` deliberately does not),
//   - missing a callable value when `processFunctions` is set,
//   - mis-answering on structures too deep for its recursion budget, or cyclic
//     ones (which it deliberately does not track, relying on the depth bound to
//     hand off to the cycle-aware slow path).
import { ThemeUtil } from '@src/util/theme.util.js'
import type { Theme } from '@src/types/node.type.js'

const theme: Theme = {
  mode: 'light',
  system: {
    primary: '#4f46e5',
    breakpoint: { md: '768px' },
    spacing: { sm: '4px', md: '8px' },
    palette: { brand: { default: '#abcdef', dark: '#123456' } },
  },
}

describe('ThemeUtil.resolveObjWithTheme', () => {
  describe('resolution', () => {
    it('resolves a token value against the theme', () => {
      expect(ThemeUtil.resolveObjWithTheme({ color: 'theme.primary' }, theme)).toEqual({ color: '#4f46e5' })
    })

    it('resolves a token embedded in a shorthand value', () => {
      expect(ThemeUtil.resolveObjWithTheme({ border: '1px solid theme.primary' }, theme)).toEqual({ border: '1px solid #4f46e5' })
    })

    it('resolves an object token through its `default` member', () => {
      expect(ThemeUtil.resolveObjWithTheme({ color: 'theme.palette.brand' }, theme)).toEqual({ color: '#abcdef' })
    })

    it('resolves tokens nested several levels deep', () => {
      const input = { '&:hover': { color: 'theme.primary' } }
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toEqual({ '&:hover': { color: '#4f46e5' } })
    })

    it('resolves tokens inside arrays', () => {
      // Arrays are descended into by the walk, so the scan must descend too.
      const input = { '&:hover': [{ color: 'theme.primary' }] }
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toEqual({ '&:hover': [{ color: '#4f46e5' }] })
    })

    it('emits var() references in `vars` mode', () => {
      expect(ThemeUtil.resolveObjWithTheme({ color: 'theme.primary' }, theme, { themeStringsMode: 'vars' })).toEqual({
        color: 'var(--meonode-theme-primary)',
      })
    })

    it('leaves an unresolvable token as written', () => {
      expect(ThemeUtil.resolveObjWithTheme({ color: 'theme.nope.missing' }, theme)).toEqual({ color: 'theme.nope.missing' })
    })
  })

  describe('tokens in keys', () => {
    it('resolves a token in a media-query key', () => {
      // Keys are the scan's easiest blind spot: `replaceThemeTokensWithCssVars`
      // deliberately skips them, so a scan copy-pasted from there would report
      // "nothing to do" and the media query would ship with a literal token.
      const input = { '@media (max-width: theme.breakpoint.md)': { padding: '4px' } }
      const out = ThemeUtil.resolveObjWithTheme(input, theme)
      expect(Object.keys(out)).toEqual(['@media (max-width: 768px)'])
    })

    it('resolves keys concretely even in `vars` mode', () => {
      // CSS variables are invalid inside media features, so `vars` mode must not
      // reach keys.
      const input = { '@media (max-width: theme.breakpoint.md)': { padding: 'theme.spacing.sm' } }
      const out = ThemeUtil.resolveObjWithTheme(input, theme, { themeStringsMode: 'vars' }) as Record<string, unknown>
      expect(Object.keys(out)).toEqual(['@media (max-width: 768px)'])
      expect(out['@media (max-width: 768px)']).toEqual({ padding: 'var(--meonode-theme-spacing-sm--len, var(--meonode-theme-spacing-sm))' })
    })
  })

  describe('callable values', () => {
    it('invokes functions when processFunctions is set', () => {
      const input = { color: (t: Theme) => (t.system as { primary: string }).primary }
      expect(ThemeUtil.resolveObjWithTheme(input, theme, { processFunctions: true })).toEqual({ color: '#4f46e5' })
    })

    it('resolves a token returned by a function', () => {
      const input = { color: () => 'theme.primary' }
      expect(ThemeUtil.resolveObjWithTheme(input, theme, { processFunctions: true })).toEqual({ color: '#4f46e5' })
    })

    it('leaves functions alone when processFunctions is not set', () => {
      // The walk does not call them here, so the scan must not count them as
      // work either — otherwise every callable prop would defeat the fast path.
      const fn = () => 'theme.primary'
      const input = { color: fn }
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toBe(input)
    })
  })

  describe('the no-work fast path', () => {
    it('returns the very same reference when there is nothing to resolve', () => {
      // Reference identity matters for React reconciliation and memoized
      // components, and the slow walk is copy-on-write for the same reason. The
      // fast path must not weaken that guarantee.
      const input = { padding: '16px', color: '#111827', display: 'flex' }
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toBe(input)
    })

    it('returns the same reference for already-compiled var() values', () => {
      // The post-@meonode/compiler-v0.4 shape: tokens were rewritten at build
      // time, so `var(--meonode-theme-*)` holds no `theme.` substring and there
      // is genuinely nothing left to do.
      const input = { padding: 'var(--meonode-theme-spacing-md--len, var(--meonode-theme-spacing-md))', gap: '8px' }
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toBe(input)
    })

    it('preserves untouched sibling subtrees by reference when something else changes', () => {
      const clean = { color: '#fff' }
      const input = { clean, dirty: { color: 'theme.primary' } }
      const out = ThemeUtil.resolveObjWithTheme(input, theme)
      expect(out).not.toBe(input)
      expect(out.clean).toBe(clean)
      expect(out.dirty).toEqual({ color: '#4f46e5' })
    })

    it('passes non-plain objects through untouched', () => {
      class Ref {
        current = 'theme.primary'
      }
      const ref = new Ref()
      const input = { ref }
      // The walk never descends into class instances, so the token inside is not
      // resolvable and the whole input is legitimately "no work".
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toBe(input)
      expect(ref.current).toBe('theme.primary')
    })
  })

  describe('structures the fast path must hand off rather than mis-answer', () => {
    it('still resolves a token nested deeper than the scan depth budget', () => {
      // The scan gives up past its depth bound and defers to the full walk. If
      // it instead reported "no work", this token would survive into the DOM.
      let node: Record<string, unknown> = { color: 'theme.primary' }
      for (let i = 0; i < 40; i++) node = { nested: node }

      let out = ThemeUtil.resolveObjWithTheme(node, theme)
      for (let i = 0; i < 40; i++) out = out.nested as Record<string, unknown>
      expect(out.color).toBe('#4f46e5')
    })

    it('terminates on a cyclic structure instead of recursing forever', () => {
      const cyclic: Record<string, unknown> = { padding: '16px' }
      cyclic.self = cyclic
      // The scan has no path Set; it relies on the depth bound to bail out, and
      // the cycle-aware walk takes over from there.
      expect(() => ThemeUtil.resolveObjWithTheme(cyclic, theme)).not.toThrow()
    })

    it('still resolves tokens in a cyclic structure', () => {
      const cyclic: Record<string, unknown> = { color: 'theme.primary' }
      cyclic.self = cyclic
      const out = ThemeUtil.resolveObjWithTheme(cyclic, theme)
      expect(out.color).toBe('#4f46e5')
    })
  })

  describe('entry guards', () => {
    it('returns the input when no theme is supplied', () => {
      const input = { color: 'theme.primary' }
      expect(ThemeUtil.resolveObjWithTheme(input, undefined)).toBe(input)
    })

    it('returns the input when the theme has an empty system', () => {
      const input = { color: 'theme.primary' }
      expect(ThemeUtil.resolveObjWithTheme(input, { mode: 'light', system: {} } as Theme)).toBe(input)
    })

    it('returns the input when the object is empty', () => {
      const input = {}
      expect(ThemeUtil.resolveObjWithTheme(input, theme)).toBe(input)
    })
  })

  describe('repeat calls', () => {
    it('is idempotent', () => {
      const once = ThemeUtil.resolveObjWithTheme({ color: 'theme.primary' }, theme)
      expect(ThemeUtil.resolveObjWithTheme(once, theme)).toEqual(once)
    })

    it('returns a stable result across calls with the shared module-level regex', () => {
      // The regex is hoisted out of the function body and shared now; a
      // mismanaged `lastIndex` would show up here as the second call disagreeing
      // with the first.
      const input = { a: 'theme.spacing.md', b: 'theme.spacing.sm', c: 'theme.primary' }
      const first = ThemeUtil.resolveObjWithTheme(input, theme)
      const second = ThemeUtil.resolveObjWithTheme({ ...input }, theme)
      expect(second).toEqual(first)
    })
  })
})
