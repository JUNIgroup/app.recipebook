import { integer } from 'superstruct'
import { optional } from '../refinements/optional'
import { arrayValue } from '../values/array-value'
import { integerValue } from '../values/integer-value'
import { mapValue } from '../values/map-value'
import { stringValue } from '../values/string-value'
import { Infer, InferMap, NonUndefined, OmitBy, Optionalize, PickBy, Simplify } from './helper-types'

describe('NonUndefined', () => {
  it('should accept non-undefined value', () => {
    // act
    type Type = NonUndefined<string>

    // assert
    expectTypeOf('foo').toEqualTypeOf<Type>()
  })

  it('should not accept undefined value', () => {
    // act
    type Type = NonUndefined<string>

    // assert
    expectTypeOf(undefined).not.toEqualTypeOf<Type>()
  })
})

describe('Infer', () => {
  it('should infer the internal type of a converter', () => {
    // arrange
    const converter = stringValue()

    // act
    type Type = Infer<typeof converter>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<string>()
  })
})

describe('Simplify', () => {
  it('should simplify the type', () => {
    // act
    type Type = Simplify<{ a: string; b: number[]; c: Date }>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ a: string; b: number[]; c: Date }>()
  })

  it('should simplify an union type', () => {
    // arrange
    type Type1 = { a: string }
    type Type2 = { b: number[] }
    type Type3 = { c?: boolean }

    // act
    type Type = Simplify<Type1 & Type2 & Type3>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{
      a: string
      b: number[]
      c?: boolean
    }>()
  })
})

describe('OmitBy', () => {
  it('should omit properties by type', () => {
    // act
    type Type = OmitBy<{ a: string; b: number; c: string }, string>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ b: number }>()
  })

  it('should omit properties by undefined', () => {
    // act
    type Type = OmitBy<{ a?: string; b: number | undefined; c: string }, undefined>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ c: string }>()
  })
})

describe('PickBy', () => {
  it('should pick properties by type', () => {
    // act
    type Type = PickBy<{ a: string; b: number; c: string }, string>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ a: string; c: string }>()
  })

  it('should pick properties by undefined', () => {
    // act
    type Type = PickBy<{ a: string | undefined; b: number | undefined; c: string }, undefined>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ a: string | undefined; b: number | undefined }>()
  })

  it('should combine with Partial select optional properties', () => {
    // act
    type Type = Partial<PickBy<{ a: string | undefined; b: number | undefined; c: string }, undefined>>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ a?: string; b?: number }>()
  })
})

describe('Optionalize', () => {
  it('should make all properties, accepting undefined, optional', () => {
    // act
    type Type = Optionalize<{ a: string; b: number | undefined; c: string }>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<
      {
        a: string
        c: string
      } & {
        b?: number | undefined
      }
    >()
  })

  it('should combined with simplify make one object type', () => {
    // act
    type Type = Simplify<Optionalize<{ a: string; b: number | undefined; c: string }>>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{
      a: string
      c: string
      b?: number | undefined
    }>()
  })
})

describe('InferMap', () => {
  it('should infer the internal type of the converters in an object', () => {
    // arrange
    const converter = {
      foo: stringValue(),
      bar: stringValue(),
    }

    // act
    type Type = InferMap<typeof converter>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{ foo: string; bar: string }>()
  })

  it('should infer the internal type of the converters in an object with optional properties', () => {
    // arrange
    const converterMap = {
      foo: stringValue(),
      bar: stringValue(),
      baz: optional(stringValue()),
    }

    // act
    type Type = InferMap<typeof converterMap>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{
      foo: string
      bar: string
      baz?: string
    }>()
  })

  it('should infer the internal type of the deep objects converters', () => {
    // arrange
    const converterMap = {
      foo: stringValue(),
      bar: mapValue({
        baz: mapValue({
          qux: stringValue(),
          arr: arrayValue(integerValue(integer())),
        }),
      }),
    }

    // act
    type Type = InferMap<typeof converterMap>

    // assert
    expectTypeOf<Type>().toEqualTypeOf<{
      foo: string
      bar: {
        baz: {
          qux: string
          arr: number[]
        }
      }
    }>()
  })
})
