import { is, nullable as nullableStruct, union as unionStruct } from 'superstruct'
import { Converter, declare } from '../converter'
import { nullValue } from '../values/null-value'

/**
 * Convert an converter which also allows a null value.
 */
export function nullable<T>(converter: Converter<T>): Converter<T | null> {
  const eNull = nullValue()
  return declare(
    nullableStruct(converter.iStruct),
    unionStruct([eNull.eStruct, converter.eStruct]),
    (value) => (is(value, eNull.eStruct) ? null : converter.toI(value)),
    (value) => (value === null ? eNull.toE(null) : converter.toE(value)),
  )
}
