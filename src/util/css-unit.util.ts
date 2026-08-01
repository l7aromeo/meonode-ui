import unitless from '@emotion/unitless'
import { LengthPropertySet } from '@src/constant/css-properties.const.js'

/**
 * Shared rules for whether a CSS property needs a unit, and for the paired
 * "length" form of a theme variable.
 *
 * Both rewriters and the `:root` builder consult this, so they cannot disagree
 * about which declarations get the length treatment. A disagreement would emit
 * a reference to a variable that was never defined, which the browser drops
 * silently — the exact class of bug this exists to prevent.
 */

/**
 * Whether Emotion would append `px` to a raw number written against this
 * property.
 *
 * Mirrors `@emotion/serialize`'s `processStyleValue`:
 *
 * ```js
 * unitless[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0
 * ```
 *
 * The value test lives at the call sites, since they hold different things (a
 * literal here, a token's resolved value there).
 * @param property The CSS property name.
 * @returns `true` when a bare number is not a valid value for this property.
 */
export const wouldEmotionAddPx = (property: string): boolean => (unitless as Record<string, number | undefined>)[property] !== 1 && !property.startsWith('--')

/**
 * Whether a token used for this property should reference the length variant.
 * @param property The CSS property name.
 * @returns `true` for properties whose value is a length.
 */
export const isLengthProperty = (property: string): boolean => LengthPropertySet.has(property)

/**
 * Whether a raw theme value needs a unit appended before it can serve as a
 * length. Only bare numbers do: `0` is valid unitless, and a string is taken as
 * authored.
 * @param value The raw value from the theme.
 * @returns `true` when the paired length variable should be emitted.
 */
export const needsLengthVariant = (value: unknown): value is number | string => {
  if (typeof value === 'number') return value !== 0
  // A theme value is data, not authored CSS, so `'16'` is treated exactly like
  // `16`. Both would otherwise reach a length property as a bare number.
  if (typeof value !== 'string' || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return false
  return Number(value) !== 0
}

/**
 * The paired variable that carries the same token with `px` appended.
 *
 * Emitted only for numeric token values, and referenced only from length
 * properties as `var(--x--len, var(--x))`. The fallback is what makes this work
 * without knowing the token's type at the usage site: when no length variant
 * exists — a colour, a string that already has a unit — the reference falls
 * through to the plain variable and behaves exactly as before.
 * @param varName The plain variable name.
 * @returns The length-variant variable name.
 */
export const toLengthVarName = (varName: string): string => `${varName}--len`

/**
 * A reference that prefers the length variant and falls back to the plain one.
 * @param varName The plain variable name.
 * @returns The `var()` expression to emit.
 */
export const lengthVarRef = (varName: string): string => `var(${toLengthVarName(varName)}, var(${varName}))`

/**
 * Whether an object key is a nested selector or at-rule rather than a CSS
 * property. Such a key contributes no property of its own, so the enclosing
 * property stays in scope for anything inside it.
 * @param key The object key.
 * @returns `true` for selectors (`&:hover`) and at-rules (`@media …`).
 */
export const isSelectorOrAtRule = (key: string): boolean => key.startsWith('&') || key.startsWith('@')
