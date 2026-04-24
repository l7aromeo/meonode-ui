import { chromium, type Browser, type BrowserContext } from '@playwright/test'

/**
 * RSC boundary integration tests.
 *
 * Runs against a live Next dev server booted in tests/globalSetup.rsc.ts.
 * Each test fetches a page and asserts:
 *   1. HTTP 200
 *   2. No RSC / hydration error markers in the HTML
 *   3. Page-specific content
 *
 * Tests that reproduce known defects use `it.failing(...)` so the suite
 * reports them as expected failures until the underlying bug is fixed.
 */

const getPort = () => process.env.__RSC_FIXTURE_PORT__ as string
const base = () => `http://localhost:${getPort()}`
let browser: Browser | null = null
let browserContext: BrowserContext | null = null

const ERROR_MARKERS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /Hydration failed/i, label: 'Hydration failed' },
  { pattern: /did not match/i, label: 'hydration mismatch' },
  { pattern: /Server Components render/i, label: 'RSC render error' },
  { pattern: /Error: Objects are not valid as a React child/i, label: 'invalid React child' },
  { pattern: /Error: Functions are not valid as a React child/i, label: 'function as React child' },
  { pattern: /A component was suspended by an uncached promise/i, label: 'suspended uncached promise' },
]

const HYDRATION_RUNTIME_MARKERS: RegExp[] = [/A tree hydrated but some attributes of the server rendered HTML/i, /Hydration failed/i, /did not match/i]

beforeAll(async () => {
  try {
    browser = await chromium.launch({ headless: true })
    browserContext = await browser.newContext()
  } catch (error) {
    throw new Error(`Failed to launch Playwright Chromium. Run "bunx playwright install chromium" and retry.\n${String(error)}`, { cause: error })
  }
})

afterAll(async () => {
  await browserContext?.close()
  await browser?.close()
  browserContext = null
  browser = null
})

