import { assert, Struct, validate } from 'superstruct'
import { Infer } from '../utilities/helper-types'
import { arrayValue } from './array-value'
import { stringValue } from './string-value'

describe('arrayValue', () => {
  it('should create a converter', () => {
    // arrange
    const element = stringValue()

    // act
    const converter = arrayValue(element)

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept an array as internal data', () => {
    // arrange
    const element = stringValue()
    const converter = arrayValue(element)
    const input: Infer<typeof converter> = ['hello', 'world']

    // act
    const result = validate(input, converter.iStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should accept a value struct as external data', () => {
    // arrange
    const element = stringValue()
    const converter = arrayValue(element)
    const input = {
      arrayValue: {
        values: [{ stringValue: 'hello' }, { stringValue: 'world' }],
      },
    }

    // act
    const result = validate(input, converter.eStruct)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it('should convert internal data to external data', () => {
    // arrange
    const element = stringValue()
    const converter = arrayValue(element)
    const input: Infer<typeof converter> = ['hello', 'world']

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({
      arrayValue: {
        values: [{ stringValue: 'hello' }, { stringValue: 'world' }],
      },
    })
  })

  it('should convert external data to internal data', () => {
    // arrange
    const element = stringValue()
    const converter = arrayValue(element)
    const input = {
      arrayValue: {
        values: [{ stringValue: 'hello' }, { stringValue: 'world' }],
      },
    }

    // act
    assert(input, converter.eStruct)
  })
})
