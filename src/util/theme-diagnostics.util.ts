import { __DEBUG__ } from '@src/constant/common.const.js'
import type { Theme } from '@src/types/node.type.js'
import { toLengthVarName, wouldEmotionAddPx as emotionWouldAddPx } from '@src/util/css-unit.util.js'

/**
 * Development-time diagnostics for `theme.*` tokens.
 *
 * Token resolution is deliberately forgiving: a path that resolves to nothing
 * still emits `var(--meonode-theme-…)`, and the browser drops the declaration.
 * That stops one bad token from taking down a page, but it also means the
 * common authoring mistakes produce no error, no warning, and no visible
 * effect — an element is simply missing a style, with nothing to search for.
 *
 * These checks close that gap without changing a single byte of emitted CSS.
 *
 * They run against the **variables the theme actually defines** rather than
 * re-parsing token paths. Tokens reach here in two shapes depending on the
 * path taken — `theme.spacing.md` on the client, `var(--meonode-theme-spacing-md)`
 * once `replaceThemeTokensWithCssVars` has run — and a variable name cannot be
 * reversed back into a path unambiguously (a theme key may itself contain `-`).
 * Membership in the defined set answers the question exactly, either way.
 */

/**
 * Diagnostics run in development, or whenever debug mode is on.
 *
 * `NODE_ENV` is read defensively: browser bundles may not define `process`, and
 * bundlers commonly replace the expression with a literal, letting these calls
 * fold away entirely in production builds.
 * @returns `true` when diagnostics should be evaluated.
 */
const diagnosticsEnabled = (): boolean => {
  if (__DEBUG__) return true
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

/**
 * Resolution runs once per styled node per render, so an unguarded warning
 * would fire thousands of times for a single mistake. Each distinct
 * `subject|property` pair is reported once per process.
 */
const reported = new Set<string>()

/**
 * Whether Emotion would have appended `px` to this number had it been written
 * directly as a prop — which is exactly the condition that makes a bare numeric
 * token wrong.
 *
 * Mirrors `@emotion/serialize`'s `processStyleValue` so the two cannot disagree:
 *
 * ```js
 * unitless[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0
 * ```
 *
 * The `0` and custom-property cases matter. `padding: 0` is valid CSS and
 * Emotion leaves it bare, and a `--custom-property` declaration takes a raw
 * number quite legitimately. Warning on either would be a false positive.
 * @param property The CSS property the value was written against.
 * @param value The number the token holds.
 * @returns `true` when a bare number here produces an invalid declaration.
 */
const wouldEmotionAddPx = (property: string, value: number): boolean => emotionWouldAddPx(property) && value !== 0

/** A string that is only a number — `'16'`, `'-2'`, `'1.5'` — with no unit. */
const UNITLESS_NUMERIC_STRING = /^-?(?:\d+\.?\d*|\.\d+)$/

/**
 * Whether this value produces an invalid declaration for this property.
 *
 * Emotion adds `px` on `typeof value === 'number'`, so a *string* that merely
 * looks numeric slips through untouched — `padding: '16'` serialises to
 * `padding:16`, which is not a valid length and is dropped. Theme tokens hit
 * the same wall from the other side: their value reaches CSS through a custom
 * property, and a custom property's value is opaque text that Emotion never
 * inspects, so a bare `16` stays bare whether it was written as a number or a
 * string.
 * @param property The CSS property the value was written against.
 * @param value The value as it will reach CSS.
 * @returns `true` when the declaration will be discarded for want of a unit.
 */
const isUnitlessLength = (property: string, value: unknown): boolean => {
  if (typeof value === 'number') return wouldEmotionAddPx(property, value)
  if (typeof value !== 'string' || !UNITLESS_NUMERIC_STRING.test(value)) return false
  return wouldEmotionAddPx(property, Number(value))
}

const toVarName = (path: string): string => `--meonode-theme-${path.replace(/[^\w.-]/g, '-').replace(/\./g, '-')}`

/**
 * Every variable a theme defines, mapped to its raw value.
 *
 * Mirrors `buildThemeVariablesCss`'s traversal exactly — a nested object
 * contributes a variable only when it carries a scalar `default` — because a
 * disagreement between the two would make this report variables that were never
 * emitted, or miss ones that were.
 */
const buildThemeVarIndex = (theme: Theme): Map<string, unknown> => {
  const index = new Map<string, unknown>()
  const system = theme?.system
  if (!system || typeof system !== 'object') return index

  const stack: Array<{ path: string; value: unknown }> = [{ path: '', value: system }]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || !current.value || typeof current.value !== 'object') continue

    for (const [key, rawValue] of Object.entries(current.value as Record<string, unknown>)) {
      const path = current.path ? `${current.path}.${key}` : key
      if (rawValue === null || rawValue === undefined) continue

      if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
        index.set(toVarName(path), rawValue)
        continue
      }
      if (typeof rawValue === 'object') {
        const maybeDefault = (rawValue as Record<string, unknown>).default
        if (typeof maybeDefault === 'string' || typeof maybeDefault === 'number' || typeof maybeDefault === 'boolean') {
          index.set(toVarName(path), maybeDefault)
        }
        stack.push({ path, value: rawValue })
      }
    }
  }
  return index
}

