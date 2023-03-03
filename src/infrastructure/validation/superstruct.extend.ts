import { pattern, string, Struct, assert, refine } from 'superstruct'
import { ValidateFunction } from './index'

export const positiveIntegerString = pattern(string(), /^\d{1,16}$/) as Struct<`${number}`, null>

export function nonArray<T extends object, S>(struct: Struct<T, S>): Struct<T, S> {
  return refine(struct, 'nonArray', (value) => {
    const isArray = Array.isArray(value)
    return !isArray || `Expected a non-array ${struct.type} but received an array`
  })
}

export function createValidationFunction<T extends object>(struct: Struct<T>): ValidateFunction<T> {
  return (data: unknown): asserts data is T => assert(data, struct)
}
