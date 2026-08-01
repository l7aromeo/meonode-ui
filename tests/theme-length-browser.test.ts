import { it, expect } from 'vitest'
import { chromium } from 'playwright'
import { ThemeUtil } from '@src/util/theme.util.js'
import { buildThemeVariablesCss } from '@src/util/server-theme.util.js'

/**
 * The purpose of this release, checked in a real browser: a theme token holding
 * a bare number must produce a real length, and everything else must be
 * unchanged.
 */
const theme = {
  mode: 'light',
  system: {
    spacing: { md: 16, none: 0, asString: '16', proper: '24px' },
    layer: { modal: 40 },
    text: { tight: 1.25 },
    primary: { default: '#3B82F6' },
    brand: { light: '#AAAAAA' },
  },
} as never

it('numeric theme tokens become real lengths in a browser', async () => {
  const decls = ThemeUtil.resolveObjWithTheme(
    {
      padding: 'theme.spacing.md', // number -> must be 16px
      marginTop: 'theme.spacing.asString', // numeric string -> must be 16px
      gap: 'theme.spacing.proper', // already united -> 24px
      borderRadius: 'theme.spacing.none', // zero -> 0px
      zIndex: 'theme.layer.modal', // unitless -> 40, NOT 40px
      lineHeight: 'theme.text.tight', // unitless ratio -> not 1.25px
      color: 'theme.primary', // colour -> unchanged
      border: '2px solid theme.brand.light',
    },
    theme,
    { themeStringsMode: 'vars' },
  ) as Record<string, string>

  const css = Object.entries(decls)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${v};`)
    .join('')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>
${buildThemeVariablesCss(theme)}
#t{ position:relative; font-size:16px; ${css} }
</style></head><body><div id="t"></div></body></html>`)
  const c = await page.evaluate(() => {
    const s = getComputedStyle(document.getElementById('t')!)
    return {
      padding: s.padding,
      marginTop: s.marginTop,
      gap: s.gap,
      borderRadius: s.borderRadius,
      zIndex: s.zIndex,
      lineHeight: s.lineHeight,
      color: s.color,
      borderWidth: s.borderWidth,
      borderColor: s.borderColor,
    }
  })
  await browser.close()
  console.log('COMPUTED:', JSON.stringify(c, null, 0))

  expect(c.padding).toBe('16px') // ← the bug: was 0px (declaration dropped)
  expect(c.marginTop).toBe('16px')
  expect(c.gap).toBe('24px')
  expect(c.borderRadius).toBe('0px')
  expect(c.zIndex).toBe('40') // ← must NOT become 40px
  expect(c.lineHeight).toBe('20px') // 1.25 x 16px, i.e. still a ratio
  expect(c.color).toBe('rgb(59, 130, 246)')
  expect(c.borderWidth).toBe('2px')
  expect(c.borderColor).toBe('rgb(170, 170, 170)')
}, 60000)
