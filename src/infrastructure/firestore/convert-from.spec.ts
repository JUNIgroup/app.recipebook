import { convertDocumentToResult, convertFieldsToObject, convertToPlainValue } from './convert-from'

describe('convertDocumentToResult', () => {
  it('should convert an empty document to a result', () => {
    // arrange
    const document = {
      name: 'foo',
      createTime: '2021-01-01T17:18:19.234567Z',
      updateTime: '2022-12-31T23:59:59.999999Z',
    }
    const expectedLastUpdate = new Date('2022-12-31T23:59:59.999Z').getTime()

    // act
    const result = convertDocumentToResult(document)

    // assert
    expect(result).toEqual({ lastUpdate: expectedLastUpdate, doc: {} })
  })

  it('should convert a document with fields to a result', () => {
    // arrange
    const document = {
      name: 'foo',
      fields: {
        id: { stringValue: 'foo' },
        rev: { integerValue: '42' },
        content: { mapValue: { fields: { bar: { stringValue: 'baz' } } } },
      },
      createTime: '2021-01-01T17:18:19.234567Z',
      updateTime: '2022-12-31T23:59:59.999999Z',
    }
    const expectedLastUpdate = new Date('2022-12-31T23:59:59.999Z').getTime()

    // act
    const result = convertDocumentToResult(document)

    // assert
    expect(result).toEqual({
      lastUpdate: expectedLastUpdate,
      doc: { id: 'foo', rev: 42, content: { bar: 'baz' } },
    })
  })
})

describe('convertFieldsToObject', () => {
  it('should convert an empty fields object to an empty object', () => {
    // arrange
    const fields = {}

    // act
    const result = convertFieldsToObject(fields)

    // assert
    expect(result).toEqual({})
  })

  it('should convert a fields object to an object', () => {
    // arrange
    const fields = {
      foo: { stringValue: 'bar' },
      baz: { integerValue: '42' },
    }

    // act
    const result = convertFieldsToObject(fields)

    // assert
    expect(result).toEqual({ foo: 'bar', baz: 42 })
  })
})

describe('convertToPlainValue', () => {
  it('should convert a booleanValue to a boolean', () => {
    // arrange
    const value = { booleanValue: true }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toBe(true)
  })

  it('should convert a nullValue to null', () => {
    // arrange
    const value = { nullValue: null }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toBe(null)
  })

  it('should convert a stringValue to a string', () => {
    // arrange
    const value = { stringValue: 'foo' }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toBe('foo')
  })

  it('should convert an integer value to a number', () => {
    // arrange
    const value = { integerValue: '42' }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toBe(42)
  })

  it('should convert an double value to a number', () => {
    // arrange
    const value = { doubleValue: 42.42 }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toBe(42.42)
  })

  it('should convert an empty mapValue to an object', () => {
    // arrange
    const value = {
      mapValue: {},
    }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toEqual({})
  })

  it('should convert a mapValue to an object', () => {
    // arrange
    const value = {
      mapValue: {
        fields: {
          foo: { stringValue: 'bar' },
          baz: { integerValue: '42' },
        },
      },
    }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toEqual({ foo: 'bar', baz: 42 })
  })

  it('should convert an empty arrayValue to an array', () => {
    // arrange
    const value = {
      arrayValue: {},
    }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toEqual([])
  })

  it('should convert a arrayValue to an array', () => {
    // arrange
    const value = {
      arrayValue: {
        values: [{ stringValue: 'bar' }, { integerValue: '42' }],
      },
    }

    // act
    const result = convertToPlainValue(value)

    // assert
    expect(result).toEqual(['bar', 42])
  })

  it('should throw an error for an unknown value', () => {
    // arrange
    const value = { foo: 'bar' }

    // act
    const act = () => convertToPlainValue(value)

    // assert
    expect(act).toThrowError('Could not convert value with keys: foo')
  })
})
