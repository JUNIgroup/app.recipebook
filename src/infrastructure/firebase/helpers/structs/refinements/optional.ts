import { optional as optionalStruct } from 'superstruct'
import { Converter, declare } from '../converter'

/**
 * Convert an converter in an optional converter.
 */
export function optional<T>(converter: Converter<T>): Converter<T | undefined> {
  return declare(
    optionalStruct(converter.iStruct),
    optionalStruct(converter.eStruct),
    (value) => (value === undefined ? undefined : converter.toI(value)),
    (value) => (value === undefined ? undefined : converter.toE(value)),
  )
}
