import { assert, Struct } from 'superstruct'
import { nullValue } from './null-value'

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
