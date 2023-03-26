import { dynamic, enums, Struct, type } from 'superstruct'
import { Converter, declare } from '../converter'
import { ANY, DiscriminatedUnion, InferUnion } from '../utilities/helper-types'

function valueAt(value: ANY, path: string[]): ANY {
  return path.reduce((acc, key) => acc?.[key], value)
}

/**
 * Converts an internal data path to an external data path.
 *
 * @example:
 * iPath = ['a', 'b']
 * ePath = ['mapValue', 'fields', 'a', 'mapValue', 'fields', 'b', 'stringValue']
 *
 * @param iPath the internal data path to the string discriminant
 * @returns the external data path to the string discriminant
 */
function convertIPathToEPath(iPath: string[]) {
  return iPath.reduceRight((acc, key) => ['mapValue', 'fields', key, ...acc], ['stringValue'])
}

/**
 * Convert a path to a nested type, which expected at given path the given value.
 *
 * @example:
 * path = ['a', 'b'],
 * value = enums('x', 'y')
 * type = type({ a: type({ b: enums('x', 'y') }) })
 *
 * @param path the path to the value in the nested type
 * @param valueStruct the struct to be expected at the given path
 * @returns the nested type (ignoring additional properties)
 */
function pathFailure(path: string[], valueStruct: Struct<ANY>) {
  return path.reduceRight((acc, key) => type({ [key]: acc }), valueStruct)
}

/**
 * Creates a new converter for a discriminated union.
 *
 * @template P The path to the discriminant in the internal data.
 * @template U The converters for the union members.
 * @param converters the converters for the union members, the key is the discriminant value
 * @param iPath the path to the discriminant in the internal data
 */
export function discriminatedUnion<P extends string[], U extends Record<string, Converter<ANY>>>(
  converters: DiscriminatedUnion<P, U>,
  ...iPath: P
): Converter<InferUnion<U>> {
  const keys = Object.keys(converters)
  const ePath = convertIPathToEPath(iPath)
  const iPathFailure = pathFailure(iPath, enums(keys))
  const ePathFailure = pathFailure(ePath, enums(keys))
  const iStruct = dynamic((value) => {
    const discriminant = valueAt(value, iPath)
    return converters[discriminant]?.iStruct ?? iPathFailure
  })
  const eStruct = dynamic((value) => {
    const discriminant = valueAt(value, ePath)
    return converters[discriminant]?.eStruct ?? ePathFailure
  })

  return declare(
    iStruct,
    eStruct,
    (value) => converters[valueAt(value, ePath)].toI(value),
    (value) => converters[valueAt(value, iPath)].toE(value),
  )
}
