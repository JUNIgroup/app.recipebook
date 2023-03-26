import { Describe, object, string, Struct } from 'superstruct'
import { Converter, declare } from '../converter'

type BytesValue = { bytesValue: string }

const BytesValueSchema: Describe<BytesValue> = object({ bytesValue: string() })

/**
 * Represents a bytesValue.
 *
 * @param dataSchema - optional schema to validate the base64 representation, e.g. `size(string(), 0, 3_000)`.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function bytesValue(): Converter<string>
export function bytesValue<T extends string>(dataSchema: Struct<T>): Converter<T>
export function bytesValue(dataSchema: Struct<string> = string()): Converter<string> {
  return declare(
    dataSchema,
    BytesValueSchema,
    (value) => value.bytesValue,
    (value) => ({ bytesValue: value }),
  )
}
