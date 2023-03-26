import { Describe, number, object, Struct } from 'superstruct'
import { Converter, declare } from '../converter'

// ---- doubleValue ----

type DoubleValue = { doubleValue: number }

const DoubleValueSchema: Describe<DoubleValue> = object({ doubleValue: number() })

/**
 * Represents a doubleValue.
 *
 * @param dataSchema - optional schema to validate the double value, e.g. `inRange(0.0, 360.0)`.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function doubleValue(): Converter<number>
export function doubleValue<T extends number>(dataSchema: Struct<T>): Converter<T>
export function doubleValue(dataSchema: Struct<number> = number()): Converter<number> {
  return declare(
    dataSchema,
    DoubleValueSchema,
    (value) => value.doubleValue,
    (value) => ({ doubleValue: value }),
  )
}
