import { assert, Struct, StructError } from 'superstruct'
import { geoPointValue } from './geo-point-value'

describe('geoPointValue', () => {
  it('should create a converter', () => {
    // act
    const converter = geoPointValue()

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Struct),
      eStruct: expect.any(Struct),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept a geo point as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 2.2 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject a geo point with too large latitude as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 91.0, longitude: 2.2 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: latitude -- Expected a number between `-90` and `90` but received `91`')
  })

  it('should reject a geo point with too large longitude as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 181.0 }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: longitude -- Expected a number between `-180` and `180` but received `181`')
  })

  it('should reject a string as internal data', () => {
    // arrange
    const converter = geoPointValue()
    const input = '1'

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected an object, but received: "1"')
  })

  it('should accept a geo point as external data', () => {
    // arrange
    const converter = geoPointValue()
    const input = { geoPointValue: { latitude: 1.1, longitude: 2.2 } }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should convert a geo point to a geoPointValue', () => {
    // arrange
    const converter = geoPointValue()
    const input = { latitude: 1.1, longitude: 2.2 }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({ geoPointValue: { latitude: 1.1, longitude: 2.2 } })
  })

  it('should convert a geoPointValue to a geo point', () => {
    // arrange
    const converter = geoPointValue()
    const input = { geoPointValue: { latitude: 1.1, longitude: 2.2 } }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({ latitude: 1.1, longitude: 2.2 })
  })
})
