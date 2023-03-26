import { Describe, object, string, Struct } from 'superstruct'
import { Converter, declare } from '../converter'

type StringValue = { stringValue: string }

const StringValueSchema: Describe<StringValue> = object({ stringValue: string() })

/**
 * Represents a stringValue.
 *
 * @param dataSchema - optional schema to validate the string value, e.g. `literal('foo')`.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function stringValue(): Converter<string>
export function stringValue<T extends string>(dataSchema: Struct<T>): Converter<T>
export function stringValue(dataSchema: Struct<string> = string()): Converter<string> {
  return declare(
    dataSchema,
    StringValueSchema,
    (value) => value.stringValue,
    (value) => ({ stringValue: value }),
  )
}