/** One index per theme object, rebuilt only when the theme identity changes. */
const varIndexCache = new WeakMap<object, Map<string, unknown>>()

const getThemeVarIndex = (theme: Theme): Map<string, unknown> => {
  const cached = varIndexCache.get(theme as unknown as object)
  if (cached) return cached
  const index = buildThemeVarIndex(theme)
  varIndexCache.set(theme as unknown as object, index)
  return index
}

/** Human-readable token path for a variable name, for message text only. */
const toReadablePath = (varName: string): string => `theme.${varName.replace('--meonode-theme-', '').replace(/-/g, '.')}`

/**
 * Suggests the defined variables that share a prefix with an undefined one —
 * which is exactly what an author sees when they point at a grouping object
 * (`theme.brand`) instead of one of its leaves.
 */
const siblingsOf = (varName: string, index: Map<string, unknown>): string[] => {
  const prefix = `${varName}-`
  const out: string[] = []
  for (const name of index.keys()) {
    if (name.startsWith(prefix)) out.push(toReadablePath(name))
    if (out.length === 6) break
  }
  return out
}

const VAR_REF = /var\(\s*(--meonode-theme-[\w-]+)/g

/**
 * Reports one variable reference that will not produce a style.
 * @param varName The referenced custom property.
 * @param property The CSS property it was written against, when known.
 * @param index The active theme's defined-variable index.
 */
const checkVarReference = (varName: string, property: string | undefined, index: Map<string, unknown>): void => {
  // `var(--x--len, var(--x))` deliberately references a variant that only exists
  // for numeric tokens; the fallback handles every other case. Reporting the
  // absent variant would flag correct code, so only the plain name is checked.
  if (varName.endsWith(toLengthVarName(''))) return

  const seenKey = property ? `${varName}|${property}` : varName
  if (reported.has(seenKey)) return

  const where = property ? ` (used for \`${property}\`)` : ''

  if (!index.has(varName)) {
    reported.add(seenKey)
    const siblings = siblingsOf(varName, index)
    console.warn(
      `[MeoNode] ${toReadablePath(varName)}${where} is not defined by the active theme. ` +
        `It emits var(${varName}), which no :root rule declares, so the browser drops that declaration. ` +
        (siblings.length ? `Did you mean one of: ${siblings.join(', ')}?` : 'Check the token path against your theme.'),
    )
    return
  }
}

/**
 * Reports a value written straight onto a style prop that will not survive as a
 * length. Separate from the token path because nothing resolves it — it goes
 * from the call site to Emotion unchanged.
 * @param property The CSS property.
 * @param value The literal value written.
 */
const checkLiteralValue = (property: string, value: unknown): void => {
  // Only strings. A real number here is exactly the case Emotion handles — it
  // adds `px` itself — so warning on it would be wrong. The number case is only
  // a problem when it arrives through a custom property, which the token path
  // covers.
  if (typeof value !== 'string' || !isUnitlessLength(property, value)) return
  const seenKey = `literal:${property}:${String(value)}`
  if (reported.has(seenKey)) return
  reported.add(seenKey)
  console.warn(
    `[MeoNode] \`${property}: ${JSON.stringify(value)}\` is a number written as a string, so Emotion does not add \`px\` to it — ` +
      `it only does that for real numbers. This emits \`${property}: ${value}\`, which is not a valid length and is dropped. ` +
      `Write it as ${value} or '${value}px'.`,
  )
}

/**
 * Media features whose value is a **length**, so a bare number is invalid.
 *
 * Deliberately not "any unitless number in a media feature": several features
 * legitimately take one (`monochrome: 0`, `min-color: 8`, `color-index: 256`,
 * `grid: 1`), and flagging those would be wrong.
 */
const LENGTH_MEDIA_FEATURES = /\(\s*(?:min-|max-)?(?:width|height|device-width|device-height|inline-size|block-size)\s*:\s*(-?(?:\d+\.?\d*|\.\d+))\s*\)/g

/**
 * Reports a media query whose length feature lost its unit.
 *
 * Keys take the `resolve` path rather than the `var` path — a custom property
 * is invalid inside a media feature — so a numeric token is substituted as bare
 * text. `@media (max-width: 768)` is not a valid feature, and the browser drops
 * the **entire block**, not just one declaration.
 * @param key The resolved key, e.g. `'@media (max-width: 768)'`.
 */
const checkMediaQueryKey = (key: string): void => {
  LENGTH_MEDIA_FEATURES.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = LENGTH_MEDIA_FEATURES.exec(key)) !== null) {
    // `0` needs no unit and is perfectly valid.
    if (Number(match[1]) === 0) continue
    const seenKey = `mq:${key}`
    if (reported.has(seenKey)) return
    reported.add(seenKey)
    console.warn(
      `[MeoNode] \`${key}\` has a length with no unit, so it is not a valid media feature and the browser drops the whole block. ` +
        `Media queries cannot use CSS variables, so a numeric theme token is substituted as bare text here. ` +
        `Give the token a unit, e.g. '${match[1]}px'.`,
    )
    return
  }
}

