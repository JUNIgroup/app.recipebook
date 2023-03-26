import { Describe, number, object, size, Struct } from 'superstruct'
import { Converter, declare } from '../converter'
import { GeoPoint } from '../utilities/geo-point'

type GeoPointValue = { geoPointValue: { latitude: number; longitude: number } }

const GeoPointValueSchema: Describe<GeoPointValue> = object({
  geoPointValue: object({ latitude: number(), longitude: number() }),
})

const GeoPointSchema: Describe<GeoPoint> = object({
  latitude: size(number(), -90.0, 90.0),
  longitude: size(number(), -180.0, 180.0),
})

/**
 * Represents a geoPointValue with latitude in range [-90.0..+90.0] and longitude in range [-180.0..+180.0].
 *
 * @param dataSchema - optional schema to validate the geo point value.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/LatLng
 */
export function geoPointValue(): Converter<GeoPoint>
export function geoPointValue<T extends GeoPoint>(dataSchema: Struct<T>): Converter<T>
export function geoPointValue(dataSchema: Struct<GeoPoint> = GeoPointSchema): Converter<GeoPoint> {
  return declare(
    dataSchema,
    GeoPointValueSchema,
    (value) => value.geoPointValue,
    (value) => ({ geoPointValue: value }),
  )
}
