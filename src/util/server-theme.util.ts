import { getGlobalState } from '@src/helper/common.helper.js'
import type { Theme } from '@src/types/node.type.js'

const SERVER_ACTIVE_THEME_KEY = Symbol.for('@meonode/ui/serverActiveTheme')
const SERVER_THEME_VARIABLES_KEY = Symbol.for('@meonode/ui/serverThemeVariables')

interface ServerThemeState {
  activeTheme?: Theme
}

interface ServerThemeVariablesState {
  byName: Map<string, string>
}

export function getActiveServerTheme(): Theme | undefined {
  return getGlobalState<ServerThemeState>(SERVER_ACTIVE_THEME_KEY, () => ({})).activeTheme
}

export function setActiveServerTheme(theme: Theme): void {
  getGlobalState<ServerThemeState>(SERVER_ACTIVE_THEME_KEY, () => ({})).activeTheme = theme
}

function toThemeVarName(path: string): string {
  return `--meonode-theme-${path.replace(/[^\w.-]/g, '-').replace(/\./g, '-')}`
}

function getThemeVariablesState(): ServerThemeVariablesState {
  return getGlobalState<ServerThemeVariablesState>(SERVER_THEME_VARIABLES_KEY, () => ({ byName: new Map() }))
}

export function registerServerThemeVariables(theme: Theme): void {
  if (!theme?.system || typeof theme.system !== 'object') return

  const state = getThemeVariablesState()
  const stack: Array<{ path: string; value: unknown }> = [{ path: '', value: theme.system }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || !current.value || typeof current.value !== 'object') continue
    const record = current.value as Record<string, unknown>

    for (const [key, rawValue] of Object.entries(record)) {
      const path = current.path ? `${current.path}.${key}` : key
      if (rawValue === null || rawValue === undefined) continue

      if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
        state.byName.set(toThemeVarName(path), String(rawValue))
        continue
      }

      if (typeof rawValue === 'object') {
        const maybeDefault = (rawValue as Record<string, unknown>).default
        if (typeof maybeDefault === 'string' || typeof maybeDefault === 'number' || typeof maybeDefault === 'boolean') {
          state.byName.set(toThemeVarName(path), String(maybeDefault))
        }
        stack.push({ path, value: rawValue })
      }
    }
  }
}

export function consumeServerThemeVariablesCss(): { id: string; cssText: string } | undefined {
  const state = getThemeVariablesState()
  if (state.byName.size === 0) return undefined
  const declarations = Array.from(state.byName.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value};`)
    .join('')
  state.byName.clear()
  if (!declarations) return undefined
  return { id: 'theme-vars', cssText: `:root{${declarations}}` }
}

/**
 * Builds the `:root{--meonode-theme-*: …}` CSS text directly from a Theme without
 * touching the server-only variable store. Safe to call on the client for pure
 * SPA flows (Vite/CRA) where there is no SSR emission to pick up.
 */
export function buildThemeVariablesCss(theme: Theme): string {
  if (!theme?.system || typeof theme.system !== 'object') return ''
  const entries: Array<[string, string]> = []
  const stack: Array<{ path: string; value: unknown }> = [{ path: '', value: theme.system }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || !current.value || typeof current.value !== 'object') continue
    const record = current.value as Record<string, unknown>

    for (const [key, rawValue] of Object.entries(record)) {
      const path = current.path ? `${current.path}.${key}` : key
      if (rawValue === null || rawValue === undefined) continue

      if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
        entries.push([toThemeVarName(path), String(rawValue)])
        continue
      }

      if (typeof rawValue === 'object') {
        const maybeDefault = (rawValue as Record<string, unknown>).default
        if (typeof maybeDefault === 'string' || typeof maybeDefault === 'number' || typeof maybeDefault === 'boolean') {
          entries.push([toThemeVarName(path), String(maybeDefault)])
        }
        stack.push({ path, value: rawValue })
      }
    }
  }

  if (entries.length === 0) return ''
  const declarations = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value};`)
    .join('')
  return `:root{${declarations}}`
}