/** Depth budget mirroring the resolution walk; `css` objects are shallow. */
const MAX_DEPTH = 16

/**
 * Walks a resolved style object and reports every theme token that will not
 * produce a style.
 *
 * Never throws and never mutates. Returns immediately in production, so the
 * cost on a production render is a single boolean check.
 * @param value The style object or value to inspect.
 * @param theme The active theme.
 * @param property The CSS property currently in scope, when known.
 * @param depth Current recursion depth.
 */
export const reportThemeIssues = (value: unknown, theme: Theme | undefined, property?: string, depth = 0): void => {
  if (depth > MAX_DEPTH || !diagnosticsEnabled()) return

  if (typeof value === 'string' || typeof value === 'number') {
    if (typeof value === 'string' && value.includes('--meonode-theme-')) {
      // Token references need the theme to say whether the variable exists.
      if (!theme) return
      const index = getThemeVarIndex(theme)
      VAR_REF.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = VAR_REF.exec(value)) !== null) {
        checkVarReference(match[1], property, index)
      }
      return
    }
    // A literal written straight onto the prop. Needs no theme.
    if (property) checkLiteralValue(property, value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) reportThemeIssues(item, theme, property, depth + 1)
    return
  }

  if (typeof value === 'object' && value !== null) {
    const proto = Object.getPrototypeOf(value)
    // Plain objects only, matching the resolution walk: class instances (refs,
    // React elements, MUI internals) hold no style declarations.
    if (proto !== null && proto !== Object.prototype) return
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      // A key that is a selector or at-rule is not a CSS property; keep the
      // enclosing property in scope rather than reporting against `&:hover`.
      const isAtRuleOrSelector = key.startsWith('&') || key.startsWith('@')
      if (key.startsWith('@')) checkMediaQueryKey(key)
      const nextProperty = isAtRuleOrSelector ? property : key
      reportThemeIssues(child, theme, nextProperty, depth + 1)
    }
  }
}

/** Test seam: clears the once-per-problem memo. */
export const __resetThemeDiagnostics = (): void => reported.clear()
