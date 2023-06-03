/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * Convert an object to a Firestore fields object.
 *
 * Fields objects are used in Firestore documents and in MapValues.
 *
 * @param object the plain object to convert
 * @returns the converted fields object
 */
export function convertObjectToFields(object: object): object {
  const entries = Object.entries(object)
  return convertEntriesToFields(entries)
}

/**
 * Convert a plain value to a Firestore typed value.
 *
 * @param plainValue the plain value to convert
 * @returns the converted typed value
 */
export function convertToTypedValue(plainValue: unknown): object {
  const type = typeof plainValue
  if (type === 'object') {
    if (plainValue === null) {
      return { nullValue: null }
    }
    if (Array.isArray(plainValue)) {
      if (plainValue.length === 0) return { arrayValue: {} }
      return { arrayValue: { values: plainValue.map((value) => convertToTypedValue(value)) } }
    }
    const entries = Object.entries(plainValue as object)
    if (entries.length === 0) return { mapValue: {} }
    return { mapValue: { fields: convertEntriesToFields(entries) } }
  }
  if (type === 'string') {
    return { stringValue: plainValue }
  }
  if (type === 'boolean') {
    return { booleanValue: plainValue }
  }
  if (type === 'number') {
    return Number.isSafeInteger(plainValue) ? { integerValue: String(plainValue) } : { doubleValue: plainValue }
  }
  throw new Error(`Could not convert value of type ${type}.`)
}

function convertEntriesToFields(entries: [string, unknown][]): object {
  const fields: Record<string, unknown> = {}
  entries.forEach(([key, value]) => {
    fields[key] = convertToTypedValue(value)
  })
  return fields
}
