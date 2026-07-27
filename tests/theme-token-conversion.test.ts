// @vitest-environment node
//
// Unit coverage for `replaceThemeTokensWithCssVars`, which had none of its own
// despite running on every node's props on every render (it was only exercised
// indirectly, through rendering tests).
//
// It gained an allocation-free pre-scan (`scanForThemeTokens`) that returns the
// input untouched when it can prove there is nothing to convert. That scan has
// to reach exactly the same conclusion as the full walk it short-circuits, so
// these tests pin the equivalence — especially the two ways the scan can be
// wrong: structures too deep for its recursion budget, and cyclic structures
// (which it deliberately does not track, relying on the depth bound to hand off
// to the cycle-aware slow path).
import { replaceThemeTokensWithCssVars } from '@src/util/server-theme.util.js'

describe('replaceThemeTokensWithCssVars', () => {
  describe('conversion', () => {
    it('converts a bare token string', () => {
      expect(replaceThemeTokensWithCssVars('theme.spacing.md')).toBe('var(--meonode-theme-spacing-md)')
    })

    it('converts a token embedded in a shorthand value', () => {
      expect(replaceThemeTokensWithCssVars('1px solid theme.base.deep')).toBe('1px solid var(--meonode-theme-base-deep)')
    })

    it('converts every occurrence in one string', () => {
      expect(replaceThemeTokensWithCssVars('theme.spacing.sm theme.spacing.md')).toBe('var(--meonode-theme-spacing-sm) var(--meonode-theme-spacing-md)')
    })

    it('converts tokens in object values', () => {
      expect(replaceThemeTokensWithCssVars({ padding: 'theme.spacing.md', color: '#fff' })).toEqual({
        padding: 'var(--meonode-theme-spacing-md)',
        color: '#fff',
      })
    })

    it('converts tokens nested several levels deep', () => {
      const input = { css: { '&:hover': { color: 'theme.primary' } } }
      expect(replaceThemeTokensWithCssVars(input)).toEqual({ css: { '&:hover': { color: 'var(--meonode-theme-primary)' } } })
    })

    it('converts tokens inside arrays', () => {
      expect(replaceThemeTokensWithCssVars({ transition: ['theme.motion.fast', 'ease'] })).toEqual({
        transition: ['var(--meonode-theme-motion-fast)', 'ease'],
      })
    })

    it('leaves object keys alone', () => {
      // CSS variables are invalid inside media features and selector text, so a
      // token in a *key* must survive for `resolveObjWithTheme` to resolve
      // concretely against the live theme.
      const input = { '@media (max-width: theme.breakpoint.md)': { padding: 'theme.spacing.sm' } }
      const out = replaceThemeTokensWithCssVars(input) as Record<string, unknown>
      expect(Object.keys(out)).toEqual(['@media (max-width: theme.breakpoint.md)'])
      expect(out['@media (max-width: theme.breakpoint.md)']).toEqual({ padding: 'var(--meonode-theme-spacing-sm)' })
    })
  })

  describe('the token-free fast path', () => {
    it('returns the very same reference when there is nothing to convert', () => {
      // Reference identity matters for React reconciliation and memoized
      // components, and the slow walk is copy-on-write for the same reason. The
      // fast path must not weaken that guarantee.
      const input = { padding: '16px', color: '#111827', display: 'flex' }
      expect(replaceThemeTokensWithCssVars(input)).toBe(input)
    })

    it('returns the same reference for already-compiled var() values', () => {
      // This is the post-@meonode/compiler-v0.4 shape: tokens were already
      // rewritten at build time, so `var(--meonode-theme-*)` contains no
      // `theme.` substring and there is genuinely nothing left to do.
      const input = { padding: 'var(--meonode-theme-spacing-md)', gap: '8px' }
      expect(replaceThemeTokensWithCssVars(input)).toBe(input)
    })

    it('preserves untouched sibling subtrees by reference when something else changes', () => {
      const clean = { color: '#fff' }
      const input = { clean, dirty: { padding: 'theme.spacing.md' } }
      const out = replaceThemeTokensWithCssVars(input) as typeof input
      expect(out).not.toBe(input)
      expect(out.clean).toBe(clean)
      expect(out.dirty).toEqual({ padding: 'var(--meonode-theme-spacing-md)' })
    })

    it('passes non-plain objects through untouched', () => {
      class Ref {
        current = 'theme.primary'
      }
      const ref = new Ref()
      const input = { ref }
      // The walk never descends into class instances, so the token inside is not
      // convertible and the whole input is legitimately "token-free".
      expect(replaceThemeTokensWithCssVars(input)).toBe(input)
      expect(ref.current).toBe('theme.primary')
    })

    it('does not treat a token in a Date/RegExp-like instance as convertible', () => {
      const input = { when: new Date(0), pattern: /theme\.primary/ }
      expect(replaceThemeTokensWithCssVars(input)).toBe(input)
    })
  })

  describe('structures the fast path must hand off rather than mis-answer', () => {
    it('still converts a token nested deeper than the scan depth budget', () => {
      // The scan gives up past its depth bound and defers to the full walk. If
      // it instead reported "no tokens", this token would silently survive into
      // the DOM as a literal.
      let node: Record<string, unknown> = { color: 'theme.primary' }
      for (let i = 0; i < 40; i++) node = { nested: node }

      let out = replaceThemeTokensWithCssVars(node) as Record<string, unknown>
      for (let i = 0; i < 40; i++) out = out.nested as Record<string, unknown>
      expect(out.color).toBe('var(--meonode-theme-primary)')
    })

    it('terminates on a cyclic structure instead of recursing forever', () => {
      const cyclic: Record<string, unknown> = { padding: '16px' }
      cyclic.self = cyclic
      // The scan has no path Set; it relies on the depth bound to bail out, and
      // the cycle-aware walk takes over from there.
      expect(() => replaceThemeTokensWithCssVars(cyclic)).not.toThrow()
    })

    it('still converts tokens in a cyclic structure', () => {
      const cyclic: Record<string, unknown> = { padding: 'theme.spacing.md' }
      cyclic.self = cyclic
      const out = replaceThemeTokensWithCssVars(cyclic) as Record<string, unknown>
      expect(out.padding).toBe('var(--meonode-theme-spacing-md)')
    })
  })

  describe('inputs that are not containers', () => {
    it('returns primitives unchanged', () => {
      expect(replaceThemeTokensWithCssVars(42)).toBe(42)
      expect(replaceThemeTokensWithCssVars(true)).toBe(true)
      expect(replaceThemeTokensWithCssVars(null)).toBe(null)
      expect(replaceThemeTokensWithCssVars(undefined)).toBe(undefined)
    })

    it('leaves a string with no token alone', () => {
      expect(replaceThemeTokensWithCssVars('16px')).toBe('16px')
    })

    it('handles empty containers', () => {
      const obj = {}
      const arr: unknown[] = []
      expect(replaceThemeTokensWithCssVars(obj)).toBe(obj)
      expect(replaceThemeTokensWithCssVars(arr)).toBe(arr)
    })
  })

  describe('repeat calls', () => {
    it('is idempotent', () => {
      const once = replaceThemeTokensWithCssVars({ padding: 'theme.spacing.md' })
      const twice = replaceThemeTokensWithCssVars(once)
      expect(twice).toEqual(once)
    })

    it('returns a stable result for the same input reference across calls', () => {
      // The module-level regex is shared across calls now that it is hoisted out
      // of the function body; a mismanaged `lastIndex` would show up here as a
      // second call producing a different answer than the first.
      const input = { a: 'theme.spacing.md', b: 'theme.spacing.sm', c: 'theme.primary' }
      const first = replaceThemeTokensWithCssVars(input)
      const second = replaceThemeTokensWithCssVars({ ...input })
      expect(second).toEqual(first)
    })

    it('converts consistently when many distinct values are processed in sequence', () => {
      for (let i = 0; i < 100; i++) {
        expect(replaceThemeTokensWithCssVars(`theme.spacing.s${i}`)).toBe(`var(--meonode-theme-spacing-s${i})`)
      }
    })
  })
})
