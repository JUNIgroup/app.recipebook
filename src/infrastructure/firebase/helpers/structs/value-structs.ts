import { array, is, nullable as nullableStruct, object, optional as optionalStruct, Struct, union } from 'superstruct'
import { ANY, Converter, declare, Infer } from './converter'
import { nullValue } from './value-basics'

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

/**
 * Convert an converter in an optional converter.
 */
export function nullable<T>(converter: Converter<T>): Converter<T | null> {
  const eNull = nullValue()
  return declare(
    nullableStruct(converter.iStruct),
    union([eNull.eStruct, converter.eStruct]),
    (value) => (is(value, eNull.eStruct) ? null : converter.toI(value)),
    (value) => (value === null ? eNull.toE(null) : converter.toE(value)),
  )
}

/**
 * Represents a `mapValue`.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#MapValue
 */
const MapValueSchema = (fields: Struct<ANY>) => object({ mapValue: object({ fields }) })

type MandatoryKeys<T> = {
  [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never
}[keyof T]

type WithOptional<T> = {
  [P in keyof (Partial<T> & Pick<T, MandatoryKeys<T>>)]: T[P]
}

type InferMapDirect<RC extends Record<string, Converter<ANY>>> = {
  [K in keyof RC]: Infer<RC[K]>
}

type InferMap<RC extends Record<string, Converter<ANY>>> = WithOptional<InferMapDirect<RC>>

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

/**
 * Represents an `arrayValue`.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue
 */
const ArrayValueSchema = (element: Struct<ANY>) => object({ arrayValue: object({ values: array(element) }) })

type NonUndefined<T> = Exclude<T, undefined>

export function arrayValue<E>(element: Converter<NonUndefined<E>>): Converter<NonUndefined<E>[]> {
  return declare(
    array(element.iStruct),
    ArrayValueSchema(element.eStruct),
    (value) => value.arrayValue.values.map(element.toI),
    (value) => ({ arrayValue: { values: value.map(element.toE) } }),
  )
}
