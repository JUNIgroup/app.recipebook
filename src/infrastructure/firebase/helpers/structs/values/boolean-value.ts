import { boolean, Describe, object, Struct } from 'superstruct'
import { Converter, declare } from '../converter'

type BooleanValue = { booleanValue: boolean }

const BooleanValueSchema: Describe<BooleanValue> = object({ booleanValue: boolean() })

/**
 * Represents a booleanValue.
 *
 * @param dataSchema - optional schema to validate the boolean value, e.g. `literal(true)`.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function booleanValue(): Converter<boolean>
export function booleanValue<T extends boolean>(dataSchema: Struct<T>): Converter<T>
export function booleanValue(dataSchema: Struct<boolean> = boolean()): Converter<boolean> {
  return declare(
    dataSchema,
    BooleanValueSchema,
    (value) => value.booleanValue,
    (value) => ({ booleanValue: value }),
  )
}
