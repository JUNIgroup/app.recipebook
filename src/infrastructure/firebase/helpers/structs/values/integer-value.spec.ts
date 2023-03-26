import { assert, bigint, integer, Struct, StructError } from 'superstruct'
import { integerValue } from './integer-value'

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
