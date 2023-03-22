import { define, is, refine, string, Struct } from 'superstruct'
import { Int64, Timestamp } from './types'

/**
 * Superstruct to check a string is a valid int64 string.
 *
 * @returns the Struct<string>
 */
export function int64String(): Struct<string, null> {
  return refine(string(), 'numberString', (value) => {
    if (value === '0') return true
    const isNumberString = /^(-?)([1-9]\d{0,18})$/.test(value)
    return isNumberString || `Expected an int64 string, but received "${value}"`
  })
}

const int64Limit = 2n ** 63n

/**
 * Parse a string to an int64 number or bigint.
 *
 * If the string is a valid safe integer, it will be parsed as a integer `number`.
 * Otherwise, it will be parsed as a bigint.
 *
 * It will not check if the value is within the int64 range.
 *
 * @param value
 * @param numberStruct
 * @returns
 */
export function parseInt64String<T extends Int64>(value: string, numberStruct: Struct<T>): T {
  const integer = parseInt(value, 10)
  if (Number.isSafeInteger(integer) && is(integer, numberStruct)) return integer

  const bigint = BigInt(value)
  return bigint as T
}

/**
 * Superstruct to check a value is a valid int64 number or bigint.
 *
 * @returns The Struct<Int64, null>
 */
export const int64 = (): Struct<Int64, null> =>
  define(
    'int64',
    (value: unknown) =>
      (typeof value === 'number' && !Number.isNaN(value) && Number.isInteger(value)) ||
      (typeof value === 'bigint' && -int64Limit <= value && value < int64Limit) ||
      `Expected an int64, but received: ${value}`,
  )

/**
 * Regexp to check if a string is a valid RFC3339 UTC "Zulu" time string.
 */
const utcTimePattern = /^\d{4}-(\d{2})-(\d{2})T((\d{2}):[0-5]\d:[0-5]\d)(.\d{1,9})?Z$/

function isUtcTimeString(str: string) {
  return !Number.isNaN(Date.parse(str)) && utcTimePattern.test(str)
}

/**
 * Validates that the given value matches the RFC3339 UTC "Zulu" format, accurate to nanoseconds.
 *
 * @example 2019-12-31T23:59:59Z
 * @example 2019-12-31T23:59:59.123Z
 * @example 2019-12-31T23:59:59.123456789Z
 *
 * @returns A struct that validates a value is a UTC time string.
 */
export const utcTimeString = (): Struct<string, null> =>
  define(
    'utcTime',
    (value: unknown) =>
      (typeof value === 'string' && isUtcTimeString(value)) || `Expected a UTC time, but received: ${value}`,
  )

/**
 * Parse a time string into a Timestamp.
 *
 * Expect that the string is a valid RFC3339 UTC "Zulu" time string and already match the {@link utcTimeString}.
 *
 * @param value the UTC time string
 * @returns the parsed timestamp
 */
export function parseUtcTimeString(value: string): Timestamp {
  const { length } = value
  let time: number
  let nano: number
  if (length <= 24) {
    // 2019-12-31T23:59:59Z ...
    // 2019-12-31T23:59:59.123Z
    time = Date.parse(value)
    nano = 0
  } else {
    // .........1.........2.........3
    // 2019-12-31T23:59:59.123456789Z
    // ----date---------------
    //                        -time-
    time = Date.parse(`${value.slice(0, 23)}Z`)
    nano = parseInt(value.slice(23, length - 1), 10) * 10 ** (30 - length)
  }
  return { time, nano }
}

/**
 * Prints the given timestamp as string in the RFC3339 UTC "Zulu" format, accurate to nanoseconds.
 *
 * @param timestamp the timestamp to format
 * @returns the UTC time string
 */
export function formatTimestamp(timestamp: Timestamp): string {
  const { time, nano } = timestamp
  const date = new Date(time).toISOString()
  if (nano === 0 && time % 1000 === 0) {
    return `${date.slice(0, 19)}Z` // 2019-12-31T23:59:59Z
  }
  const formatted = nano === 0 ? date : `${date.slice(0, 23)}${nano.toString().padStart(6, '0')}Z`
  return formatted.replace(/0+Z$/, 'Z') // trim trailing zeros in fractional seconds
}
