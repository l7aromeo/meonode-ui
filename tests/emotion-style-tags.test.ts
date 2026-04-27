import { Div, Node } from '@src/main.js'
import { cleanup, render } from '@testing-library/react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

afterEach(() => {
  cleanup()
  Node.clearCaches()
  // Clean up style tags injected by Emotion to have a clean state for each test
  document.head.querySelectorAll('style').forEach(s => s.remove())
})

describe('Emotion Style Tag Generation', () => {
  it('should count style tags for a simple nested Div structure', () => {
    // We start with a clean head
    expect(document.head.querySelectorAll('style').length).toBe(0)

    const cache = createCache({ key: 'testa' })

    const App = Div({
      backgroundColor: 'red',
      children: Div({ color: 'yellow' }),
    })

    render(Node(CacheProvider, { value: cache, children: App.render() }).render())

    const styleTags: NodeListOf<HTMLStyleElement> = document.head.querySelectorAll('style[data-emotion="testa"]')
    console.log(`Number of style tags generated (testa): ${styleTags.length}`)

    styleTags.forEach((tag, index) => {
      const sheet = tag.sheet as CSSStyleSheet
      console.log(`Style tag ${index} has ${sheet?.cssRules?.length || 0} rules`)
      if (sheet?.cssRules) {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          console.log(`  Rule ${i}: ${sheet.cssRules[i].cssText}`)
        }
      }
    })

    // Assert that we have style tags.
    expect(styleTags.length).toBeGreaterThan(0)
  })

  it('should see if many unique styles still use a single style tag', () => {
    // We start with a clean head
    expect(document.head.querySelectorAll('style').length).toBe(0)

    const cache = createCache({ key: 'testb' })

    const children = Array.from({ length: 100 }).map((_, i) => Div({ color: `rgb(${i}, ${i}, ${i})`, children: `Child ${i}` }))

    const App = Div({ children })

    render(Node(CacheProvider, { value: cache, children: App.render() }).render())

    const styleTags = document.head.querySelectorAll('style[data-emotion="testb"]')
    console.log(`Number of style tags for 100 unique styles: ${styleTags.length}`)

    let totalRules = 0
    styleTags.forEach(tag => {
      totalRules += ((tag as HTMLStyleElement).sheet as CSSStyleSheet)?.cssRules?.length || 0
    })
    console.log(`Total rules for 100 unique styles: ${totalRules}`)

    // Runtime implementations can differ in how Emotion shards style tags.
    expect(styleTags.length).toBeGreaterThan(0)
    expect(totalRules).toBeGreaterThanOrEqual(100)
  })

  it('should observe style tag behavior during state/prop changes', () => {
    expect(document.head.querySelectorAll('style').length).toBe(0)
    const cache = createCache({ key: 'testc' })

    const { rerender } = render(
      Node(CacheProvider, {
        value: cache,
        children: Div({ backgroundColor: 'red', children: 'State Test' }).render(),
      }).render(),
    )

    let styleTags: NodeListOf<HTMLStyleElement> = document.head.querySelectorAll('style[data-emotion="testc"]')
    const initialRules = Array.from(styleTags).reduce((sum, tag) => sum + (((tag as HTMLStyleElement).sheet as CSSStyleSheet)?.cssRules.length || 0), 0)
    console.log(`Initial rules: ${initialRules}`)

    // Simulate state change by rerendering with a different color
    rerender(
      Node(CacheProvider, {
        value: cache,
        children: Div({ backgroundColor: 'blue', children: 'State Test' }).render(),
      }).render(),
    )

    styleTags = document.head.querySelectorAll('style[data-emotion="testc"]')
    const updatedRules = Array.from(styleTags).reduce((sum, tag) => sum + ((tag.sheet as CSSStyleSheet)?.cssRules.length || 0), 0)
    console.log(`Updated rules: ${updatedRules}`)
    console.log(`Number of style tags after change: ${styleTags.length}`)

    for (const tag of styleTags) {
      const rules = (tag.sheet as CSSStyleSheet)?.cssRules || []
      for (let i = 0; i < rules.length; i++) {
        console.log(`  Rule ${i}: ${rules[i].cssText}`)
      }
    }

    // Emotion should keep previously generated styles and add the updated one.
    expect(styleTags.length).toBeGreaterThan(0)
    expect(updatedRules).toBeGreaterThan(initialRules)
  })
})
