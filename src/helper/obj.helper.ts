interface SerializeState {
  nextObjId: number
  nextFunctionId: number
  seen: Map<any, number>
  functionIds: Map<() => void, number>
}

export class ObjHelper {
  private constructor() {}

  /**
   * Build a serializable representation of `value`.
   * - preserves encoded placeholders for special types
   * - emits { $type: 'Circular', ref: id } for circular refs
   */
  private static buildSerializable(value: any, state: SerializeState): any {
    // Fast path for primitives
    if (value === null || value === undefined) return value

    const valueType = typeof value

    // Handle primitives first (most common case)
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      return value
    }

    // Handle functions
    if (valueType === 'function') {
      let functionId = state.functionIds.get(value)
      if (functionId === undefined) {
        functionId = state.nextFunctionId++
        state.functionIds.set(value, functionId)
      }
      return { $type: 'Function', name: value.name || '', id: functionId }
    }

    // Handle other primitives
    if (valueType === 'symbol') {
      return { $type: 'Symbol', key: (value as symbol).description ?? '' }
    }
    if (valueType === 'bigint') {
      return { $type: 'BigInt', value: (value as bigint).toString() }
    }

    // Only objects beyond this point
    if (valueType !== 'object') {
      // Fallback for unknown types
      try {
        return String(value)
      } catch {
        return '<unserializable>'
      }
    }

    // Handle built-in object types before circular check (they're less likely to be circular)
    if (value instanceof Date) {
      return { $type: 'Date', value: value.toISOString() }
    }
    if (value instanceof RegExp) {
      return { $type: 'RegExp', source: value.source, flags: value.flags }
    }

    // Circular detection
    const existingId = state.seen.get(value)
    if (existingId !== undefined) {
      return { $type: 'Circular', ref: existingId }
    }

    // Assign ID and mark as seen
    const objId = state.nextObjId++
    state.seen.set(value, objId)

    // Handle Map
    if (value instanceof Map) {
      const entries: [any, any][] = []
      for (const [k, v] of value.entries()) {
        entries.push([this.buildSerializable(k, state), this.buildSerializable(v, state)])
      }
      return { $type: 'Map', entries }
    }

    // Handle Set
    if (value instanceof Set) {
      const values: any[] = []
      for (const v of value.values()) {
        values.push(this.buildSerializable(v, state))
      }
      return { $type: 'Set', values }
    }

    // Handle Arrays
    if (Array.isArray(value)) {
      // Use map for cleaner code and potential engine optimizations
      return value.map(item => this.buildSerializable(item, state))
    }

    // Handle plain objects
    try {
      const keys = Object.keys(value)
      const obj: any = {}

      for (const key of keys) {
        try {
          obj[key] = this.buildSerializable(value[key], state)
        } catch {
          obj[key] = '<unserializable>'
        }
      }
      return obj
    } catch {
      return '<unserializable>'
    }
  }

  /**
   * Stringify with performance optimizations.
   * @param obj Object to serialize
   * @param space JSON.stringify space parameter
   */
  static stringify(obj: any, space = 0): string {
    const state: SerializeState = {
      nextObjId: 0,
      nextFunctionId: 0,
      seen: new Map(),
      functionIds: new Map(),
    }

    const serializable = this.buildSerializable(obj, state)
    return JSON.stringify(serializable, null, space)
  }
}
