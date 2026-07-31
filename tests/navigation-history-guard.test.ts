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
  _originalPushState: unknown
  _originalReplaceState: unknown
  _patchedPushState: unknown
  _patchedReplaceState: unknown
}

/** The singleton and its patch bookkeeping are process-global; reset so cases don't leak. */
function resetManager() {
  const cls = NavigationCacheManagerUtil as unknown as Resettable
  cls._instance = null
  cls._isPatched = false
  cls._originalPushState = null
  cls._originalReplaceState = null
  cls._patchedPushState = null
  cls._patchedReplaceState = null
}

/**
 * `_stop` is private and reached in production through the `beforeunload`
 * listener. Cases call it directly rather than dispatching the event: each
 * `start()` after a reset registers another listener, and those stale listeners
 * hold earlier singletons whose `_stop` would unpatch the case under test.
 */
function stop(manager: NavigationCacheManagerUtil) {
  ;(manager as unknown as { _stop: () => void })._stop()
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

// `_stop`'s docstring has always claimed it "restores original browser APIs",
// but it only removed the `popstate` listener — `pushState`/`replaceState` kept
// the wrappers, and `_originalReplaceState` was written and never read back.
// Under HMR that left the previous module instance's closure patched over the
// History API for the lifetime of the page.
describe('NavigationCacheManagerUtil history restore', () => {
  beforeEach(resetManager)
  afterEach(resetManager)

  it('puts the native pushState and replaceState back on stop', () => {
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState

    const manager = NavigationCacheManagerUtil.getInstance()
    manager.start()
    // Non-vacuity: if patching never happened, restoring would trivially pass.
    expect(window.history.pushState).not.toBe(originalPush)

    stop(manager)

    expect(window.history.pushState).toBe(originalPush)
    expect(window.history.replaceState).toBe(originalReplace)
  })

  it('clears the patch flag so a later start can patch again', () => {
    // `_isPatched` is static and `_patchHistoryMethods` returns early on it, so
    // leaving it set would make the manager unrecoverable after one stop.
    const originalPush = window.history.pushState

    const manager = NavigationCacheManagerUtil.getInstance()
    manager.start()
    stop(manager)
    manager.start()

    expect(window.history.pushState).not.toBe(originalPush)

    stop(manager)
    expect(window.history.pushState).toBe(originalPush)
  })

  it('leaves a third-party patch installed on top of ours alone', () => {
    // Routers patch history too. If one wrapped our wrapper after we started,
    // assigning the native method back would silently uninstall it.
    const originalPush = window.history.pushState

    const manager = NavigationCacheManagerUtil.getInstance()
    manager.start()

    const ours = window.history.pushState
    const theirs: typeof window.history.pushState = (...args) => ours.apply(window.history, args)
    window.history.pushState = theirs

    stop(manager)

    expect(window.history.pushState).toBe(theirs)

    window.history.pushState = originalPush
  })

  it('does not throw when history disappears between start and stop', () => {
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState

    const manager = NavigationCacheManagerUtil.getInstance()
    manager.start()

    const descriptor = Object.getOwnPropertyDescriptor(window, 'history')
    Object.defineProperty(window, 'history', { value: undefined, configurable: true, writable: true })
    try {
      expect(() => stop(manager)).not.toThrow()
    } finally {
      if (descriptor) Object.defineProperty(window, 'history', descriptor)
      // Restore by hand: `_stop` could not reach the object to unpatch it, so
      // the wrappers would otherwise leak into whatever runs next.
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
    }

    // The restore was impossible, but the bookkeeping still has to reset or the
    // next `start()` would refuse to patch.
    const cls = NavigationCacheManagerUtil as unknown as Resettable
    expect(cls._isPatched).toBe(false)
  })
})
