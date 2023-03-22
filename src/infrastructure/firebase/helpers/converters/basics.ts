export const parseError = (value: unknown, expectation: string): Error =>
  new Error(`Expected ${expectation} but received ${value}`)

/**
 * Asserts that the value is null and returns the value as null.
 *
 * @param value the value to check
 * @param what the what, the check is for
 * @returns the value as null
 */
export function asNull(value: unknown, what: string): null {
  if (value !== null) throw parseError(value, `null for ${what}`)
  return null
}

type PrimitiveType = 'string' | 'number' | 'boolean' | 'undefined'

/**
 * Asserts that the value is a primitive of the given type and returns the value as that type.
 * Throws an error if the value is not a primitive of the given type.
 *
 * @param type the type of the primitive, allowed values are 'string', 'number', 'boolean' and 'undefined'
 * @param value the value to check
 * @param what the what, the check is for
 * @returns the value as the given type
 */
export function asPrimitive(type: 'boolean', value: unknown, what: string): boolean
export function asPrimitive(type: 'number', value: unknown, what: string): number
export function asPrimitive(type: 'string', value: unknown, what: string): string
export function asPrimitive(type: PrimitiveType, value: unknown, what: string): unknown {
  if (typeof value !== type) throw parseError(value, `a ${type} for ${what}`)
  return value
}

/**
 * Asserts that the value is a number between min and max (inclusive) and returns the value as a number.
 *
 * @param value the value to check
 * @param what the what, the check is for
 * @param min the lower bound (inclusive)
 * @param max the upper bound (inclusive)
 * @returns the value as a number
 */
export function asNumberInRangeInclusive(value: unknown, what: string, min: number, max: number): number {
  const number = asPrimitive('number', value, what)
  if (number < min || number > max) throw parseError(value, `${what} to be in range [${min},${max}]`)
  return number
}

/**
 * Checks if the value is a record.
 *
 * @param value the value to check
 * @returns true if the value is a record but not an array and not null
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Asserts that the value is a record and returns the value as a record.
 *
 * @param value the value to check
 * @param what the what, the check is for
 */
export function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw parseError(value, `a record for ${what}`)
  return value
}

/**
 * Asserts that the value is an empty record.
 *
 * @param value the value to check
 * @param what the what, the check is for
 */
export function assertEmptyRest(value: Record<string, unknown>, what: string): asserts value is Record<string, never> {
  const keys = Object.keys(value)
  if (keys.length !== 0) throw parseError(keys, `no extra keys for ${what}`)
}

/**
 * Asserts that the value is a record with a single string key and
 * returns the single string key.
 *
 * Fails if the record has more than one key or if the key is not a string.
 *
 * @param value the value to check and extract the key from
 * @param what the what, the check is for
 * @returns the single string key and the value associated with that key
 */
export function extractSingleEntryFromRecord(value: unknown, what: string): [string, unknown] {
  const record = asRecord(value, what)
  const keys = Object.keys(record)
  const key = keys[0]
  if (key === undefined) throw parseError('nothing', `exactly one key for ${what}`)
  if (keys.length > 1) throw parseError(keys, `exactly one key for ${what}`)
  return [key, record[key]]
}
