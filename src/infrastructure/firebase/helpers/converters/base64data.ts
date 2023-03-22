import { asPrimitive } from './basics'

/**
 * The type of base64 data in the firestore REST API.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/LatLng
 */
export type Base64DataType = string

/**
 * The type of base64 data.
 *
 * Represents the {@link GoePointType} internally.
 */
export type Base64Data = {
  /**
   * The data in base64 format.
   */
  data: string

  readonly [Symbol.toStringTag]: 'Base64Data'
}

const typeTag = 'Base64Data' as const

/**
 * Converts a base64 data from the firestore REST API to an internal {@link Base64Data}.
 *
 * @param value the value to convert
 * @returns the converted value
 */
export function parseBase64Data(value: unknown): Base64Data {
  const data = asPrimitive('string', value, 'Base64Data')
  return { data, [Symbol.toStringTag]: typeTag }
}

/**
 * Converts base64 data from the internal {@link Base64Data} to the firestore REST API.
 *
 * @param value the value to convert
 * @returns the converted value
 */
export function formatBase64Data(value: Base64Data): Base64DataType {
  return value.data
}

/**
 * Creates a {@link Base64Data} from the given data.
 *
 * @param data the base64 formatted data
 * @returns the created base64 data
 */
export function createBase64Data(data: string): Base64Data {
  return { data, [Symbol.toStringTag]: typeTag }
}

/**
 * Checks if the given value is a {@link Base64Data}.
 *
 * It only checks if the value is an object and has the {@link Symbol.toStringTag} set to `Base64Data`.
 * Other properties are not checked.
 *
 * @param value the value to check
 * @returns `true` if the value is a {@link Base64Data}, `false` otherwise
 */
export function isBase64Data(value: unknown): value is Base64Data {
  return typeof value === 'object' && value !== null && (value as Base64Data)[Symbol.toStringTag] === typeTag
}
