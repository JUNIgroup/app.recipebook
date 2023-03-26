import { assert, literal, StructError } from 'superstruct'
import { Infer } from '../utilities/helper-types'
import { arrayValue } from './array-value'
import { booleanValue } from './boolean-value'
import { discriminatedUnion } from './discriminated-union'
import { doubleValue } from './double-value'
import { mapValue } from './map-value'
import { stringValue } from './string-value'

describe('discriminatedUnion', () => {
  it('should create a converter', () => {
    // act
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )

    // assert
    expect(converter).toMatchObject({
      iStruct: expect.any(Object),
      eStruct: expect.any(Object),
      toI: expect.any(Function),
      toE: expect.any(Function),
    })
  })

  it('should accept first type as internal data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      type: 'a',
      value: 'Hello World',
    }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept second type as internal data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      type: 'b',
      value: true,
    }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject internal data with unknown key as discriminate', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      type: 'c',
      value: true,
    }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('At path: type -- Expected one of `"a","b"`, but received: "c"')
  })

  it('should reject internal data with missing path', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      value: true,
    }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('At path: type -- Expected one of `"a","b"`, but received: undefined')
  })

  it('should reject internal data with valid discriminate but invalid selected type', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      type: 'b',
      value: 'Foo',
    }

    // act
    const [error] = converter.iStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('At path: value -- Expected a value of type `boolean`, but received: `"Foo"`')
  })

  it('should accept first type as external data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          type: { stringValue: 'a' },
          value: { stringValue: 'Hello World' },
        },
      },
    }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should accept second type as external data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          type: { stringValue: 'b' },
          value: { booleanValue: true },
        },
      },
    }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeUndefined()
  })

  it('should reject external data with unknown key as discriminate', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          type: { stringValue: 'c' },
          value: { booleanValue: true },
        },
      },
    }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(
      'At path: mapValue.fields.type.stringValue -- Expected one of `"a","b"`, but received: "c"',
    )
  })

  it('should reject external data with missing path', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          value: { booleanValue: true },
        },
      },
    }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual('At path: mapValue.fields.type -- Expected an object, but received: undefined')
  })

  it('should reject external data with valid discriminate but invalid selected type', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          type: { stringValue: 'b' },
          value: { stringValue: 'Foo' },
        },
      },
    }

    // act
    const [error] = converter.eStruct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(
      'At path: mapValue.fields.value.booleanValue -- Expected a value of type `boolean`, but received: `undefined`',
    )
  })

  it('should convert internal data to external data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      type: 'a',
      value: 'Hello World',
    }

    // act
    assert(input, converter.iStruct)
    const output = converter.toE(input)
    assert(output, converter.eStruct)

    // assert
    expect(output).toEqual({
      mapValue: {
        fields: {
          type: { stringValue: 'a' },
          value: { stringValue: 'Hello World' },
        },
      },
    })
  })

  it('should convert external data to internal data', () => {
    // arrange
    const converter = discriminatedUnion(
      {
        a: mapValue({
          type: stringValue(literal('a')),
          value: stringValue(),
        }),
        b: mapValue({
          type: stringValue(literal('b')),
          value: booleanValue(),
        }),
      },
      'type',
    )
    const input = {
      mapValue: {
        fields: {
          type: { stringValue: 'b' },
          value: { booleanValue: true },
        },
      },
    }

    // act
    assert(input, converter.eStruct)
    const output = converter.toI(input)
    assert(output, converter.iStruct)

    // assert
    expect(output).toEqual({
      type: 'b',
      value: true,
    })
  })

  it('should convert deep maps', () => {
    // arrange
    const point2dConverter = mapValue({
      point: mapValue({
        dimension: stringValue(literal('2d')),
        x: doubleValue(),
        y: doubleValue(),
      }),
    })
    const point3dConverter = mapValue({
      point: mapValue({
        dimension: stringValue(literal('3d')),
        x: doubleValue(),
        y: doubleValue(),
        z: doubleValue(),
      }),
    })
    const converter = arrayValue(
      discriminatedUnion(
        {
          '2d': point2dConverter,
          '3d': point3dConverter,
        },
        'point',
        'dimension',
      ),
    )
    const internal1: Infer<typeof converter> = [
      { point: { dimension: '2d', x: 100.0, y: 200.0 } },
      { point: { dimension: '3d', x: 140.0, y: 160.0, z: 40.0 } },
      { point: { dimension: '2d', x: 180.0, y: 120.0 } },
    ]

    // act
    assert(internal1, converter.iStruct)
    const external = converter.toE(internal1)
    assert(external, converter.eStruct)
    const internal2 = converter.toI(external)
    assert(internal2, converter.iStruct)

    // assert
    expect(external).toEqual({
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                point: {
                  mapValue: {
                    fields: {
                      dimension: { stringValue: '2d' },
                      x: { doubleValue: 100 },
                      y: { doubleValue: 200 },
                    },
                  },
                },
              },
            },
          },
          {
            mapValue: {
              fields: {
                point: {
                  mapValue: {
                    fields: {
                      dimension: { stringValue: '3d' },
                      x: { doubleValue: 140 },
                      y: { doubleValue: 160 },
                      z: { doubleValue: 40 },
                    },
                  },
                },
              },
            },
          },
          {
            mapValue: {
              fields: {
                point: {
                  mapValue: {
                    fields: {
                      dimension: { stringValue: '2d' },
                      x: { doubleValue: 180 },
                      y: { doubleValue: 120 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    })

    expect(internal2).toEqual(internal1)
  })
})
