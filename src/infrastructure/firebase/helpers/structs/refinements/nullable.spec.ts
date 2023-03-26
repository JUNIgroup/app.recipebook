import { assert, Struct, StructError, validate } from 'superstruct'
import { Infer } from '../utilities/helper-types'
import { stringValue } from '../values/string-value'
import { nullable } from './nullable'

describe('nullable', () => {
  it('should create a converter', () => {
    // arrange
    const converter = stringValue()

    // act
    const result = nullable(converter)

    // assert
    expect(result).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept null as internal data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input: Infer<typeof converter> = null

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept data as internal data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input: Infer<typeof converter> = 'foo'

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should not accept undefined as internal data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = undefined

    // act
    const [error] = validate(input, converter.iStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a string, but received: undefined')
  })

  it('should not accept other type as internal data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = 123

    // act
    const [error] = validate(input, converter.iStruct)

    // assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('Expected a string, but received: 123')
  })

  it('should accept nullValue as external data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = { nullValue: null }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept data as external data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = { stringValue: 'foo' }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should not accept undefined as external data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = undefined

    // act
    const [error] = validate(input, converter.eStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected the value to satisfy a union of `object | object`, but received: undefined')
  })

  it('should not accept stringValue mixed with booleanValue as external data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = { stringValue: 'foo', booleanValue: true }

    // act
    const [error] = validate(input, converter.eStruct)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe(
      'Expected the value to satisfy a union of `object | object`, but received: [object Object]',
    )
  })

  it('should convert internal null to external nullValue', () => {
    // arrange
    const converter = nullable(stringValue())
    const input: Infer<typeof converter> = null

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ nullValue: null })
  })

  it('should convert internal data to external value', () => {
    // arrange
    const converter = nullable(stringValue())
    const input: Infer<typeof converter> = 'hello'

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ stringValue: 'hello' })
  })

  it('should convert external nullValue to internal null', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = { nullValue: null }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toBeNull()
  })

  it('should convert external data to internal data', () => {
    // arrange
    const converter = nullable(stringValue())
    const input = { stringValue: 'hello' }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual('hello')
  })
})
