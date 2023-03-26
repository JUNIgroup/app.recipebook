import { assert, literal, Struct, StructError } from 'superstruct'
import { booleanValue } from './boolean-value'

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
