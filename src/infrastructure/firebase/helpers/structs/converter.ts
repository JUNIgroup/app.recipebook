import { Struct } from 'superstruct'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any

/**
 * A converter transform the data between the internal and the external format.
 *
 * The internal format is mapped to a JSON structure, which is used internally by the application.
 * The external format is mapped to a Firestore value, which is used to store the data in the database.
 *
 * @template IT The type of the internal data.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 * @see https://firebase.google.com/docs/firestore/manage-data/data-types
 */
export interface Converter<IT> {
  /**
   * Creates a new converter.
   *
   * The `iStruct` is used to validate the internal data after converting it from the external format
   * and before converting it to the external format.
   *
   * The `eStruct` is used to validate the external to match the firestore format.
   *
   * @template ET The type of the external data.
   * @param iStruct The struct used to validate the internal data.
   * @param eStruct The struct used to validate the external data.
   */

  /**
   * The struct used to validate the internal data after converting it from the external format
   * and before converting it to the external format.
   */
  readonly iStruct: Struct<IT>

  /**
   * The struct used to validate the external data before converting it to the internal format.
   * It is used to validate the external data to match the expected firestore format.
   */
  readonly eStruct: Struct<ANY>

  /**
   * Converts the external data to the internal data.
   *
   * The input is already validated before.
   * The output will be validated after.
   *
   * @param value the external data.
   * @returns the internal data.
   */
  toI(value: ANY): IT

  /**
   * Converts the internal data to the external data.
   *
   * The input is already validated before.
   *
   * @param value the internal data.
   * @returns the external data.
   */
  toE(value: IT): ANY
}

export function declare<IT, ET>(
  iStruct: Struct<IT>,
  eStruct: Struct<ET>,
  toI: (value: ET) => IT,
  toE: (value: IT) => ET,
): Converter<ANY> {
  return {
    iStruct,
    eStruct,
    toI,
    toE,
  }
}
