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

export function replaceThemeTokensWithCssVars<T>(value: T): T {
  const replaceString = (input: string) => input.replace(/theme\.([a-zA-Z0-9_.-]+)/g, (_, path: string) => `var(${toThemeVarName(path)})`)

  const walk = (input: unknown): unknown => {
    if (typeof input === 'string') return replaceString(input)
    if (!input || typeof input !== 'object') return input
    if (Array.isArray(input)) return input.map(item => walk(item))

    const next: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(input as Record<string, unknown>)) {
      const nextKey = replaceString(key)
      next[nextKey] = walk(nested)
    }
    return next
  }

  return walk(value) as T
}
