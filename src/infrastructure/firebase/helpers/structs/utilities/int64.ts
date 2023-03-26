import { define, is, refine, string, Struct } from 'superstruct'

/**
 * Represents an 64-bit signed integer.
 *
 * Is represented as a number or bigint.
 */
export type Int64 = number | bigint

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
