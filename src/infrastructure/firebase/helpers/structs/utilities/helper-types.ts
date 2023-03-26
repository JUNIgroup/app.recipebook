import type { Converter } from '../converter'

/**
 * Alias for `any` type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ANY = any

/**
 * Type of `T` but does not allow `undefined`.
 */
export type NonUndefined<T> = Exclude<T, undefined>

/**
 * Infer the internal type of a converter.
 */
export type Infer<C extends Converter<ANY>> = C extends Converter<infer IT> ? IT : never

/**
 * Simplify union types to a single object type.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = T extends ANY[] ? T : { [K in keyof T]: T[K] } & {}

/**
 * Omit properties by type, especially useful to omit `undefined` properties.
 *
 * @see https://stackoverflow.com/a/50375286/1123955
 */
export type OmitBy<T extends object, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>

/**
 * Pick properties by type, especially useful to pick `undefined` properties.
 *
 * @see https://stackoverflow.com/a/50375286/1123955
 */
export type PickBy<T extends object, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>

/**
 * Make all properties of an object, which allows undefined, optional.
 *
 * @see https://stackoverflow.com/a/50375286/1123955
 */
export type Optionalize<O extends object> = OmitBy<O, undefined> & Partial<PickBy<O, undefined>>

export type InferMap<RC extends Record<string, Converter<ANY>>> = Simplify<
  Optionalize<{ [K in keyof RC]: Infer<RC[K]> }>
>

/**
 * Convert a path of property keys to a nested object type.
 *
 * @example StringAt<['a', 'b', 'c'], number> = { a: { b: { c: number } } }
 */
export type TypeAt<P extends string[], T> = P extends [infer Head, ...infer Tail]
  ? { [K in Head & string]: Tail extends string[] ? TypeAt<Tail, T> : never }
  : T

type ExpectConverterFor<T> = Converter<T>

/**
 * A map of converters, where the key is the value at the path in the type of the converter.
 */
export type DiscriminatedUnion<P extends string[], U extends Record<string, Converter<ANY>>> = {
  [K in keyof U]: Infer<U[K]> extends TypeAt<P, K> ? U[K] : ExpectConverterFor<TypeAt<P, K>>
}

/**
 * Union of the inferred types of the converters.
 */
export type InferUnion<U extends Record<string, Converter<ANY>>> = //
  Simplify<{ [K in keyof U]: Infer<U[K]> }[keyof U]>