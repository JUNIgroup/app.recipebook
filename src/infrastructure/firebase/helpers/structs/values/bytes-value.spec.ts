import { assert, size, string, Struct, StructError } from 'superstruct'
import { bytesValue } from './bytes-value'

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
    const converter = bytesValue(size(string(), 3, 30))
    const input = 'AQIDBA==' // 0x01, 0x02, 0x03, 0x04

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject bytes (base64 encoded string) with restriction as internal data', () => {
    // arrange
    const converter = bytesValue(size(string(), 3, 30))
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
