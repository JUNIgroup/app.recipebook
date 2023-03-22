import { asPrimitive, parseError } from './basics'

/**
 * The type of an integer value in the Firestore database.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export type Int64Type = string

/**
 * The type of a 64-bit signed integer value.
 *
 * Represents the {@link Int64Type} internally.
 */
export type Int64 =
  | number // represents an integer value in the range [Integer.MIN_SAFE_INTEGER, Integer.MAX_SAFE_INTEGER]
  | bigint // represents an integer value in the range [-(2^63), 2^63 - 1] but not in the range [Integer.MIN_SAFE_INTEGER, Integer.MAX_SAFE_INTEGER]

const integerPattern = /^(-?)([1-9]\d*)$/ // except 0
const limit = 2n ** 63n

export function parseInt64(data: unknown): number | bigint {
  if (data === '0') return 0

  const string = asPrimitive('string', data, 'integerValue')
  if (!integerPattern.test(string)) throw parseError(data, 'a string representing of an int64 value')

  const integerValue = parseInt(string, 10)
  if (Number.isSafeInteger(integerValue)) return integerValue

  const bigIntValue = BigInt(string)
  if (!(bigIntValue < -limit || bigIntValue >= limit)) {
    return bigIntValue
  }

  throw parseError(data, `an int64 value in range of [${-limit},${limit - 1n}]`)
}
