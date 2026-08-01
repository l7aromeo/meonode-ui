import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import unitlessModule from '@emotion/unitless'
import { isLengthProperty } from '@src/util/css-unit.util.js'
import CSSPropertySet, { LengthPropertySet } from '@src/constant/css-properties.const.js'

/**
 * The length-property set decides which declarations reference the paired
 * `--len` theme variable. It is derived, not hand-written, and this test is
 * what keeps it that way: it re-derives the set from the same two authorities
 * at test time and fails on any drift, so upgrading `csstype` or
 * `@emotion/unitless` cannot silently leave the shipped list stale.
 */

const unitless = (unitlessModule as unknown as { default?: Record<string, number> }).default ?? (unitlessModule as unknown as Record<string, number>)

/** Interfaces that React's `CSSProperties` composes. */
const CSSTYPE_INTERFACES = [
  'StandardLonghandProperties',
  'StandardShorthandProperties',
  'VendorLonghandProperties',
  'VendorShorthandProperties',
  'SvgProperties',
]

/**
 * Every property `csstype` parameterises by `TLength`, i.e. every property that
 * accepts a length.
 */
const deriveLengthAccepting = (): Set<string> => {
  const dts = fs.readFileSync('node_modules/csstype/index.d.ts', 'utf8')
  const found = new Set<string>()
  for (const name of CSSTYPE_INTERFACES) {
    const start = dts.indexOf(`export interface ${name}<`)
    if (start === -1) continue
    const body = dts.slice(start, dts.indexOf('\n}', start))
    for (const match of body.matchAll(/^\s{2}["']?([A-Za-z][\w-]*)["']?\?: [^;]*TLength[^;]*;/gm)) {
      found.add(match[1])
    }
  }
  return found
}

describe('length property set', () => {
  it('matches the derived intersection exactly', () => {
    const lengthAccepting = deriveLengthAccepting()
    expect(lengthAccepting.size).toBeGreaterThan(200)

    // csstype(TLength) INTERSECT CSSPropertySet MINUS unitless
    const expected = [...lengthAccepting].filter(p => CSSPropertySet.has(p) && unitless[p] !== 1).sort()
    const actual = expected.filter(isLengthProperty)

    // Nothing derived may be missing from the shipped set.
    expect(actual).toEqual(expected)

    // Nothing Emotion treats as unitless may be in it.
    const wronglyIncluded = [...lengthAccepting].filter(p => unitless[p] === 1 && isLengthProperty(p))
    expect(wronglyIncluded).toEqual([])
  })

  /**
   * These accept a length *and* a bare number, and the bare number is what an
   * author means. Appending `px` to `lineHeight: 1.25` would be wrong, so the
   * subtraction of Emotion's table is load-bearing, not a tidy-up.
   */
  it.each(['lineHeight', 'flex', 'tabSize', 'strokeWidth', 'strokeDasharray', 'strokeDashoffset', 'columns', 'borderImageWidth', 'borderImageOutset'])(
    'excludes `%s`, where a bare number is meaningful',
    property => {
      expect(isLengthProperty(property)).toBe(false)
    },
  )

  it.each(['zIndex', 'opacity', 'flexGrow', 'flexShrink', 'order', 'fontWeight', 'gridRow', 'columnCount', 'aspectRatio', 'animationIterationCount'])(
    'excludes the unitless property `%s`',
    property => {
      expect(isLengthProperty(property)).toBe(false)
    },
  )

  it.each(['padding', 'margin', 'width', 'height', 'gap', 'rowGap', 'columnGap', 'borderRadius', 'fontSize', 'top', 'inset', 'flexBasis', 'letterSpacing'])(
    'includes the length property `%s`',
    property => {
      expect(isLengthProperty(property)).toBe(true)
    },
  )

  it('ignores custom properties, which take a raw number legitimately', () => {
    expect(isLengthProperty('--gutter')).toBe(false)
  })

  /**
   * The compiler codegens its Rust copy from `export:css-props`, so a length
   * property that is not also a recognised CSS property would be generated into
   * one set and missing from the other.
   */
  it('is a subset of the recognised CSS property set', () => {
    const orphans = [...LengthPropertySet].filter(p => !CSSPropertySet.has(p))
    expect(orphans).toEqual([])
  })
})
