import { Describe, number, object, size, Struct } from 'superstruct'
import { Converter, declare } from '../converter'
import { formatTimestamp, parseUtcTimeString, Timestamp, utcTimeString } from '../utilities/utc-time'

type TimestampValue = { timestampValue: string }

const TimestampValueSchema: Describe<TimestampValue> = object({ timestampValue: utcTimeString() })

const TimestampSchema: Describe<Timestamp> = object({ time: number(), nano: size(number(), 0, 999_999) })

/**
 * Represents a timestampValue.
 *
 * @param dataSchema - optional schema to validate the timestamp value.
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 */
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
