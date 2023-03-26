import { array, object, Struct } from 'superstruct'
import { Converter, declare } from '../converter'
import { ANY, NonUndefined } from '../utilities/helper-types'

const ArrayValueSchema = (element: Struct<ANY>) => object({ arrayValue: object({ values: array(element) }) })

/**
 * Represents an `arrayValue`.
 *
 * @param element The converter for the elements of the array.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue
 */
export function arrayValue<E>(element: Converter<NonUndefined<E>>): Converter<NonUndefined<E>[]> {
  return declare(
    array(element.iStruct),
    ArrayValueSchema(element.eStruct),
    (value) => value.arrayValue.values.map(element.toI),
    (value) => ({ arrayValue: { values: value.map(element.toE) } }),
  )
}
