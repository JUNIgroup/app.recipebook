import { assert, bigint, enums, integer, literal, number, size, string, Struct, StructError } from 'superstruct'
import {
  booleanValue,
  bytesValue,
  doubleValue,
  geoPointValue,
  integerValue,
  nullValue,
  stringValue,
  timestampValue,
} from './value-basics'

describe('nullValue', () => {
  it('should create a converter', () => {
    // act
    const converter = nullValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a `null` as internal data', () => {
    // arrange
    const converter = nullValue()
    const input = null

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept a nullValue as external data', () => {
    // arrange
    const converter = nullValue()
    const input = { nullValue: null }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert `null` to a nullValue', () => {
    // arrange
    const converter = nullValue()
    const input = null

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ nullValue: null })
  })

  it('should convert a nullValue to `null`', () => {
    // arrange
    const converter = nullValue()
    const input = { nullValue: null }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(input.nullValue)
  })
})

describe('booleanValue', () => {
  it('should create a converter', () => {
    // act
    const converter = booleanValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a boolean as internal data', () => {
    // arrange
    const converter = booleanValue()
    const input = true

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept a boolean with restriction as internal data', () => {
    // arrange
    const converter = booleanValue(literal(true))
    const input = true

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a boolean with restriction as internal data', () => {
    // arrange
    const converter = booleanValue(literal(true))
    const input = false

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected the literal `true`, but received: false')
  })

  it('should accept a booleanValue as external data', () => {
    // arrange
    const converter = booleanValue()
    const input = { booleanValue: true }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a boolean to a booleanValue', () => {
    // arrange
    const converter = booleanValue()
    const input = true

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ booleanValue: true })
  })

  it('should convert a booleanValue to a boolean', () => {
    // arrange
    const converter = booleanValue()
    const input = { booleanValue: true }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(input.booleanValue)
  })
})

describe('stringValue', () => {
  it('should create a converter', () => {
    // act
    const converter = stringValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a string as internal data', () => {
    // arrange
    const converter = stringValue()
    const input = 'foo'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept a string with restriction as internal data', () => {
    // arrange
    const converter = stringValue(enums(['foo', 'bar']))
    const input = 'foo'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a string with restriction as internal data', () => {
    // arrange
    const converter = stringValue(enums(['foo', 'bar']))
    const input = 'baz'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('Expected one of `"foo","bar"`, but received: "baz"')
  })

  it('should accept a stringValue as external data', () => {
    // arrange
    const converter = stringValue()
    const input = { stringValue: 'foo' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a string to a stringValue', () => {
    // arrange
    const converter = stringValue()
    const input = 'foo'

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ stringValue: input })
  })

  it('should convert a stringValue to a string', () => {
    // arrange
    const converter = stringValue()
    const input = { stringValue: 'foo' }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(input.stringValue)
  })
})

describe('integerValue', () => {
  it('should create a converter', () => {
    // act
    const converter = integerValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a number as internal data', () => {
    // arrange
    const converter = integerValue()
    const input = 1

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it.each`
    input         | asString
    ${1.1}        | ${'1.1'}
    ${Number.NaN} | ${'NaN'}
    ${Infinity}   | ${'Infinity'}
    ${2n ** 70n}  | ${'1180591620717411303424'}
  `('should reject $asString as internal data', ({ input, asString }) => {
    // arrange
    const converter = integerValue()

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe(`Expected an int64, but received: ${asString}`)
  })

  it('should accept a number restricted to integer as internal data', () => {
    // arrange
    const converter = integerValue(integer())
    const input = 1

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a number restricted to integer as internal data', () => {
    // arrange
    const converter = integerValue(integer())
    const input = 2n

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected an integer, but received: 2')
  })

  it('should accept a number restricted to bigint as internal data', () => {
    // arrange
    const converter = integerValue(bigint())
    const input = 1n

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a number restricted to bigint as internal data', () => {
    // arrange
    const converter = integerValue(bigint())
    const input = 1

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value of type `bigint`, but received: `1`')
  })

  it('should accept zero as external data', () => {
    // arrange
    const converter = integerValue()
    const input = { integerValue: '0' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept an integerValue as external data', () => {
    // arrange
    const converter = integerValue()
    const input = { integerValue: '1' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert to a number to an integerValue', () => {
    // arrange
    const converter = integerValue()
    const input = 1

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ integerValue: '1' })
  })

  it('should convert to an integerValue to an integer', () => {
    // arrange
    const converter = integerValue()
    const input = { integerValue: '1' }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(1)
  })

  it('should convert to an integerValue to a bigint', () => {
    // arrange
    const converter = integerValue()
    const input = { integerValue: `1152921504606846976` } // 2^60

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(1152921504606846976n)
  })

  it('should convert to an integerValue to a number with restriction to bigint direct to bigint', () => {
    // arrange
    const converter = integerValue(bigint())
    const input = { integerValue: '1' }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(1n)
  })
})

describe('doubleValue', () => {
  it('should create a converter', () => {
    // act
    const converter = doubleValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a number as internal data', () => {
    // arrange
    const converter = doubleValue()
    const input = 1.1

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a string as internal data', () => {
    // arrange
    const converter = doubleValue()
    const input = '1'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a number, but received: "1"')
  })

  it('should accept a number restricted to range as internal data', () => {
    // arrange
    const converter = doubleValue(size(number(), -10.0, 10.0))
    const input = 10.0

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a number restricted to range as internal data', () => {
    // arrange
    const converter = doubleValue(size(number(), -10.0, 10.0))
    const input = 10.1

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a number between `-10` and `10` but received `10.1`')
  })

  it('should accept a doubleValue as external data', () => {
    // arrange
    const converter = doubleValue()
    const input = { doubleValue: 1.1 }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a number to a doubleValue', () => {
    // arrange
    const converter = doubleValue()
    const input = 1.1

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ doubleValue: 1.1 })
  })

  it('should convert a doubleValue to a number', () => {
    // arrange
    const converter = doubleValue()
    const input = { doubleValue: 1.1 }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual(1.1)
  })
})

