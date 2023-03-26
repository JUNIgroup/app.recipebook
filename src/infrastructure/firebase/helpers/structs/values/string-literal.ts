import { literal } from 'superstruct'
import { stringValue } from './string-value'

/**
 * Alias for `stringValue(literal(value))`.
 *
 * @param value the string value of the discriminant
 * @returns a converter that accept only one string value
 */
export const stringLiteral = <D extends string>(value: D) => stringValue(literal(value))
