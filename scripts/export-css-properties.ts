import CSSPropertySet from '@src/constant/css-properties.const.js'

/**
 * Exports the CSS property set as a sorted JSON array to stdout.
 * This is used by the Rust compiler to codegen a static CSS-property set.
 */
const properties = Array.from(CSSPropertySet).sort()
console.log(JSON.stringify(properties, null, 0))
