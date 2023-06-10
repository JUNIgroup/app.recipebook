import { EpochTimestamp, FirestoreDocumentWithLastUpdate, Result } from './types'

export function convertDocumentToResult(document: FirestoreDocumentWithLastUpdate): Result {
  const {
    __lastUpdate: { timestampValue },
    ...fields
  } = document.fields
  const lastUpdate = convertTimestampStringToEpochTimestamp(timestampValue)
  const doc = convertFieldsToObject(fields)
  return { lastUpdate, doc }
}

export function convertTimestampStringToEpochTimestamp(timestamp: string): EpochTimestamp {
  const time = new Date(timestamp).getTime()
  if (Number.isNaN(time)) throw new Error(`Could not convert timestamp string: ${timestamp}`)
  return time
}

/**
 * Convert deep a fields object to a plain object.
 *
 * Fields objects are used in Firestore documents and in MapValues.
 *
 * @param fields the fields object to convert
 * @returns the converted object
 */
export function convertFieldsToObject(fields: object = {}): object {
  const result: Record<string, unknown> = {}
  Object.entries(fields).forEach(([key, value]) => {
    result[key] = convertToPlainValue(value as object)
  })
  return result
}

/**
 * Convert a Firestore typed value to a plain value.
 *
 * @param typedValue the firestore typed value to convert
 * @returns the converted plain value
 */
export function convertToPlainValue(typedValue: object): unknown {
  if ('mapValue' in typedValue) {
    const { fields } = typedValue.mapValue as { fields?: object }
    return convertFieldsToObject(fields)
  }
  if ('stringValue' in typedValue) {
    return typedValue.stringValue
  }
  if ('booleanValue' in typedValue) {
    return typedValue.booleanValue
  }
  if ('integerValue' in typedValue) {
    return Number.parseInt(typedValue.integerValue as string, 10)
  }
  if ('doubleValue' in typedValue) {
    return typedValue.doubleValue
  }
  if ('nullValue' in typedValue) {
    return null
  }
  if ('arrayValue' in typedValue) {
    const { values = [] } = typedValue.arrayValue as { values?: object[] }
    return values.map(convertToPlainValue)
  }
  throw new Error(`Could not convert value with keys: ${Object.keys(typedValue)}`)
}
