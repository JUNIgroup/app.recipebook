/**
 * Represents an 64-bit signed integer.
 *
 * Is represented as a number or bigint.
 */
export type Int64 = number | bigint

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
 * Represents a GeoPoint.
 */
export type GeoPoint = {
  /**
   * The latitude as a number between `-90.0` and `90.0`.
   */
  latitude: number

  /**
   * The longitude as a number between `-180.0` and `180.0`.
   */
  longitude: number
}
