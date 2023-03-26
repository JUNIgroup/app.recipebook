import { Describe, object, Struct } from 'superstruct'
import { Converter, declare } from '../converter'
import { Int64, int64, int64String, parseInt64String } from '../utilities/int64'

type IntegerValue = { integerValue: string }

const IntegerValueSchema: Describe<IntegerValue> = object({ integerValue: int64String() })

/**
 * Represents a integerValue.
 *
 * @param dataSchema - optional schema to validate the integer value, e.g. `integer()`.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function integerValue(): Converter<Int64>
export function integerValue<T extends Int64>(dataSchema: Struct<T>): Converter<T>
export function integerValue(dataSchema: Struct<Int64> = int64()): Converter<Int64> {
  return declare(
    dataSchema,
    IntegerValueSchema,
    (value) => parseInt64String(value.integerValue, dataSchema),
    (value) => ({ integerValue: value.toString() }),
  )
}
