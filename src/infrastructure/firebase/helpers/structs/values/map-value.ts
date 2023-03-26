import { object, Struct } from 'superstruct'
import { Converter, declare } from '../converter'
import { ANY, InferMap } from '../utilities/helper-types'

const MapValueSchema = (fields: Struct<ANY>) => object({ mapValue: object({ fields }) })

/**
 * Represents a `mapValue`.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#MapValue
 */
export function mapValue<RC extends Record<string, Converter<ANY>>>(map: RC): Converter<InferMap<RC>> {
  const keys = Object.keys(map) as Array<keyof RC>
  const iFields = {} as Record<keyof RC, Struct<ANY>>
  const eFields = {} as Record<keyof RC, Struct<ANY>>
  keys.forEach((key) => {
    iFields[key] = map[key].iStruct
    eFields[key] = map[key].eStruct
  })
  const iStructMap = object(iFields) as unknown as Struct<InferMap<RC>>
  const eStructMap = MapValueSchema(object(eFields))
  return declare(
    iStructMap,
    eStructMap,
    (value) => {
      const result: Record<string, unknown> = {}
      Object.entries(value.mapValue.fields).forEach(([k, v]) => {
        result[k] = map[k].toI(v)
      })
      return result as InferMap<RC>
    },
    (value) => {
      const result: Record<string, unknown> = {}
      Object.entries(value).forEach(([k, v]) => {
        result[k] = map[k].toE(v)
      })
      return { mapValue: { fields: result } }
    },
  )
}
