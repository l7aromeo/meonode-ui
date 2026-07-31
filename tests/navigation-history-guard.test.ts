// @vitest-environment jsdom
//
// `NavigationCacheManagerUtil.start()` guards on `typeof window === 'undefined'`,
// but `_patchHistoryMethods` read the **bare global** `history`. Those are not
// the same thing: a jsdom instance installed as `globalThis.window` provides
// `window.history` while the bare `history` identifier is undefined, so the
// guard passed and the patch threw `ReferenceError: history is not defined`
// out of `new BaseNode(...)`.
//
// It surfaced twice in practice — a standalone benchmark harness, and the Vite
// e2e fixture, where React's error boundary swallowed it while parity still
// passed.
//
// Only the *first* construction threw, because `start()` sets `_isListening`
// before patching, so later calls return early. That made it easy to miss and
// left the manager half-initialised: listening for `popstate`, but with
// `pushState` unpatched and `_isPatched` still false.
import { NavigationCacheManagerUtil } from '@src/util/navigation-cache-manager.util.js'

interface Resettable {
  _instance: unknown
  _isPatched: boolean
}

/** The singleton and its patch flag are process-global; reset so cases don't leak. */
function resetManager() {
  const cls = NavigationCacheManagerUtil as unknown as Resettable
  cls._instance = null
  cls._isPatched = false
}

function withHistory(value: unknown, run: () => void) {
  const original = Object.getOwnPropertyDescriptor(window, 'history')
  Object.defineProperty(window, 'history', { value, configurable: true, writable: true })
  try {
    run()
  } finally {
    if (original) Object.defineProperty(window, 'history', original)
  }
}

describe('NavigationCacheManagerUtil history guard', () => {
  beforeEach(resetManager)
  afterEach(resetManager)

  it('does not throw when the History API is missing entirely', () => {
    withHistory(undefined, () => {
      expect(() => NavigationCacheManagerUtil.getInstance().start()).not.toThrow()
    })
  })

  it('does not throw when history exists but lacks pushState', () => {
    // Some embedded hosts expose a partial History object.
    withHistory({ replaceState: () => {} }, () => {
      expect(() => NavigationCacheManagerUtil.getInstance().start()).not.toThrow()
    })
  })

  it('still listens for popstate when history cannot be patched', () => {
    // Degrading must not mean giving up: back/forward still has to evict the
    // cache, it is only pushState/replaceState that go undetected.
    const added: string[] = []
    const spy = vi.spyOn(window, 'addEventListener').mockImplementation(((type: string) => {
      added.push(type)
    }) as typeof window.addEventListener)

    withHistory(undefined, () => {
      NavigationCacheManagerUtil.getInstance().start()
    })

    spy.mockRestore()
    expect(added).toContain('popstate')
  })

  it('patches pushState and replaceState when the API is present', () => {
    // The non-vacuity half: prove the guard did not simply disable patching.
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState

    NavigationCacheManagerUtil.getInstance().start()

    expect(window.history.pushState).not.toBe(originalPush)
    expect(window.history.replaceState).not.toBe(originalReplace)

    window.history.pushState = originalPush
    window.history.replaceState = originalReplace
  })

  it('leaves node construction working when history is unavailable', () => {
    // The user-visible symptom: the first `Div(...)` in the process threw.
    withHistory(undefined, () => {
      expect(() => NavigationCacheManagerUtil.getInstance().start()).not.toThrow()
    })
  })
})
