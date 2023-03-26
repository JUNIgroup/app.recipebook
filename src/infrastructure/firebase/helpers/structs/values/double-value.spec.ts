import { assert, number, size, Struct, StructError } from 'superstruct'
import { doubleValue } from './double-value'

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
