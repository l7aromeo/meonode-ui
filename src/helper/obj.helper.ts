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

  /**
   * Build a deterministic, serializable representation of `value`.
   * - sorts plain object keys
   * - preserves encoded placeholders for special types
   * - emits { $type: 'Circular', ref: id } for circular refs
   */
  private static buildSerializable(
    value: any,
    seen: Map<any, number>,
    functionIds: Map<Function, number>,
    state: { nextObjId: number; nextFunctionId: number },
  ): any {
    // primitives & simple types
    if (value === null || value === undefined) return value
    const t = typeof value
    if (t === 'string' || t === 'number' || t === 'boolean') return value
    if (t === 'function') {
      if (!functionIds.has(value)) {
        functionIds.set(value, state.nextFunctionId++)
      }
      return { $type: 'Function', name: value.name || '', id: functionIds.get(value)! }
    }
    if (t === 'symbol') {
      return { $type: 'Symbol', key: (value as symbol).description ?? '' }
    }
    if (t === 'bigint') {
      return { $type: 'BigInt', value: (value as bigint).toString() }
    }

    // Date
    if (value instanceof Date) {
      return { $type: 'Date', value: value.toISOString() }
    }

    // RegExp
    if (value instanceof RegExp) {
      return { $type: 'RegExp', source: value.source, flags: value.flags }
    }

    // Map
    if (value instanceof Map) {
      const entries: [any, any][] = []
      for (const [k, v] of value.entries()) {
        // recursively build serializable keys/values
        entries.push([ObjHelper.buildSerializable(k, seen, functionIds, state), ObjHelper.buildSerializable(v, seen, functionIds, state)])
      }
      return { $type: 'Map', entries }
    }

    // Set
    if (value instanceof Set) {
      const values: any[] = []
      for (const v of value.values()) {
        values.push(ObjHelper.buildSerializable(v, seen, functionIds, state))
      }
      return { $type: 'Set', values }
    }

    // Objects and arrays
    if (t === 'object') {
      // Circular detection
      if (seen.has(value)) {
        return { $type: 'Circular', ref: seen.get(value)! }
      }
      // assign id
      const objId = state.nextObjId++
      seen.set(value, objId)

      if (Array.isArray(value)) {
        const arr: any[] = []
        for (let i = 0; i < value.length; i++) {
          arr.push(ObjHelper.buildSerializable(value[i], seen, functionIds, state))
        }
        return arr
      }

      // Plain object: sort keys for determinism
      const keys = Object.keys(value).sort()
      const obj: any = {}
      for (const k of keys) {
        try {
          obj[k] = ObjHelper.buildSerializable(value[k], seen, functionIds, state)
        } catch {
          obj[k] = '<unserializable>'
        }
      }
      return obj
    }

    // Fallback: try to stringify
    try {
      return String(value)
    } catch {
      return '<unserializable>'
    }
  }

  /**
   * Deterministic stringify: first build a canonical serializable structure
   * (with sorted object keys and encoded special types), then JSON.stringify it.
   */
  static stringify(obj: any, space = 2): string {
    const seen = new Map<any, number>()
    const functionIds = new Map<Function, number>()
    const state = { nextObjId: 0, nextFunctionId: 0 }

    const serializable = ObjHelper.buildSerializable(obj, seen, functionIds, state)
    return JSON.stringify(serializable, null, space)
  }

  static parse(str: string): any {
    const refs: any[] = []

    const reviver = (_key: string, value: Encoded) => {
      if (value && typeof value === 'object' && '$type' in value) {
        switch (value.$type) {
          case 'Function':
            return function FunctionPlaceholder(..._args: any[]) {
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
