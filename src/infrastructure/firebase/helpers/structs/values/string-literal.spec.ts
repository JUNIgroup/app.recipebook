import { Struct, StructError } from 'superstruct'
import { stringLiteral } from './string-literal'

describe('stringLiteral', () => {
  it('should create a converter', () => {
    // act
    const converter = stringLiteral('foo')

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept the string literal as internal data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = 'foo'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject any other string as internal data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = 'baz'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('Expected the literal `"foo"`, but received: "baz"')
  })

  it('should accept the string literal as external data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = { stringValue: 'foo' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept any other string as external data, because restriction applies only to internal data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = { stringValue: 'baz' }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert the string literal to external data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = 'foo'

    // act
    const output = converter.toE(input)

    // assert
    expect(output).toEqual({ stringValue: 'foo' })
  })

  it('should convert the string literal to internal data', () => {
    // arrange
    const converter = stringLiteral('foo')
    const input = { stringValue: 'foo' }

    // act
    const output = converter.toI(input)

    // assert
    expect(output).toEqual('foo')
  })
})
