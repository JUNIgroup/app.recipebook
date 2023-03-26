import { assert, Struct, StructError, validate } from 'superstruct'
import { nullable } from '../refinements/nullable'
import { optional } from '../refinements/optional'
import { Infer } from '../utilities/helper-types'
import { integerValue } from './integer-value'
import { mapValue } from './map-value'
import { stringValue } from './string-value'

describe('mapValue', () => {
  it('should create a converter', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }

    // act
    const converter = mapValue(map)

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a record as internal data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input: Infer<typeof converter> = {
      a: 'hello',
      b: 123,
    }

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should not accept a record with missing data as internal data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      a: 'hello',
      // missing b
    }

    // act
    const [error] = validate(input, converter.iStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: b -- Expected an int64, but received: undefined')
  })

  it('should not accept a record with extra data as internal data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      a: 'hello',
      b: 123,
      c: 'extra',
    }

    // act
    const [error] = validate(input, converter.iStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: c -- Expected a value of type `never`, but received: `"extra"`')
  })

  it('should not accept a record with invalid data as internal data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      a: 'hello',
      b: true, // invalid type
    }

    // act
    const [error] = validate(input, converter.iStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: b -- Expected an int64, but received: true')
  })

  it('should accept a value struct as external data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
        },
      },
    }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should not accept a value struct with missing data as external data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          // missing b
        },
      },
    }

    // act
    const [error] = validate(input, converter.eStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: mapValue.fields.b -- Expected an object, but received: undefined')
  })

  it('should not accept a value struct with extra data as external data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
          c: { stringValue: 'extra' },
        },
      },
    }

    // act
    const [error] = validate(input, converter.eStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe(
      'At path: mapValue.fields.c -- Expected a value of type `never`, but received: `[object Object]`',
    )
  })

  it('should convert internal data to external data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input: Infer<typeof converter> = {
      a: 'hello',
      b: 123,
    }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
        },
      },
    })
  })

  it('should convert external data to internal data', () => {
    // arrange
    const map = {
      a: stringValue(),
      b: integerValue(),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
        },
      },
    }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({
      a: 'hello',
      b: 123,
    })
  })
})

describe('mapValue with an optional field and a nullable field', () => {
  it('should accept a record with missing optional data as internal data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input: Infer<typeof converter> = {
      a: 'hello',
      // missing b
    }

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept a record with null for nullable data as internal data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input = {
      a: null,
      b: 123,
    }

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept a record with missing optional data as external data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          // missing b
        },
      },
    }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept a value struct with missing nullable data as external data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { nullValue: null },
          b: { integerValue: '123' },
        },
      },
    }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should convert "full" internal data to external data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input: Infer<typeof converter> = {
      a: 'hello',
      b: 123,
    }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
        },
      },
    })
    expect(Object.keys(output.mapValue.fields)).toEqual(['a', 'b'])
  })

  it('should convert "partial" internal data to external data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input: Infer<typeof converter> = {
      a: null,
      // missing b
    }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({
      mapValue: {
        fields: {
          a: { nullValue: null },
        },
      },
    })
    expect(Object.keys(output.mapValue.fields)).toEqual(['a'])
  })

  it('should convert "full" external data to internal data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { stringValue: 'hello' },
          b: { integerValue: '123' },
        },
      },
    }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({
      a: 'hello',
      b: 123,
    })
    expect(Object.keys(output)).toEqual(['a', 'b'])
  })

  it('should convert "partial" external data to internal data', () => {
    // arrange
    const map = {
      a: nullable(stringValue()),
      b: optional(integerValue()),
    }
    const converter = mapValue(map)
    const input = {
      mapValue: {
        fields: {
          a: { nullValue: null },
        },
      },
    }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({
      a: null,
      // missing b
    })
    expect(Object.keys(output)).toEqual(['a'])
  })
})
