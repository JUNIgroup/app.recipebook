import { OneOf } from '../../../validation/superstruct.extend'
import { Base64Data, Base64DataType, formatBase64Data, parseBase64Data } from './base64data'
import { asNull, asPrimitive, asRecord, assertEmptyRest, extractSingleEntryFromRecord, parseError } from './basics'
import { formatGeoPoint, GeoPoint, GeoPointType, parseGeoPoint } from './geopoint'
import { formatTimestamp, parseTimestamp, Timestamp, TimestampType } from './timestamp'
import { Int64, Int64Type, parseInt64 } from './int64'

/**
 * The type of a value in the firestore REST API.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#value
 */
export type ValueType = OneOf<{
  nullValue: null
  booleanValue: boolean
  integerValue: Int64Type
  doubleValue: number
  stringValue: string
  bytesValue: Base64DataType
  timestampValue: TimestampType
  geoPointValue: GeoPointType
  arrayValue: { values: ValueType[] }
  mapValue: { fields: Record<string, ValueType> }
}>

/**
 * The type of a value.
 *
 * Represents the {@link ValueType} internally.
 */
export type Value =
  | null // represents a null value
  | boolean // represents a boolean value
  | number // represents a double value
  | Int64 // represents an integer value
  | string // represents a string value
  | Base64Data // represents a bytes value
  | Timestamp // represents a timestamp value
  | GeoPoint // represents a GeoPoint value
  | Value[] // represents an array value
  | { [key: string]: Value | undefined } // represents a map value

function parseArrayValues(values: unknown): Value[] {
  if (!Array.isArray(values)) throw parseError(values, 'an array for arrayValue.values')
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return values.map(parseValue)
}

/**
 * Export the fields map of a mapValue.
 *
 * @param fields the fields map of a mapValue to parse
 * @returns the parsed fields map
 */
export function parseMapFields(fields: unknown): { [key: string]: Value } {
  const result: { [key: string]: Value } = {}
  Object.entries(asRecord(fields, 'mapValue.fields')).forEach(([field, fieldValue]) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    result[field] = parseValue(fieldValue)
  })
  return result
}

const parsers: Record<string, (data: unknown) => Value> = {
  nullValue: (data) => asNull(data, 'nullValue'),
  booleanValue: (data) => asPrimitive('boolean', data, 'booleanValue'),
  integerValue: parseInt64,
  doubleValue: (data) => asPrimitive('number', data, 'doubleValue'),
  stringValue: (data) => asPrimitive('string', data, 'stringValue'),
  bytesValue: parseBase64Data,
  timestampValue: parseTimestamp,
  geoPointValue: parseGeoPoint,
  arrayValue: (data) => {
    const { values, ...rest } = asRecord(data, 'arrayValue')
    assertEmptyRest(rest, 'arrayValue')
    return parseArrayValues(values)
  },
  mapValue: (data) => {
    const { fields, ...rest } = asRecord(data, 'mapValue')
    assertEmptyRest(rest, 'mapValue')
    return parseMapFields(fields)
  },
}

/**
 * Convert a value from the firestore REST API to an internal {@link Value}.
 *
 * @param value the value to convert
 * @returns the converted value
 */
export function parseValue(value: unknown): Value {
  const [key, data] = extractSingleEntryFromRecord(value, 'value')
  const parser = parsers[key]
  if (parser) return parser(data)
  throw parseError(key, `value type to be ${Object.keys(parsers).join(', ')}`)
}

function formatArrayValues(values: Value[]): ValueType[] {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return values.map(formatValue)
}

/**
 * Export the fields map of a mapValue or a document.
 *
 * @param fields the fields map to format
 * @returns the formatted fields map
 */
export function formatMapFields(fields: { [key: string]: Value | undefined }): Record<string, ValueType> {
  const result: Record<string, ValueType> = {}
  Object.entries(fields).forEach(([field, fieldValue]) => {
    if (fieldValue === undefined) return // ignore undefined fields
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    result[field] = formatValue(fieldValue)
  })
  return result
}

function detectType(value: Value) {
  const type = typeof value
  if (type !== 'object') return type
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const typeTag = (value as { [Symbol.toStringTag]: string })[Symbol.toStringTag]
  return typeTag || 'object'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatters: Record<string, (value: any) => ValueType> = {
  null: () => ({ nullValue: null }),
  boolean: (value: boolean) => ({ booleanValue: value }),
  number: (value: number) => (Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }),
  bigint: (value: bigint) => ({ integerValue: String(value) }),
  string: (value: string) => ({ stringValue: value }),
  array: (value: Value[]) => ({ arrayValue: { values: formatArrayValues(value) } }),
  object: (value: Record<string, Value>) => ({ mapValue: { fields: formatMapFields(value) } }),
  Timestamp: (value: Timestamp) => ({ timestampValue: formatTimestamp(value) }),
  GeoPoint: (value: GeoPoint) => ({ geoPointValue: formatGeoPoint(value) }),
  Base64Data: (value: Base64Data) => ({ bytesValue: formatBase64Data(value) }),
}

/**
 * Convert a value from an internal {@link Value} to the firestore REST API.
 */
export function formatValue(value: Value): ValueType {
  const type = detectType(value)
  const formatter = formatters[type]
  if (formatter) return formatter(value)
  throw parseError(type, `supported value`)
}
