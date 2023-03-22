import { asNumberInRangeInclusive, asRecord, assertEmptyRest } from './basics'

/**
 * The type of a GeoPoint in the firestore REST API.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/LatLng
 */
export type GeoPointType = {
  /**
   * The latitude of the GeoPoint. It must be in the range [-90.0, +90.0].
   */
  latitude: number

  /**
   * The longitude of the GeoPoint. It must be in the range [-180.0, +180.0].
   */
  longitude: number
}

/**
 * The type of a GeoPoint.
 *
 * Represents the {@link GeoPointType} internally.
 */
export type GeoPoint = {
  /**
   * The latitude of the GeoPoint. It must be in the range [-90.0, +90.0].
   */
  latitude: number

  /**
   * The longitude of the GeoPoint. It must be in the range [-180.0, +180.0].
   */
  longitude: number

  readonly [Symbol.toStringTag]: 'GeoPoint'
}

const typeTag = 'GeoPoint' as const

/**
 * Converts a GeoPoint from the firestore REST API to an internal {@link GeoPoint}.
 *
 * Ensure that the value is a record with only the keys `latitude` and `longitude` and
 * that the values are numbers in the range [-90.0, +90.0] for `latitude`
 * and [-180.0, +180.0] for `longitude`.
 *
 * @param value the value to convert
 * @returns the converted value
 */
export function parseGeoPoint(value: unknown): GeoPoint {
  const { latitude, longitude, ...rest } = asRecord(value, 'GeoPoint')
  assertEmptyRest(rest, 'GeoPoint')

  return {
    latitude: asNumberInRangeInclusive(latitude, 'latitude', -90.0, +90.0),
    longitude: asNumberInRangeInclusive(longitude, 'longitude', -180.0, +180.0),
    [Symbol.toStringTag]: typeTag,
  }
}

/**
 * Converts a GeoPoint from an internal {@link GeoPoint} to the firestore REST API.
 *
 * @param value the value to convert
 * @returns the converted value
 */
export function formatGeoPoint(value: GeoPoint): GeoPointType {
  const { latitude, longitude } = value
  return { latitude, longitude }
}

/**
 * Creates a {@link GeoPoint} from the given latitude and longitude.
 *
 * @param latitude the latitude - should be in the range [-90.0, +90.0]
 * @param longitude the longitude - should be in the range [-180.0, +180.0]
 * @returns the created geo point
 */
export const createGeoPoint = (latitude: number, longitude: number): GeoPoint => ({
  latitude,
  longitude,
  [Symbol.toStringTag]: typeTag,
})

/**
 * Checks if the given value is a {@link GeoPoint}.
 *
 * It only checks if the value is an object and has the {@link Symbol.toStringTag} set to `GeoPoint`.
 * Other properties are not checked.
 *
 * @param value the value to check
 * @returns `true` if the value is a {@link GeoPoint}, `false` otherwise
 */
export function isGeoPoint(value: unknown): value is GeoPoint {
  return typeof value === 'object' && value !== null && (value as GeoPoint)[Symbol.toStringTag] === typeTag
}