async function getPage(pathname: string): Promise<{ status: number; html: string }> {
  if (!browserContext) {
    throw new Error('Playwright browser context is not initialized')
  }

  const page = await browserContext.newPage()
  const runtimeMessages: string[] = []
  page.on('console', msg => {
    runtimeMessages.push(msg.text())
  })
  page.on('pageerror', error => {
    runtimeMessages.push(error.message)
  })
  try {
    const response = await page.goto(`${base()}${pathname}`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => document.readyState === 'complete')
    await page.evaluate(
      () =>
        new Promise<void>(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
    const html = await page.content()
    const status = response?.status() ?? 0

    if (status === 200) {
      const hydrationRuntimeError = runtimeMessages.find(message => HYDRATION_RUNTIME_MARKERS.some(pattern => pattern.test(message)))
      if (hydrationRuntimeError) {
        throw new Error(
          `Hydration runtime warning/error found for "${pathname}".\n` +
            `Matched message:\n${hydrationRuntimeError}\n\n` +
            `First 2KB of hydrated HTML:\n${html.slice(0, 2048)}`,
        )
      }
    }

    return { status, html }
  } finally {
    await page.close()
  }
}

function assertNoRscErrors(html: string) {
  for (const { pattern, label } of ERROR_MARKERS) {
    if (pattern.test(html)) {
      throw new Error(`RSC error marker "${label}" found in HTML.\nMatched pattern: ${pattern}\n\nFirst 2KB of HTML:\n${html.slice(0, 2048)}`)
    }
  }
}

function assertNoObjectAttrLeaks(html: string) {
  // An attribute rendered as `"[object Object]"` indicates an object leaked
  // to the DOM attribute path. Covers SSR variant of basic-rendering test.
  expect(html).not.toMatch(/="?\[object Object\]"?/)
}

function assertNoNextHydrationErrorNotes(html: string) {
  expect(html).not.toContain('id="nextjs__container_errors__notes"')
  expect(html).not.toContain('A tree hydrated but some attributes of the server rendered HTML')
}

function getComputedStylesFromEmotionCss(html: string, testId: string, properties: readonly string[]): Record<string, string | null> {
  const elementTagRegex = new RegExp(`<[^>]*data-testid=["']${testId}["'][^>]*>`, 'i')
  const elementTag = html.match(elementTagRegex)?.[0] ?? ''
  const classAttr = elementTag.match(/\bclass=["']([^"']+)["']/i)?.[1] ?? ''
  const classes = classAttr.split(/\s+/).filter(Boolean)

  const styleBlocks = [...html.matchAll(/<style[^>]*data-emotion="[^"]*"[^>]*>([\s\S]*?)<\/style>/gi)]
  const cssText = styleBlocks.map(m => m[1]).join('\n')

  const result: Record<string, string | null> = {}
  for (const p of properties) result[p] = null

  for (const cls of classes) {
    const safeCls = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const classRule = new RegExp(`\\.${safeCls}\\{([^}]*)\\}`, 'i')
    const ruleBody = cssText.match(classRule)?.[1]
    if (!ruleBody) continue
    for (const prop of properties) {
      if (result[prop] !== null) continue
      const safeProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Anchor to start-of-body or `;` so `width` does not match `min-width`, etc.
      const propRegex = new RegExp(`(?:^|;)\\s*${safeProp}\\s*:\\s*([^;]+?)\\s*(?:;|$)`, 'i')
      const v = ruleBody.match(propRegex)?.[1]
      if (v) result[prop] = v.trim()
    }
    if (properties.every(p => result[p] !== null)) break
  }

  return result
}

function getElementClassNameByTestId(html: string, testId: string): string | null {
  const elementTagRegex = new RegExp(`<[^>]*data-testid=["']${testId}["'][^>]*>`, 'i')
  const elementTag = html.match(elementTagRegex)?.[0]
  if (!elementTag) return null
  return elementTag.match(/\bclass=["']([^"']+)["']/i)?.[1] ?? null
}

// ----- Category A -----

describe('A. Server-only rendering', () => {
  it('baseline Div renders text from server', async () => {
    const { status, html } = await getPage('/')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('hi from server')
    expect(html).toMatch(/data-testid="baseline"/)
  })

  it('nested server components render', async () => {
    const { status, html } = await getPage('/server-nested')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('header-text')
    expect(html).toContain('section-text')
    expect(html).toMatch(/data-testid="nested-section"/)
    expect(html).toMatch(/data-testid="nested-header"/)
  })

  it('server-rendered css prop produces Emotion critical CSS', async () => {
    const { status, html } = await getPage('/server-css')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('styled from server')
    // An Emotion <style> tag with our key should be present.
    expect(html).toMatch(/data-emotion="meonode-css[^"]*"/)
    // The color value should appear in the emitted styles (red == 255,0,0).
    expect(html.toLowerCase()).toMatch(/color:\s*rgb\(255,\s*0,\s*0\)|color:\s*#ff0000|color:red/)
  })

  it('Component HOC renders from server', async () => {
    const { status, html } = await getPage('/server-component-hoc')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('hoc-rendered')
    expect(html).toMatch(/data-testid="hoc-label"/)
  })
})

// ----- Category B -----

describe('B. Server → Client boundary', () => {
  it('Node(ClientComp) inline from server renders', async () => {
    const { status, html } = await getPage('/server-node-client')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('node-inline:0')
    expect(html).toMatch(/data-testid="some-client"/)
  })

  it('createNode(ClientComp) in neutral module works from server', async () => {
    const { status, html } = await getPage('/server-createnode-neutral')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('createnode-neutral:0')
  })

  it.failing('createNode(ClientComp) in a "use client" module works from server', async () => {
    const { status, html } = await getPage('/server-createnode-client')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('createnode-client:0')
  })

  it('direct client function call from server (documents behavior)', async () => {
    // This is an anti-pattern, but we document runtime behavior here.
    const { status, html } = await getPage('/server-direct-client')
    // Record whatever happens: either renders (flow works) or errors (bad pattern).
    // We only assert HTTP-level liveness and no hard crash marker here.
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(600)
    // If it did render, check content; otherwise capture a snapshot in the log.
    if (status === 200) {
      // We do NOT call assertNoRscErrors — this test is documentary.
      // Log the presence/absence of the element so maintainers can see what Next does.

      console.log('[doc] /server-direct-client status=200, contains direct-call:', html.includes('direct-call:0'))
    } else {
      console.log(`[doc] /server-direct-client returned ${status}`)
    }
  })

  it('ThemeProvider wraps server-composed children', async () => {
    const { status, html } = await getPage('/theme-server-children')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('themed-from-server')
    // theme.primary should resolve either directly to rgb() or via CSS variables.
    expect(html.toLowerCase()).toMatch(
      /background-color:\s*rgb\(0,\s*128,\s*0\)|background-color:\s*rgb\(255,\s*107,\s*107\)|background-color:\s*var\(--meonode-theme-primary\)/,
    )
  })

  it('PortalProvider + PortalHost in layout does not error', async () => {
    const { status, html } = await getPage('/portal-in-layout')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('portal-host-present')
  })

  it('StyleRegistry collects critical CSS from multiple styled nodes', async () => {
    const { status, html } = await getPage('/style-registry')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('styled-a')
    expect(html).toContain('styled-b')
    // Find all Emotion style tags with the meonode-css key.
    const styleTagMatches = html.match(/<style [^>]*data-emotion="meonode-css[^"]*"/g) || []
    expect(styleTagMatches.length).toBeGreaterThan(0)
  })
})

// ----- Category C: next/link -----

describe('C. next/link cluster (the reported defect)', () => {
  it('[BUG REPRO] createNode(Link) in neutral module from server page', async () => {
    // This is the exact case the user reported as broken. If this test
    // passes (i.e. no RSC error marker found), flip it from `.failing` to
    // a regular `it`, because the bug is fixed.
    const { status, html } = await getPage('/next-link-neutral')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('go-home')
  })

  it('Node(Link) inline from server renders', async () => {
    const { status, html } = await getPage('/next-link-inline')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('go-home-inline')
  })

  it.failing('createNode(Link) in a "use client" module from server renders', async () => {
    const { status, html } = await getPage('/next-link-client-module')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('go-home-client-module')
  })

  it('Link wrapped in a "use client" component works (user workaround)', async () => {
    const { status, html } = await getPage('/next-link-wrapped-client')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toMatch(/data-testid="client-navbar"/)
    expect(html).toContain('home')
  })

  it('client component function passed as prop to client renderer from server', async () => {
    const { status, html } = await getPage('/client-function-prop')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('function-prop-repro')
  })

  it('direct Link(...) function call from server (diagnostic)', async () => {
    const { status, html } = await getPage('/next-link-direct-call')
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(600)
    if (status === 200) {
      expect(html).toContain('direct-link-call')
    } else {
      console.log(`[doc] /next-link-direct-call returned ${status}`)
    }
  })

  it('direct Link(...) function call from client page (diagnostic)', async () => {
    const { status, html } = await getPage('/next-link-direct-call-client')
    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(600)
    if (status === 200) {
      expect(html).toContain('direct-link-call-client')
    } else {
      console.log(`[doc] /next-link-direct-call-client returned ${status}`)
    }
  })
})

// ----- Category D: async server components -----

describe('D. Rule A (async server components)', () => {
  it('await AsyncServerComp() renders correctly', async () => {
    const { status, html } = await getPage('/async-await')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('async:awaited')
    expect(html).toMatch(/data-testid="async-server"/)
  })

  it('[ANTI-PATTERN] Node(AsyncServerComp) from server — documents failure', async () => {
    // Wrapping an async component in Node() without awaiting should fail.
    // If this unexpectedly passes, the engine handles async wrappers correctly
    // and this test can be flipped to a positive assertion.
    const { status, html } = await getPage('/async-node-wrap')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('async:node-wrapped')
  })

  it('nested await (two-level) works', async () => {
    const { status, html } = await getPage('/async-nested')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('async:inner')
    expect(html).toMatch(/data-testid="async-outer"/)
  })
})

// ----- Category E: client ← server children -----

describe('E. Client provider receives server children payload', () => {
  it('re-fetch returns consistent server content inside client provider (case 19)', async () => {
    // Fetch twice and ensure the server content is emitted each time.
    const a = await getPage('/theme-server-children?v=1')
    const b = await getPage('/theme-server-children?v=2')
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    assertNoRscErrors(a.html)
    assertNoRscErrors(b.html)
    expect(a.html).toContain('themed-from-server')
    expect(b.html).toContain('themed-from-server')
  })

  it('theme values resolve in server-rendered node under client ThemeProvider', async () => {
    const { status, html } = await getPage('/theme-resolution-boundary')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('theme-boundary-content')
    expect(html).toContain('go-home')
    // Validate theme token propagation for both container and nested Link styles.
    expect(html.toLowerCase()).toMatch(/background-color:\s*#f8f8f8|background-color:\s*var\(--meonode-theme-base\)/)
    expect(html.toLowerCase()).toMatch(/padding:\s*16(?:px)?|padding:\s*var\(--meonode-theme-spacing-md\)/)
    expect(html.toLowerCase()).toMatch(/color:\s*#333333|color:\s*var\(--meonode-theme-base-content\)/)
    expect(html.toLowerCase()).toMatch(/background-color:\s*rgb\(255,\s*107,\s*107\)|background-color:\s*var\(--meonode-theme-primary\)/)
    expect(html.toLowerCase()).toMatch(/color:\s*#ffffff|color:\s*var\(--meonode-theme-primary-content\)/)
  })
})

// ----- Category F: regression guards -----

describe('F. Regression guards', () => {
  const GUARD_PAGES = [
    '/',
    '/server-css',
    '/theme-server-children',
    '/style-registry',
    '/theme-resolution-boundary',
    '/server-node-client',
    '/server-createnode-neutral',
    '/server-createnode-client',
    '/next-link-inline',
    '/next-link-client-module',
    '/next-link-wrapped-client',
    '/async-await',
    '/async-nested',
  ]

  it.each(GUARD_PAGES)('no "[object Object]" attribute leaks on %s', async p => {
    const { html } = await getPage(p)
    assertNoObjectAttrLeaks(html)
  })

  it('no duplicate Emotion style IDs across /style-registry', async () => {
    const { html } = await getPage('/style-registry')
    // Gather the id list from each style tag and verify no duplicates.
    const tags = [...html.matchAll(/<style [^>]*data-emotion="meonode-css ([^"]*)"/g)]
    const allIds: string[] = []
    for (const t of tags) {
      for (const id of t[1].trim().split(/\s+/).filter(Boolean)) {
        allIds.push(id)
      }
    }
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
  })

  it('no non-css artifacts in emitted style payload', async () => {
    const { html } = await getPage('/next-link-inline')
    expect(html).not.toContain('true.meonode-css-')
  })
})

// ----- Category G: client -> server component via Node -----

describe('G. Client calling Node(ServerComponent)', () => {
  it('client page can render Node(PlainServer)', async () => {
    const { status, html } = await getPage('/client-node-server')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('plain-server:from-client')
  })

  it('client page can render Node(AsyncServer)', async () => {
    const { status, html } = await getPage('/client-node-async-server')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('async:from-client')
  })
})

describe('H. Server calling Node(ServerComponent)', () => {
  it('server page can render Node(PlainServer)', async () => {
    const { status, html } = await getPage('/server-node-server')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('plain-server:from-server')
  })
})

describe('I. Server calling Node(client third-party reference)', () => {
  it('server page can render Node(GoogleAnalytics) without client-reference access errors', async () => {
    const { status, html } = await getPage('/google-analytics-node')
    expect(status).toBe(200)
    assertNoRscErrors(html)
    expect(html).toContain('ga-node-mounted')
    expect(html).toMatch(/data-testid="ga-node-page"/)
  })
})

describe('J. styling parity routes (server vs client)', () => {
  it('emits matching Emotion output for theme-token styling', async () => {
    const server = await getPage('/styling-parity-theme-server')
    const client = await getPage('/styling-parity-theme-client')

    expect(server.status).toBe(200)
    expect(client.status).toBe(200)
    assertNoRscErrors(server.html)
    assertNoRscErrors(client.html)
    assertNoNextHydrationErrorNotes(client.html)

    const props = ['width', 'height', 'background-color'] as const
    const serverStyles = getComputedStylesFromEmotionCss(server.html, 'styling-parity-theme-shared', props)
    const clientStyles = getComputedStylesFromEmotionCss(client.html, 'styling-parity-theme-shared', props)
    const serverClassName = getElementClassNameByTestId(server.html, 'styling-parity-theme-shared')
    const clientClassName = getElementClassNameByTestId(client.html, 'styling-parity-theme-shared')
    console.log('[next-image-styles]', { serverStyles, clientStyles })

    expect(serverStyles.width).toBe('40px')
    expect(serverStyles.height).toBe('40px')
    expect(serverStyles).toEqual(clientStyles)
    expect(serverClassName).toBeTruthy()
    expect(clientClassName).toBeTruthy()
    expect(serverClassName).toBe(clientClassName)
  })

  it('keeps matching Emotion output for raw CSS styling', async () => {
    const server = await getPage('/styling-parity-raw-server')
    const client = await getPage('/styling-parity-raw-client')

    expect(server.status).toBe(200)
    expect(client.status).toBe(200)
    assertNoRscErrors(server.html)
    assertNoRscErrors(client.html)
    assertNoNextHydrationErrorNotes(client.html)

    const props = ['width', 'height', 'background-color'] as const
    const serverStyles = getComputedStylesFromEmotionCss(server.html, 'styling-parity-raw-shared', props)
    const clientStyles = getComputedStylesFromEmotionCss(client.html, 'styling-parity-raw-shared', props)
    const serverClassName = getElementClassNameByTestId(server.html, 'styling-parity-raw-shared')
    const clientClassName = getElementClassNameByTestId(client.html, 'styling-parity-raw-shared')

    expect(serverStyles.width).toBe('40px')
    expect(serverStyles.height).toBe('40px')
    expect(serverStyles['background-color']).toBe('red')
    expect(serverStyles).toEqual(clientStyles)
    expect(serverClassName).toBeTruthy()
    expect(clientClassName).toBeTruthy()
    expect(serverClassName).toBe(clientClassName)
  })
})
