import { assert, enums, Struct, StructError } from 'superstruct'
import { stringValue } from './string-value'

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
