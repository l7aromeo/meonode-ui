import CSSPropertySet, { LengthPropertySet } from '@src/constant/css-properties.const.js'

/**
 * Exports the CSS property sets as sorted JSON to stdout.
 *
 * Used by the Rust compiler to codegen static CSS-property sets. Generating the
 * compiler's copies from this source is what stops the two from drifting: a
 * divergence would make the build-time theme rewrite disagree with the runtime
 * about which declarations reference the paired `--len` variable.
 *
 * Default output remains a bare array of every CSS property, so existing
 * consumers are unaffected. `--length` prints the length-property subset;
 * `--all` prints both, keyed by name.
 */
const properties = Array.from(CSSPropertySet).sort()
const lengthProperties = Array.from(LengthPropertySet).sort()

switch (process.argv[2]) {
  case '--length':
    console.log(JSON.stringify(lengthProperties, null, 0))
    break
  case '--all':
    console.log(JSON.stringify({ properties, lengthProperties }, null, 0))
    break
  default:
    console.log(JSON.stringify(properties, null, 0))
}