describe('timestampValue', () => {
  it('should create a converter', () => {
    // act
    const converter = timestampValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a timestamp as internal data', () => {
    // arrange
    const converter = timestampValue()
    const input = { time: 1640995199_876, nano: 543_210 } // 2021-12-31T23:59:59.87654321Z

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a timestamp with too large nano as internal data', () => {
    // arrange
    const converter = timestampValue()
    const input = { time: 1640995199_876, nano: 1_000_000 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: nano -- Expected a number between `0` and `999999` but received `1000000`')
  })

  it('should reject a string as internal data', () => {
    // arrange
    const converter = timestampValue()
    const input = '1'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected an object, but received: "1"')
  })

  it('should accept a timestamp as external data', () => {
    // arrange
    const converter = timestampValue()
    const input = { timestampValue: '2019-12-31T23:59:59Z' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a timestamp to a timestampValue', () => {
    // arrange
    const converter = timestampValue()
    const input = { time: 1640995199_876, nano: 543_210 } // 2021-12-31T23:59:59.87654321Z

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ timestampValue: '2021-12-31T23:59:59.87654321Z' })
  })

  it('should convert a timestampValue to a timestamp', () => {
    // arrange
    const converter = timestampValue()
    const input = { timestampValue: '2021-12-31T23:59:59.87654321Z' }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({ time: 1640995199_876, nano: 543_210 })
  })
})

describe('geoPointValue', () => {
  it('should create a converter', () => {
    // act
    const converter = geoPointValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a geo point as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 2.2 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a geo point with too large latitude as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 91.0, longitude: 2.2 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: latitude -- Expected a number between `-90` and `90` but received `91`')
  })

  it('should reject a geo point with too large longitude as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 181.0 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: longitude -- Expected a number between `-180` and `180` but received `181`')
  })

  it('should reject a string as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = '1'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected an object, but received: "1"')
  })

  it('should accept a geo point as external data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { geoPointValue: { latitude: 1.1, longitude: 2.2 } }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a geo point to a geoPointValue', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 2.2 }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ geoPointValue: { latitude: 1.1, longitude: 2.2 } })
  })

  it('should convert a geoPointValue to a geo point', () => {
    // arrange
    const converter = geoPointValue()
    const input = { geoPointValue: { latitude: 1.1, longitude: 2.2 } }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({ latitude: 1.1, longitude: 2.2 })
  })
})

describe('bytesValue', () => {
  // test analog to stringValue

  it('should create a converter', () => {
    // act
    const converter = bytesValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept bytes (base64 encoded string) as internal data', () => {
    // arrange
    const converter = bytesValue()
    const input = 'AQIDBA==' // 0x01, 0x02, 0x03, 0x04

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept bytes (base64 encoded string) with restriction as internal data', () => {
    // arrange
    const converter = stringValue(size(string(), 3, 30))
    const input = 'AQIDBA==' // 0x01, 0x02, 0x03, 0x04

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject bytes (base64 encoded string) with restriction as internal data', () => {
    // arrange
    const converter = stringValue(size(string(), 3, 30))
    const input = 'SGVsbG8gV29ybGQsIGhlbGxvIE1hcnMsIGhlbGxvIHN1bg==' // Hello World, hello Mars, hello sun

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(
      'Expected a string with a length between `3` and `30` but received one with a length of `48`',
    )
  })

  it('should accept a bytesValue as external data', () => {
    // arrange
    const converter = bytesValue()
    const input = { bytesValue: 'AQIDBA==' } // 0x01, 0x02, 0x03, 0x04

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert bytes to a bytesValue', () => {
    // arrange
    const converter = bytesValue()
    const input = 'AQIDBA==' // 0x01, 0x02, 0x03, 0x04

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ bytesValue: 'AQIDBA==' })
  })

  it('should convert a bytesValue to bytes', () => {
    // arrange
    const converter = bytesValue()
    const input = { bytesValue: 'AQIDBA==' } // 0x01, 0x02, 0x03, 0x04

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual('AQIDBA==')
  })
})
