import { bigint, StructError } from 'superstruct'
import { int64, int64String, parseInt64String } from './int64'

describe('int64String', () => {
  const struct = int64String()

  it.each`
    input
    ${'0'}
    ${'1'}
    ${'-1'}
    ${String(Number.MAX_SAFE_INTEGER)}
    ${String(Number.MIN_SAFE_INTEGER)}
    ${'1234567890123456789'}
    ${'-1234567890123456789'}
    ${'9999999999999999999'}
    ${'-9999999999999999999'}
  `('should accept $input', ({ input }) => {
    // act
    const result = struct.validate(input)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it.each`
    input                      | why
    ${'-0'}                    | ${'leading minus on zero'}
    ${'0.1'}                   | ${'decimal'}
    ${'1e10'}                  | ${'not only digits'}
    ${'hello world'}           | ${'no digits at all'}
    ${'12345678901234567890'}  | ${'too many digits'}
    ${'-12345678901234567890'} | ${'too many digits'}
    ${'0001'}                  | ${'leading zeros'}
    ${'-0001'}                 | ${'leading zeros'}
  `('should reject $input ($why)', ({ input }) => {
    // act
    const [error] = struct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(`Expected an int64 string, but received "${input}"`)
  })
})

describe('parseInt64String', () => {
  it('should parse a string into a number ', () => {
    // arrange
    const input = '123'

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(123)
  })

  it('should parse a string into bigint', () => {
    // arrange
    const input = '92233720368547758' // > Number.MAX_SAFE_INTEGER

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(92233720368547758n)
  })

  it('should be forced to parse into bigint', () => {
    // arrange
    const input = '12'

    // act
    const result = parseInt64String(input, bigint())

    // assert
    expect(result).toEqual(12n)
  })

  it('should parse zero into number', () => {
    // arrange
    const input = '0'

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(0)
  })

  it('should parse a max safe integer plus one into bigint', () => {
    // arrange
    const input = '9007199254740992' // max safe integer is 2^53-1 = 9007199254740991

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(9007199254740992n)
  })

  it('should parse a min safe integer minus one into bigint', () => {
    // arrange
    const input = '-9007199254740992' // min safe integer is -2^53+1 = -9007199254740991

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(-9007199254740992n)
  })

  it('should parse max signed 64-bit integer into bigint', () => {
    // arrange
    const input = '9223372036854775807' // 2^63-1

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(9223372036854775807n)
  })

  it('should parse min signed 64-bit integer into bigint', () => {
    // arrange
    const input = '-9223372036854775808' // -2^63

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(-9223372036854775808n)
  })

  it('should parse number with 19 digits (out of signed 64-bit integer range) into bigint', () => {
    // arrange
    const input = '9999999999999999999' // 19 digits > 2^63-1

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(9999999999999999999n)
  })

  it('should parse number with minus and 19 digits (out of signed 64-bit integer range) into bigint', () => {
    // arrange
    const input = '-9999999999999999999' // -2^63

    // act
    const result = parseInt64String(input, int64())

    // assert
    expect(result).toEqual(-9999999999999999999n)
  })
})

describe('int64', () => {
  const struct = int64()

  it.each`
    input
    ${0}
    ${1}
    ${Number.MAX_SAFE_INTEGER}
    ${Number.MIN_SAFE_INTEGER}
    ${2n ** 63n - 1n}
    ${-(2n ** 63n)}
  `('should accept $input', ({ input }) => {
    // act
    const result = struct.validate(input)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it.each`
    input                | why
    ${'foo'}             | ${'not a number'}
    ${0.1}               | ${'decimal'}
    ${NaN}               | ${'NaN'}
    ${Infinity}          | ${'Infinity'}
    ${-Infinity}         | ${'-Infinity'}
    ${2n ** 63n}         | ${'too big'}
    ${-(2n ** 63n) - 1n} | ${'too small'}
  `('should reject $input ($why)', ({ input }) => {
    // act
    const [error] = struct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(`Expected an int64, but received: ${input}`)
  })
})
