import unitless from '@emotion/unitless'

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
 * Properties that take a **length**, and where a bare number is therefore
 * invalid. A token used for one of these references the paired `--len`
 * variable so a numeric value arrives with its unit.
 *
 * Derived, never hand-written, as the intersection of two authorities:
 *
 * 1. **`csstype`** marks every length-accepting property as
 *    `Property.X<TLength>` — the same types React's `CSSProperties` is built
 *    from, so this tracks whatever React supports.
 * 2. **minus `@emotion/unitless`**, which lists the properties where a bare
 *    number is meaningful in its own right.
 *
 * The subtraction is the important half. `lineHeight`, `flex`, `tabSize`,
 * `strokeWidth`, `columns`, `strokeDasharray`, `strokeDashoffset`,
 * `borderImageWidth` and `borderImageOutset` all accept a length *and* a bare
 * number, and for those the bare number is what the author meant — appending
 * `px` to `lineHeight: 1.25` would be wrong.
 *
 * `tests/length-properties.test.ts` re-derives this at test time and fails on
 * any drift, so a `csstype` or `@emotion/unitless` upgrade cannot silently
 * leave it stale.
 */
const LENGTH_PROPERTIES = new Set<string>([
  'MozBorderEndWidth',
  'MozColumnRule',
  'MozColumnRuleWidth',
  'MozColumnWidth',
  'MozColumns',
  'MozMarginEnd',
  'MozMarginStart',
  'MozOsxFontSmoothing',
  'MozOutlineRadius',
  'MozOutlineRadiusBottomleft',
  'MozOutlineRadiusBottomright',
  'MozOutlineRadiusTopleft',
  'MozOutlineRadiusTopright',
  'MozPaddingEnd',
  'MozPaddingStart',
  'MozPerspective',
  'MozPerspectiveOrigin',
  'MozTabSize',
  'MozTransformOrigin',
  'WebkitBackgroundSize',
  'WebkitBorderBefore',
  'WebkitBorderBeforeWidth',
  'WebkitBorderBottomLeftRadius',
  'WebkitBorderBottomRightRadius',
  'WebkitBorderRadius',
  'WebkitBorderTopLeftRadius',
  'WebkitBorderTopRightRadius',
  'WebkitBoxReflect',
  'WebkitColumnRule',
  'WebkitColumnRuleWidth',
  'WebkitColumnWidth',
  'WebkitColumns',
  'WebkitFlex',
  'WebkitFlexBasis',
  'WebkitFontSmoothing',
  'WebkitLogicalHeight',
  'WebkitLogicalWidth',
  'WebkitMarginEnd',
  'WebkitMarginStart',
  'WebkitMask',
  'WebkitMaskBoxImageOutset',
  'WebkitMaskBoxImageWidth',
  'WebkitMaskPosition',
  'WebkitMaskPositionX',
  'WebkitMaskPositionY',
  'WebkitMaskSize',
  'WebkitMaxInlineSize',
  'WebkitPaddingEnd',
  'WebkitPaddingStart',
  'WebkitPerspective',
  'WebkitPerspectiveOrigin',
  'WebkitShapeMargin',
  'WebkitTextStroke',
  'WebkitTextStrokeWidth',
  'WebkitTransformOrigin',
  'animationRange',
  'animationRangeEnd',
  'animationRangeStart',
  'background',
  'backgroundPosition',
  'backgroundPositionX',
  'backgroundPositionY',
  'backgroundSize',
  'baselineShift',
  'blockSize',
  'border',
  'borderBlock',
  'borderBlockEnd',
  'borderBlockEndWidth',
  'borderBlockStart',
  'borderBlockStartWidth',
  'borderBlockWidth',
  'borderBottom',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomWidth',
  'borderEndEndRadius',
  'borderEndStartRadius',
  'borderInline',
  'borderInlineEnd',
  'borderInlineEndWidth',
  'borderInlineStart',
  'borderInlineStartWidth',
  'borderInlineWidth',
  'borderLeft',
  'borderLeftWidth',
  'borderRadius',
  'borderRight',
  'borderRightWidth',
  'borderSpacing',
  'borderStartEndRadius',
  'borderStartStartRadius',
  'borderTop',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopWidth',
  'borderWidth',
  'bottom',
  'columnGap',
  'columnRule',
  'columnRuleWidth',
  'columnWidth',
  'containIntrinsicBlockSize',
  'containIntrinsicHeight',
  'containIntrinsicInlineSize',
  'containIntrinsicSize',
  'containIntrinsicWidth',
  'cx',
  'cy',
  'flexBasis',
  'fontSize',
  'fontSmooth',
  'gap',
  'gridAutoColumns',
  'gridAutoRows',
  'gridTemplateColumns',
  'gridTemplateRows',
  'height',
  'inlineSize',
  'inset',
  'insetBlock',
  'insetBlockEnd',
  'insetBlockStart',
  'insetInline',
  'insetInlineEnd',
  'insetInlineStart',
  'left',
  'letterSpacing',
  'lineHeightStep',
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginTop',
  'mask',
  'maskBorderOutset',
  'maskBorderWidth',
  'maskPosition',
  'maskSize',
  'maxBlockSize',
  'maxHeight',
  'maxInlineSize',
  'maxWidth',
  'minBlockSize',
  'minHeight',
  'minInlineSize',
  'minWidth',
  'motion',
  'motionDistance',
  'msFlex',
  'msGridColumns',
  'msGridRows',
  'msHyphenateLimitZone',
  'msScrollLimitXMax',
  'msScrollLimitXMin',
  'msScrollLimitYMax',
  'msScrollLimitYMin',
  'msTransformOrigin',
  'msWrapMargin',
  'objectPosition',
  'offset',
  'offsetAnchor',
  'offsetDistance',
  'offsetPosition',
  'outline',
  'outlineOffset',
  'outlineWidth',
  'overflowClipMargin',
  'padding',
  'paddingBlock',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingBottom',
  'paddingInline',
  'paddingInlineEnd',
  'paddingInlineStart',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'perspective',
  'perspectiveOrigin',
  'r',
  'right',
  'rowGap',
  'rx',
  'ry',
  'scrollMargin',
  'scrollMarginBlock',
  'scrollMarginBlockEnd',
  'scrollMarginBlockStart',
  'scrollMarginBottom',
  'scrollMarginInline',
  'scrollMarginInlineEnd',
  'scrollMarginInlineStart',
  'scrollMarginLeft',
  'scrollMarginRight',
  'scrollMarginTop',
  'scrollPadding',
  'scrollPaddingBlock',
  'scrollPaddingBlockEnd',
  'scrollPaddingBlockStart',
  'scrollPaddingBottom',
  'scrollPaddingInline',
  'scrollPaddingInlineEnd',
  'scrollPaddingInlineStart',
  'scrollPaddingLeft',
  'scrollPaddingRight',
  'scrollPaddingTop',
  'scrollSnapMargin',
  'scrollSnapMarginBottom',
  'scrollSnapMarginLeft',
  'scrollSnapMarginRight',
  'scrollSnapMarginTop',
  'shapeMargin',
  'textDecoration',
  'textDecorationThickness',
  'textIndent',
  'textUnderlineOffset',
  'top',
  'transformOrigin',
  'translate',
  'verticalAlign',
  'viewTimelineInset',
  'width',
  'wordSpacing',
  'x',
  'y',
])

/**
 * Whether a token used for this property should reference the length variant.
 * @param property The CSS property name.
 * @returns `true` for properties whose value is a length.
 */
export const isLengthProperty = (property: string): boolean => LENGTH_PROPERTIES.has(property)

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
