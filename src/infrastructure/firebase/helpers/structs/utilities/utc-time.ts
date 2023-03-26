import { define, Struct } from 'superstruct'

/**
 * The type of a timestamp.
 */
export type Timestamp = {
  /**
   * The whole milliseconds of UTC time since Unix epoch 1970-01-01T00:00:00.000Z.
   *
   * Is the same as {@link Date.getTime()}.
   */
  time: number

  /**
   * The non-negative fractions of a millisecond at nanosecond resolution.
   * The value must be between 0 and 999,999 inclusive.
   */
  nano: number
}

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
