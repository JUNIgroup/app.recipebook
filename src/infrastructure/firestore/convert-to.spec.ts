import { convertObjectToFields, convertToTypedValue } from './convert-to'

describe('convertToTypedValue', () => {
  it('should throw error if try to convert undefined', () => {
    // arrange
    const value = undefined

    // act
    const act = () => convertToTypedValue(value)

    // assert
    expect(act).toThrowError('Could not convert value of type undefined.')
  })

  it('should convert null to a typed value', () => {
    // arrange
    const value = null

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ nullValue: null })
  })

  it('should convert a boolean to a typed value', () => {
    // arrange
    const value = true

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ booleanValue: true })
  })

  it('should convert a integer to a typed value', () => {
    // arrange
    const value = 42

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ integerValue: '42' })
  })

  it('should convert a double to a typed value', () => {
    // arrange
    const value = 42.42

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ doubleValue: 42.42 })
  })

  it('should convert a string to a typed value', () => {
    // arrange
    const value = 'foo'

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ stringValue: 'foo' })
  })

  it('should convert an empty array to a typed value', () => {
    // arrange
    const value: unknown[] = []

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ arrayValue: {} })
  })

  it('should convert an array to a typed value', () => {
    // arrange
    const value = ['foo', 42]

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ arrayValue: { values: [{ stringValue: 'foo' }, { integerValue: '42' }] } })
  })

  it('should convert an empty object to a typed value', () => {
    // arrange
    const value = {}

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ mapValue: {} })
  })

  it('should convert an object to a typed value', () => {
    // arrange
    const value = { foo: 'bar', baz: 42 }

    // act
    const result = convertToTypedValue(value)

    // assert
    expect(result).toEqual({ mapValue: { fields: { foo: { stringValue: 'bar' }, baz: { integerValue: '42' } } } })
  })

  it('should throw error if try to convert a function', () => {
    // arrange
    const value = () => undefined

    // act
    const act = () => convertToTypedValue(value)

    // assert
    expect(act).toThrowError('Could not convert value of type function.')
  })
})

describe('convertObjectToFields', () => {
  it('should convert an object to a fields object', () => {
    // arrange
    const object = { foo: 'bar', baz: 42 }

    // act
    const result = convertObjectToFields(object)

    // assert
    expect(result).toEqual({ foo: { stringValue: 'bar' }, baz: { integerValue: '42' } })
  })
})
