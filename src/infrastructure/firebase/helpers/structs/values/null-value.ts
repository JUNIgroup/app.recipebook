import { Describe, object } from 'superstruct'
import { nullLiteral } from '../../../../validation/superstruct.extend'
import { Converter, declare } from '../converter'

type NullValue = { nullValue: null }

const NullValueSchema: Describe<NullValue> = object({ nullValue: nullLiteral() })

/**
 * Represents a `nullValue`.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
export function nullValue(): Converter<null> {
  return declare(
    nullLiteral(),
    NullValueSchema,
    () => null,
    () => ({ nullValue: null }),
  )
}
