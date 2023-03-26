import { assert, Struct, StructError } from 'superstruct'
import { timestampValue } from './timestamp-value'

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
