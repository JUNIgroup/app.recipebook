import { boolean, Describe, number, object, size, string, Struct } from 'superstruct'
import { nullLiteral } from '../../../validation/superstruct.extend'
import { Converter, declare } from './converter'
import { GeoPoint, Int64, Timestamp } from './types'
import { formatTimestamp, int64, int64String, parseInt64String, parseUtcTimeString, utcTimeString } from './utilities'

/**
 * Represents a `nullValue`.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type NullValue = { nullValue: null }

const NullValueSchema: Describe<NullValue> = object({ nullValue: nullLiteral() })

export function nullValue(): Converter<null> {
  return declare(
    nullLiteral(),
    NullValueSchema,
    () => null,
    () => ({ nullValue: null }),
  )
}

/**
 * Represents a booleanValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type BooleanValue = { booleanValue: boolean }

const BooleanValueSchema: Describe<BooleanValue> = object({ booleanValue: boolean() })

export function booleanValue(): Converter<boolean>
export function booleanValue<T extends boolean>(dataSchema: Struct<T>): Converter<T>
export function booleanValue(dataSchema: Struct<boolean> = boolean()): Converter<boolean> {
  return declare(
    dataSchema,
    BooleanValueSchema,
    (value) => value.booleanValue,
    (value) => ({ booleanValue: value }),
  )
}

/**
 * Represents a stringValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type StringValue = { stringValue: string }

const StringValueSchema: Describe<StringValue> = object({ stringValue: string() })

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

/**
 * Represents a integerValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type IntegerValue = { integerValue: string }

const IntegerValueSchema: Describe<IntegerValue> = object({ integerValue: int64String() })

export function integerValue(): Converter<Int64>
export function integerValue<T extends Int64>(dataSchema: Struct<T>): Converter<T>
export function integerValue(dataSchema: Struct<Int64> = int64()): Converter<Int64> {
  return declare(
    dataSchema,
    IntegerValueSchema,
    (value) => parseInt64String(value.integerValue, dataSchema),
    (value) => ({ integerValue: value.toString() }),
  )
}

/**
 * Represents a doubleValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type DoubleValue = { doubleValue: number }

const DoubleValueSchema: Describe<DoubleValue> = object({ doubleValue: number() })

export function doubleValue(): Converter<number>
export function doubleValue<T extends number>(dataSchema: Struct<T>): Converter<T>
export function doubleValue(dataSchema: Struct<number> = number()): Converter<number> {
  return declare(
    dataSchema,
    DoubleValueSchema,
    (value) => value.doubleValue,
    (value) => ({ doubleValue: value }),
  )
}

/**
 * Represents a timestampValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type TimestampValue = { timestampValue: string }

const TimestampValueSchema: Describe<TimestampValue> = object({ timestampValue: utcTimeString() })

const TimestampSchema: Describe<Timestamp> = object({ time: number(), nano: size(number(), 0, 999_999) })

export function timestampValue(): Converter<Timestamp>
export function timestampValue<T extends Timestamp>(dataSchema: Struct<T>): Converter<T>
export function timestampValue(dataSchema: Struct<Timestamp> = TimestampSchema): Converter<Timestamp> {
  return declare(
    dataSchema,
    TimestampValueSchema,
    (value) => parseUtcTimeString(value.timestampValue),
    (value) => ({ timestampValue: formatTimestamp(value) }),
  )
}

/**
 * Represents a geoPointValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/LatLng
 */
type GeoPointValue = { geoPointValue: { latitude: number; longitude: number } }

const GeoPointValueSchema: Describe<GeoPointValue> = object({
  geoPointValue: object({ latitude: number(), longitude: number() }),
})

const GeoPointSchema: Describe<GeoPoint> = object({
  latitude: size(number(), -90.0, 90.0),
  longitude: size(number(), -180.0, 180.0),
})

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

/**
 * Represents a bytesValue.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
type BytesValue = { bytesValue: string }

const BytesValueSchema: Describe<BytesValue> = object({ bytesValue: string() })

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
