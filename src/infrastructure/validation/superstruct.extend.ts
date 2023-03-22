import { pattern, string, Struct, assert, refine, define, Describe, partial } from 'superstruct'
import { ObjectSchema, ObjectType } from 'superstruct/dist/utils'
import { ValidateFunction } from './index'

export const positiveIntegerString = pattern(string(), /^\d{1,16}$/) as Struct<`${number}`, null>

/**
 * Checks that the object value is not an array.
 *
 * @param struct an object struct
 * @returns the new struct
 */
export function nonArray<T extends object, S>(struct: Struct<T, S>): Struct<T, S> {
  return refine(struct, 'nonArray', (value) => {
    const isArray = Array.isArray(value)
    return !isArray || `Expected a non-array ${struct.type} but received an array`
  })
}

/**
 * Checks that the number value is in the range [min, max].
 *
 * @param struct a number struct
 * @param min the minimum value to accept
 * @param max the maximum value to accept
 * @returns the new struct
 */
export function rangeInclude<T extends number, S>(struct: Struct<T, S>, min: T, max: T): Struct<T, S> {
  return refine(struct, 'rangeInclude', (value) => {
    const isInRange = value >= min && value <= max
    return isInRange || `Expected a ${min} to ${max} ${struct.type} but received ${value}`
  })
}

/**
 * Checks that the value is `null`.
 *
 * @returns a struct that accepts only null
 */
export function nullLiteral(): Struct<null, null> {
  return define('null', (value: unknown) => value === null)
}

/**
 * Checks that the value is string represent a 64-bit integer number in range [-9223372036854775808, 9223372036854775807].
 *
 * @param struct the string struct
 * @returns the new struct
 */
export function int64String<T extends string, S>(struct: Struct<T, S>): Struct<T, S> {
  const maxInt64Digits = '9223372036854775808'

  function isInt64String(value: string) {
    if (value === '0') return true
    const match = value.match(/^(-?)([1-9]\d{0,18})$/)
    if (!match) return false
    const [, sign, digits] = match
    return digits.length <= 18 || (sign === '-' ? digits <= maxInt64Digits : digits < maxInt64Digits)
  }

  return refine(struct, 'int64String', (value) => {
    const isInt64 = isInt64String(value)
    return isInt64 || `Expected a string representing a 64-bit integer but received "${value}"`
  })
}

/**
 * Checks that the value is a base64 string.
 *
 * @param struct the string struct
 * @returns the new struct
 */
export function base64String<T extends string, S>(struct: Struct<T, S>): Struct<T, S> {
  return refine(struct, 'base64String', (value) => {
    const isBase64 = /^[a-zA-Z0-9+/]*={0,2}$/.test(value)
    return (isBase64 && value.length % 4 === 0) || `Expected a base64 string but received "${value}"`
  })
}

/**
 * The type which allows to pick exactly one key from the given object type.
 */
export type OneOf<S extends object> = { [K in keyof S]: { [P in K]: S[P] } }[keyof S]

export function oneOf<S extends ObjectSchema>(selectStructs: S): Describe<OneOf<ObjectType<S>>> {
  const optionalStructs = nonArray(partial(selectStructs))
  return refine(optionalStructs, 'oneOf', (value) => {
    const keys = Object.keys(value) as Array<string & keyof typeof value>
    if (keys.length === 0)
      return `Expected one of the following keys "${Object.keys(selectStructs).join('", "')}" but received none`
    if (keys.length !== 1) return `Expected exactly one key but received "${keys.join('", "')}" (${keys.length})`
    if (value[keys[0]] === undefined) return `Expected a value for key ${keys[0]}" not to be undefined`
    return true
  }) as unknown as Describe<OneOf<ObjectType<S>>>
}

export function createValidationFunction<T extends object>(struct: Struct<T>): ValidateFunction<T> {
  return (data: unknown): asserts data is T => assert(data, struct)
}