/**
 * Replaces `theme.*` token strings with `var(--meonode-theme-*)` references,
 * walking arbitrary structures iteratively with copy-on-write semantics.
 *
 * Mirrors `ThemeUtil.resolveObjWithTheme`'s traversal contract:
 * - Only descends into plain objects and arrays. Class instances (refs,
 *   Date, RegExp, MUI internals, React elements, etc.) are passed through
 *   untouched so their identity and prototype chain are preserved.
 * - Copy-on-write: untouched subtrees keep their original reference, which
 *   matters when forwarding props to memoized components.
 * - Iterative with a manual work stack — safe for deeply nested trees.
 * - Detects cycles via a path Set.
 * - Replaces tokens inside object keys too (e.g. nested selectors/media
 *   queries that embed `theme.*` references).
 */
export function replaceThemeTokensWithCssVars<T>(value: T): T {
  const themeRegex = /theme\.([a-zA-Z0-9_.-]+)/g

  const replaceString = (input: string): string => {
    if (!input.includes('theme.')) return input
    themeRegex.lastIndex = 0
    let hasChanged = false
    const next = input.replace(themeRegex, (_, path: string) => {
      hasChanged = true
      return `var(${toThemeVarName(path)})`
    })
    return hasChanged ? next : input
  }

  const isPlainObject = (v: unknown): v is Record<string, unknown> => {
    if (typeof v !== 'object' || v === null) return false
    const proto = Object.getPrototypeOf(v)
    return proto === null || proto === Object.prototype
  }

  if (typeof value === 'string') return replaceString(value) as unknown as T
  if (!isPlainObject(value) && !Array.isArray(value)) return value

  const workStack: { value: unknown; isProcessed: boolean }[] = [{ value, isProcessed: false }]
  const resolvedValues = new Map<unknown, unknown>()
  const path = new Set<unknown>()

  while (workStack.length > 0) {
    const currentWork = workStack[workStack.length - 1]
    const currentValue = currentWork.value

    if (!isPlainObject(currentValue) && !Array.isArray(currentValue)) {
      workStack.pop()
      continue
    }

    if (resolvedValues.has(currentValue)) {
      workStack.pop()
      continue
    }

    if (!currentWork.isProcessed) {
      currentWork.isProcessed = true
      path.add(currentValue)

      const children = Array.isArray(currentValue) ? currentValue : Object.values(currentValue)
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if ((isPlainObject(child) || Array.isArray(child)) && !path.has(child)) {
          workStack.push({ value: child, isProcessed: false })
        }
      }
    } else {
      workStack.pop()
      path.delete(currentValue)

      let finalValue: unknown = currentValue

      if (Array.isArray(currentValue)) {
        let newArray: unknown[] | null = null
        for (let i = 0; i < currentValue.length; i++) {
          const item = currentValue[i]
          let newItem: unknown = item
          if (typeof item === 'string') {
            newItem = replaceString(item)
          } else if (isPlainObject(item) || Array.isArray(item)) {
            newItem = resolvedValues.get(item) ?? item
          }
          if (newItem !== item) {
            if (newArray === null) newArray = [...currentValue]
            newArray[i] = newItem
          }
        }
        if (newArray !== null) finalValue = newArray
      } else {
        let newObj: Record<string, unknown> | null = null
        const obj = currentValue as Record<string, unknown>
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const v = obj[key]
            let newKey = key
            let newValue: unknown = v

            if (key.includes('theme.')) newKey = replaceString(key)

            if (typeof v === 'string') {
              newValue = replaceString(v)
            } else if (isPlainObject(v) || Array.isArray(v)) {
              newValue = resolvedValues.get(v) ?? v
            }

            if (newValue !== v || newKey !== key) {
              if (newObj === null) newObj = { ...obj }
              if (newKey !== key) delete newObj[key]
              newObj[newKey] = newValue
            }
          }
        }
        if (newObj !== null) finalValue = newObj
      }

      resolvedValues.set(currentValue, finalValue)
    }
  }

  return (resolvedValues.get(value) ?? value) as T
}
