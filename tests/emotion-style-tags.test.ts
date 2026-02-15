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

    const cache = createCache({ key: 'test-1' })

    const App = Div({
      backgroundColor: 'red',
      children: Div({ color: 'yellow' }),
    })

    render(Node(CacheProvider, { value: cache, children: App.render() }).render())

    const styleTags: NodeListOf<HTMLStyleElement> = document.head.querySelectorAll('style[data-emotion="test-1"]')
    console.log(`Number of style tags generated (test-1): ${styleTags.length}`)

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

    const cache = createCache({ key: 'test-2' })

    const children = Array.from({ length: 100 }).map((_, i) => Div({ color: `rgb(${i}, ${i}, ${i})`, children: `Child ${i}` }))

    const App = Div({ children })

    render(Node(CacheProvider, { value: cache, children: App.render() }).render())

    const styleTags = document.head.querySelectorAll('style[data-emotion="test-2"]')
    console.log(`Number of style tags for 100 unique styles: ${styleTags.length}`)

    let totalRules = 0
    styleTags.forEach(tag => {
      totalRules += ((tag as HTMLStyleElement).sheet as CSSStyleSheet)?.cssRules?.length || 0
    })
    console.log(`Total rules for 100 unique styles: ${totalRules}`)

    // Emotion usually batches rules into a few style tags.
    expect(styleTags.length).toBeGreaterThan(0)
    expect(styleTags.length).toBeLessThan(5)
  })

  it('should observe style tag behavior during state/prop changes', () => {
    expect(document.head.querySelectorAll('style').length).toBe(0)
    const cache = createCache({ key: 'test-3' })

    const { rerender } = render(
      Node(CacheProvider, {
        value: cache,
        children: Div({ backgroundColor: 'red', children: 'State Test' }).render(),
      }).render(),
    )

    let styleTags: NodeListOf<HTMLStyleElement> = document.head.querySelectorAll('style[data-emotion="test-3"]')
    const initialRules = (styleTags[0] as HTMLStyleElement).sheet?.cssRules.length || 0
    console.log(`Initial rules: ${initialRules}`)

    // Simulate state change by rerendering with a different color
    rerender(
      Node(CacheProvider, {
        value: cache,
        children: Div({ backgroundColor: 'blue', children: 'State Test' }).render(),
      }).render(),
    )

    styleTags = document.head.querySelectorAll('style[data-emotion="test-3"]')
    const updatedRules = styleTags[0].sheet?.cssRules.length || 0
    console.log(`Updated rules: ${updatedRules}`)
    console.log(`Number of style tags after change: ${styleTags.length}`)

    for (let i = 0; i < updatedRules; i++) {
      console.log(`  Rule ${i}: ${styleTags[0].sheet?.cssRules[i].cssText}`)
    }

    // Usually Emotion adds a new rule for the new class, it doesn't remove the old one immediately
    // and it definitely shouldn't create a new style tag.
    expect(styleTags.length).toBe(1)
    expect(updatedRules).toBeGreaterThan(initialRules)
  })
})
