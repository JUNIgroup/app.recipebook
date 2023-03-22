import { asPrimitive, parseError } from './basics'

/**
 * The type of a timestamp in the firestore REST API.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents#resource:-document
 */
export type TimestampType = string

/**
 * The type of a timestamp.
 *
 * Represents the {@link TimestampType} internally.
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

  readonly [Symbol.toStringTag]: 'Timestamp'
}

const typeTag = 'Timestamp' as const

/**
 * The pattern of the string representation of a timestamp in firestore.
 *
 * It represents a time in RFC3339 UTC "Zulu" format, accurate to nanoseconds.
 */
export const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(.(\d{1,3})(\d{0,6}))?Z$/ // 2020-12-31T23:59:59.999999Z

/**
 * Convert a timestamp from the firestore REST API to an internal {@link Timestamp}.
 *
 * @param value the value to parse, expect to be a string
 * @returns the parsed timestamp.
 */
export function parseTimestamp(value: unknown): Timestamp {
  const match = asPrimitive('string', value, 'timestamp').match(timestampPattern)
  if (!match) {
    throw parseError(value, 'a timestamp in RFC3339 format')
  }
  const [, seconds, , milliseconds = 0, nanoseconds] = match

  return {
    time: Date.parse(`${seconds}.${milliseconds}Z`),
    nano: nanoseconds ? parseInt(nanoseconds.padEnd(6, '0'), 10) : 0,
    [Symbol.toStringTag]: typeTag,
  }
}

/**
 * Convert a timestamp from an internal {@link Timestamp} to the firestore REST API.
 *
 * @param value the timestamp to format
 * @returns the formatted timestamp.
 */
export function formatTimestamp(value: Timestamp): TimestampType {
  const { time, nano } = value
  const timeString = new Date(time).toISOString() // 2020-12-31T23:59:59.999Z
  if (nano === 0) {
    if (time % 1000 === 0) return `${timeString.slice(0, -5)}Z`
    return timeString.replace(/0+Z$/, 'Z')
  }

  const nanoString = nano.toString().padStart(6, '0').replace(/0+$/, '')
  return `${timeString.slice(0, -1)}${nanoString}Z`
}

/**
 * Creates a {@link Timestamp} from a time and an optional nano value.
 *
 * @param time the time in milliseconds or a date
 * @param nano the fraction of a millisecond in nanoseconds, defaults to 0
 * @returns a new timestamp
 */
export const createTimestamp = (time: number | Date, nano = 0): Timestamp => ({
  time: time instanceof Date ? time.getTime() : time,
  nano,
  [Symbol.toStringTag]: typeTag,
})

/**
 * Checks if a value is a {@link Timestamp}.
 *
 * It only checks if the value is an object and has the {@link Symbol.toStringTag} set to `Timestamp`.
 * Other properties are not checked.
 *
 * @param value the value to check
 * @returns true if the value is a {@link Timestamp}
 */
export const isTimestamp = (value: unknown): value is Timestamp =>
  typeof value === 'object' && value !== null && (value as Timestamp)[Symbol.toStringTag] === typeTag

/**
 * Compares two timestamps.
 */
export function compareTimestamps(a: Timestamp, b: Timestamp): number {
  if (a.time !== b.time) {
    return a.time - b.time
  }
  return a.nano - b.nano
}
