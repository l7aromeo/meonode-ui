type Encoded =
  | { $type: 'Function'; name: string; id: number }
  | { $type: 'Symbol'; key: string }
  | { $type: 'BigInt'; value: string }
  | { $type: 'Date'; value: string }
  | { $type: 'RegExp'; source: string; flags: string }
  | { $type: 'Map'; entries: [any, any][] }
  | { $type: 'Set'; values: any[] }
  | { $type: 'Circular'; ref: number }
  | any

export class ObjHelper {
  private constructor() {}

  static stringify(obj: any, space = 2): string {
    const seen = new Map<any, number>()
    const functionIds = new Map<Function, number>()
    let idCounter = 0
    let functionCounter = 0

    const replacer = (_key: string, value: any): Encoded => {
      if (typeof value === 'function') {
        if (!functionIds.has(value)) {
          functionIds.set(value, functionCounter++)
        }
        return { $type: 'Function', name: value.name || '', id: functionIds.get(value)! }
      }

      if (typeof value === 'symbol') {
        return { $type: 'Symbol', key: value.description ?? '' }
      }

      if (typeof value === 'bigint') {
        return { $type: 'BigInt', value: value.toString() }
      }

      if (value instanceof Date) {
        return { $type: 'Date', value: value.toISOString() }
      }

      if (value instanceof RegExp) {
        return { $type: 'RegExp', source: value.source, flags: value.flags }
      }

      if (value instanceof Map) {
        return { $type: 'Map', entries: Array.from(value.entries()) }
      }

      if (value instanceof Set) {
        return { $type: 'Set', values: Array.from(value.values()) }
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return { $type: 'Circular', ref: seen.get(value)! }
        }
        seen.set(value, idCounter++)
      }

      return value
    }

    return JSON.stringify(obj, replacer, space)
  }

  static parse(str: string): any {
    const refs: any[] = []

    const reviver = (_key: string, value: Encoded) => {
      if (value && typeof value === 'object' && '$type' in value) {
        switch (value.$type) {
          case 'Function':
            return function FunctionPlaceholder(...args: any[]) {
              throw new Error(`Function placeholder called: ${value.name || 'anonymous'}#${value.id}`)
            }
          case 'Symbol':
            return Symbol(value.key)
          case 'BigInt':
            return BigInt(value.value)
          case 'Date':
            return new Date(value.value)
          case 'RegExp':
            return new RegExp(value.source, value.flags)
          case 'Map':
            return new Map(value.entries)
          case 'Set':
            return new Set(value.values)
          case 'Circular':
            return { $circularRef: value.ref }
        }
      }
      return value
    }

    const parsed = JSON.parse(str, reviver)

    const fixCirculars = (val: any): any => {
      if (val && typeof val === 'object') {
        if (val.$circularRef !== undefined) {
          return refs[val.$circularRef]
        }
        if (!refs.includes(val)) {
          refs.push(val)
          for (const k of Object.keys(val)) {
            val[k] = fixCirculars(val[k])
          }
        }
      }
      return val
    }

    return fixCirculars(parsed)
  }
}
