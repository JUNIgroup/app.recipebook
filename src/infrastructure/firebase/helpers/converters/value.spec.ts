import { formatValue, parseValue, Value } from './value'
import { Timestamp, createTimestamp } from './timestamp'
import { createGeoPoint, GeoPoint } from './geopoint'
import { Base64Data, createBase64Data } from './base64data'

describe('parseValue', () => {
  describe('nullValue', () => {
    it('should parse null', () => {
      // arrange
      const value = {
        nullValue: null,
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBeNull()
    })

    it('should fail to parse a non-null value', () => {
      // arrange
      const value = {
        nullValue: 'foo',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected null for nullValue but received foo')
    })
  })

  describe('booleanValue', () => {
    it('should parse a boolean', () => {
      // arrange
      const value = {
        booleanValue: true,
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBe(true)
    })

    it('should fail to parse a non-boolean value', () => {
      // arrange
      const value = {
        booleanValue: 'foo',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a boolean for booleanValue but received foo')
    })
  })

  describe('integerValue', () => {
    it('should parse a string as integer number', () => {
      // arrange
      const value = {
        integerValue: '42',
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBe(42)
    })

    it('should parse a string as positive big int', () => {
      // arrange
      const value = {
        integerValue: '9007199254740992',
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBe(9007199254740992n)
    })

    it('should parse a string as negative big int', () => {
      // arrange
      const value = {
        integerValue: '-9007199254740992',
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBe(-9007199254740992n)
    })

    it('should fail to parse a value to large for an int64', () => {
      // arrange
      const value = {
        integerValue: '9223372036854775808',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError(
        'Expected an int64 value in range of [-9223372036854775808,9223372036854775807] but received 9223372036854775808',
      )
    })

    it('should fail to parse a value to small for an int64', () => {
      // arrange
      const value = {
        integerValue: '-9223372036854775809',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError(
        'Expected an int64 value in range of [-9223372036854775808,9223372036854775807] but received -9223372036854775809',
      )
    })

    it('should fail to parse a non-string value', () => {
      // arrange
      const value = {
        integerValue: true,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a string for integerValue but received true')
    })
  })

  describe('doubleValue', () => {
    it('should parse a number', () => {
      // arrange
      const value = {
        doubleValue: 42.5,
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBeCloseTo(42.5, 2)
    })

    it('should fail to parse a non-number value', () => {
      // arrange
      const value = {
        doubleValue: '42.42',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a number for doubleValue but received 42.42')
    })
  })

  describe('stringValue', () => {
    it('should parse a string', () => {
      // arrange
      const value = {
        stringValue: 'foo bar',
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toBe('foo bar')
    })

    it('should fail to parse a non-string value', () => {
      // arrange
      const value = {
        stringValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a string for stringValue but received 42')
    })
  })

  describe('bytesValue', () => {
    it('should parse a string as base64 buffer', () => {
      // arrange
      const value = {
        bytesValue: 'Zm9vIGJhcg==', // base64 encoding of 'foo bar'
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({
        data: 'Zm9vIGJhcg==',
        [Symbol.toStringTag]: 'Base64Data',
      })
    })

    it('should fail to parse a non-string value', () => {
      // arrange
      const value = {
        bytesValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a string for Base64Data but received 42')
    })
  })

  describe('timestampValue', () => {
    it('should parse a string as timestamp', () => {
      // arrange
      const value = {
        timestampValue: '2020-01-01T00:00:00.000Z',
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({
        time: 1577836800000,
        nano: 0,
        [Symbol.toStringTag]: 'Timestamp',
      })
    })

    it('should fail to parse a non-string value', () => {
      // arrange
      const value = {
        timestampValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a string for timestamp but received 42')
    })

    it('should fail to parse an invalid formatted time', () => {
      // arrange
      const value = {
        timestampValue: '2020-01-01T00:00:00.000+01:00',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a timestamp in RFC3339 format but received 2020-01-01T00:00:00.000+01:00')
    })
  })

  describe('geoPointValue', () => {
    it('should parse a geo point', () => {
      // arrange
      const value = {
        geoPointValue: { latitude: 42.42, longitude: 123.123 },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({
        latitude: 42.42,
        longitude: 123.123,
        [Symbol.toStringTag]: 'GeoPoint',
      })
    })

    it('should fail to parse a non-object value', () => {
      // arrange
      const value = {
        geoPointValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for GeoPoint but received 42')
    })

    it('should fail to parse a geo point without latitude', () => {
      // arrange
      const value = {
        geoPointValue: { longitude: 123.123 },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a number for latitude but received undefined')
    })
  })

  describe('arrayValue', () => {
    it('should parse an empty array', () => {
      // arrange
      const value = {
        arrayValue: {
          values: [],
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual([])
    })

    it('should parse an array', () => {
      // arrange
      const value = {
        arrayValue: {
          values: [{ integerValue: '42' }],
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual([42])
    })

    it('should parse an array with different element types', () => {
      // arrange
      const value = {
        arrayValue: {
          values: [{ integerValue: '42' }, { stringValue: 'hello' }],
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual([42, 'hello'])
    })

    it('should fail to parse a non {values:...} object', () => {
      // arrange
      const value = {
        arrayValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for arrayValue but received 42')
    })

    it('should fail to parse a non-array for arrayValue.values', () => {
      // arrange
      const value = {
        arrayValue: {
          values: 42,
        },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected an array for arrayValue.values but received 42')
    })

    it('should fail to parse an object without values key', () => {
      // arrange
      const value = {
        arrayValue: {},
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected an array for arrayValue.values but received undefined')
    })

    it('should fail to parse an object with extra key additional to values', () => {
      // arrange
      const value = {
        arrayValue: {
          values: [],
          foo: 'bar',
        },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected no extra keys for arrayValue but received foo')
    })
  })

  describe('mapValue', () => {
    it('should parse an empty map', () => {
      // arrange
      const value = {
        mapValue: {
          fields: {},
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({})
    })

    it('should parse a map', () => {
      // arrange
      const value = {
        mapValue: {
          fields: {
            foo: { integerValue: '42' },
          },
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({ foo: 42 })
    })

    it('should parse a map with different element types', () => {
      // arrange
      const value = {
        mapValue: {
          fields: {
            foo: { integerValue: '42' },
            bar: { stringValue: 'hello' },
          },
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({ foo: 42, bar: 'hello' })
    })

    it('should fail to parse a non {fields:...} object', () => {
      // arrange
      const value = {
        mapValue: 42,
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for mapValue but received 42')
    })

    it('should fail to parse a non-object for mapValue.fields', () => {
      // arrange
      const value = {
        mapValue: {
          fields: 42,
        },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for mapValue.fields but received 42')
    })

    it('should fail to parse an array for mapValue.fields', () => {
      // arrange
      const value = {
        mapValue: {
          fields: [],
        },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for mapValue.fields but received ')
    })

    it('should fail to parse an object without fields key', () => {
      // arrange
      const value = {
        mapValue: {},
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected a record for mapValue.fields but received undefined')
    })

    it('should fail to parse an object with extra key additional to fields', () => {
      // arrange
      const value = {
        mapValue: {
          fields: {},
          foo: 'bar',
        },
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected no extra keys for mapValue but received foo')
    })
  })

  describe('...more...', () => {
    it('should fail to parse an unknown value type', () => {
      // arrange
      const value = {
        colorValue: 'red',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError(
        'Expected value type to be nullValue, booleanValue, integerValue, doubleValue, stringValue, bytesValue, timestampValue, geoPointValue, arrayValue, mapValue but received colorValue',
      )
    })

    it('should fail to parse a record without a valueType', () => {
      // arrange
      const value = {}

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected exactly one key for value but received nothing')
    })

    it('should fail to parse multiple value types in same record', () => {
      // arrange
      const value = {
        integerValue: '42',
        stringValue: 'hello',
      }

      // act
      const act = () => parseValue(value)

      // assert
      expect(act).toThrowError('Expected exactly one key for value but received integerValue,stringValue')
    })

    it('should parse deep nested values', () => {
      // arrange
      const value = {
        mapValue: {
          fields: {
            fooMap: {
              mapValue: {
                fields: {
                  barMap: {
                    mapValue: {
                      fields: {
                        bazMap: { integerValue: '100' },
                        intField: { integerValue: '102' },
                      },
                    },
                  },
                  barArray: {
                    arrayValue: {
                      values: [
                        { integerValue: '200' },
                        {
                          mapValue: {
                            fields: {
                              baz: { integerValue: '300' },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }

      // act
      const result = parseValue(value)

      // assert
      expect(result).toEqual({ fooMap: { barMap: { bazMap: 100, intField: 102 }, barArray: [200, { baz: 300 }] } })
    })
  })
})

describe('formatValue', () => {
  it('should format null to nullValue', () => {
    // arrange
    const value = null

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ nullValue: null })
  })

  it('should format a boolean to booleanValue', () => {
    // arrange
    const value = true

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ booleanValue: true })
  })

  it('should format an integer number to integerValue', () => {
    // arrange
    const value = 42

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ integerValue: '42' })
  })

  it('should format a float number to doubleValue', () => {
    // arrange
    const value = 42.5

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ doubleValue: 42.5 })
  })

  it('should format a bigint to integerValue', () => {
    // arrange
    const value = BigInt(42)

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ integerValue: '42' })
  })

  it('should format a large bigint to integerValue', () => {
    // arrange
    const value = 2n ** 60n + 3832n

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ integerValue: '1152921504606850808' })
  })

  it('should format a string to stringValue', () => {
    // arrange
    const value = 'hello'

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ stringValue: 'hello' })
  })

  it('should format a Base64Data to bytesValue', () => {
    // arrange
    const value: Base64Data = createBase64Data('aGVsbG8gd29ybGQ=') // base64 encoded 'hello world'

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ bytesValue: 'aGVsbG8gd29ybGQ=' })
  })

  it('should format a timestamp to timestampValue', () => {
    // arrange
    const value: Timestamp = createTimestamp(new Date('2020-01-01T00:00:00.000Z'), 123456)

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ timestampValue: '2020-01-01T00:00:00.000123456Z' })
  })

  it('should format a geoPoint to geoPointValue', () => {
    // arrange
    const value: GeoPoint = createGeoPoint(42, 43)

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({ geoPointValue: { latitude: 42, longitude: 43 } })
  })

  it('should format an empty array to arrayValue', () => {
    // arrange
    const value: Value[] = []

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({
      arrayValue: {
        values: [],
      },
    })
  })

  it('should format array to arrayValue', () => {
    // arrange
    const value = [1, 2.01, 3n, true]

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({
      arrayValue: {
        values: [{ integerValue: '1' }, { doubleValue: 2.01 }, { integerValue: '3' }, { booleanValue: true }],
      },
    })
  })

  it('should format an empty object to mapValue', () => {
    // arrange
    const value: Record<string, Value> = {}

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({
      mapValue: {
        fields: {},
      },
    })
  })

  it('should format object to mapValue', () => {
    // arrange
    const value = {
      foo: 1,
      bar: 2.01,
      baz: 3n,
      bool: true,
    }

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({
      mapValue: {
        fields: {
          foo: { integerValue: '1' },
          bar: { doubleValue: 2.01 },
          baz: { integerValue: '3' },
          bool: { booleanValue: true },
        },
      },
    })
  })

  it('should format deep nested values', () => {
    // arrange
    const value = {
      fooMap: {
        barMap: {
          bazMap: 100,
          intField: 102,
        },
        barArray: [200, { baz: 300 }],
      },
    }

    // act
    const result = formatValue(value)

    // assert
    expect(result).toEqual({
      mapValue: {
        fields: {
          fooMap: {
            mapValue: {
              fields: {
                barMap: {
                  mapValue: {
                    fields: {
                      bazMap: { integerValue: '100' },
                      intField: { integerValue: '102' },
                    },
                  },
                },
                barArray: {
                  arrayValue: {
                    values: [
                      { integerValue: '200' },
                      {
                        mapValue: {
                          fields: {
                            baz: { integerValue: '300' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    })
  })
})
