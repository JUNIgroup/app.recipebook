import {
  assertEmptyRest,
  asNumberInRangeInclusive,
  asPrimitive,
  asRecord,
  isRecord,
  parseError,
  asNull,
  extractSingleEntryFromRecord,
} from './basics'

describe('parseError', () => {
  it('should return an error with the correct message', () => {
    // arrange
    const value = 'foo'
    const expectation = 'a record'

    // act
    const error = parseError(value, expectation)

    // assert
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(`Expected ${expectation} but received ${value}`)
  })
})

describe('asNull', () => {
  it('should pass for null', () => {
    // arrange
    const value = null

    // act
    const result = asNull(value, 'test')

    // assert
    expect(result).toBe(value)
  })

  it('should throw error for non-null', () => {
    // arrange
    const value = 'foo'

    // act
    const act = () => asNull(value, 'test')

    // assert
    expect(act).toThrowError('Expected null for test but received foo')
  })

  it('should throw error for undefined', () => {
    // arrange
    const value = undefined

    // act
    const act = () => asNull(value, 'test')

    // assert
    expect(act).toThrowError('Expected null for test but received undefined')
  })
})

describe('asPrimitive', () => {
  it.each`
    type           | value
    ${'boolean'}   | ${true}
    ${'number'}    | ${42}
    ${'string'}    | ${'foo'}
    ${'symbol'}    | ${Symbol('foo')}
    ${'bigint'}    | ${BigInt(42)}
    ${'undefined'} | ${undefined}
  `('should pass for $value of type $type', ({ type, value }) => {
    // act
    const result = asPrimitive(type, value, 'test')

    // assert
    expect(result).toBe(value)
  })

  it.each`
    type           | value
    ${'boolean'}   | ${42}
    ${'number'}    | ${true}
    ${'string'}    | ${42}
    ${'symbol'}    | ${true}
    ${'bigint'}    | ${true}
    ${'undefined'} | ${42}
  `('should throw error for $value of type $type', ({ type, value }) => {
    // act
    const act = () => asPrimitive(type, value, 'test')

    // assert
    expect(act).toThrowError(`Expected a ${type} for test but received ${value}`)
  })
})

describe('asNumberInRangeInclusive', () => {
  it('should pass for an integer number in range', () => {
    // arrange
    const value = 42

    // act
    const result = asNumberInRangeInclusive(value, 'test', 0, 100)

    // assert
    expect(result).toBe(value)
  })

  it('should pass for a float number in range', () => {
    // arrange
    const value = 42.42

    // act
    const result = asNumberInRangeInclusive(value, 'test', 0, 100)

    // assert
    expect(result).toBe(value)
  })

  it('should pass for an float number at lower bound', () => {
    // arrange
    const value = 12.34

    // act
    const result = asNumberInRangeInclusive(value, 'test', 12.34, 100)

    // assert
    expect(result).toBe(value)
  })

  it('should pass for an float number at upper bound', () => {
    // arrange
    const value = 12.34

    // act
    const result = asNumberInRangeInclusive(value, 'test', 0, 12.34)

    // assert
    expect(result).toBe(value)
  })

  it('should throw error for an integer number out of range', () => {
    // arrange
    const value = 42

    // act
    const act = () => asNumberInRangeInclusive(value, 'fooBar', 0, 10)

    // assert
    expect(act).toThrowError('Expected fooBar to be in range [0,10] but received 42')
  })

  it('should throw error for a float number out of range', () => {
    // arrange
    const value = 42.42

    // act
    const act = () => asNumberInRangeInclusive(value, 'fooBar', 0, 10)

    // assert
    expect(act).toThrowError('Expected fooBar to be in range [0,10] but received 42.42')
  })

  it('should throw error for non number', () => {
    // arrange
    const value = 'foo'

    // act
    const act = () => asNumberInRangeInclusive(value, 'fooBar', 0, 100)

    // assert
    expect(act).toThrowError('Expected a number for fooBar but received foo')
  })
})

describe('isRecord', () => {
  it.each`
    value          | expected
    ${{}}          | ${true}
    ${{ foo: 42 }} | ${true}
    ${[]}          | ${false}
    ${null}        | ${false}
    ${undefined}   | ${false}
    ${true}        | ${false}
    ${123}         | ${false}
    ${'foo'}       | ${false}
    ${() => {}}    | ${false}
  `(`should return $expected for $value`, ({ value, expected }) => {
    // act
    const result = isRecord(value)

    // assert
    expect(result).toBe(expected)
  })
})

describe('asRecord', () => {
  it('should pass for a record', () => {
    // arrange
    const value = { foo: 42 }

    // act
    const result = asRecord(value, 'test')

    // assert
    expect(result).toBe(value)
  })

  it('should throw error for non record', () => {
    // arrange
    const value = 42

    // act
    const act = () => asRecord(value, 'test')

    // assert
    expect(act).toThrowError('Expected a record for test but received 42')
  })
})

describe('assertEmptyRecord', () => {
  it('should pass for an empty record', () => {
    // arrange
    const value = {}

    // act
    const act = () => assertEmptyRest(value, 'test')

    // assert
    expect(act).not.toThrow()
  })

  it('should throw error for non empty record (one key)', () => {
    // arrange
    const value = { foo: 42 }

    // act
    const act = () => assertEmptyRest(value, 'test')

    // assert
    expect(act).toThrowError('Expected no extra keys for test but received foo')
  })

  it('should throw error for non empty record (two keys)', () => {
    // arrange
    const value = { foo: 42, bar: 42 }

    // act
    const act = () => assertEmptyRest(value, 'test')

    // assert
    expect(act).toThrowError('Expected no extra keys for test but received foo,bar')
  })
})

describe('extractSingleKeyFromRecord', () => {
  it('should pass for a record with one key', () => {
    // arrange
    const value = { foo: 42 }

    // act
    const result = extractSingleEntryFromRecord(value, 'test')

    // assert
    expect(result).toEqual(['foo', 42])
  })

  it('should throw error for a record with more than one key', () => {
    // arrange
    const value = { foo: 42, bar: 42 }

    // act
    const act = () => extractSingleEntryFromRecord(value, 'test')

    // assert
    expect(act).toThrowError('Expected exactly one key for test but received foo,bar')
  })

  it('should throw error for a record with no key', () => {
    // arrange
    const value = {}

    // act
    const act = () => extractSingleEntryFromRecord(value, 'test')

    // assert
    expect(act).toThrowError('Expected exactly one key for test but received nothing')
  })

  it('should throw error for a non record', () => {
    // arrange
    const value = 42

    // act
    const act = () => extractSingleEntryFromRecord(value, 'test')

    // assert
    expect(act).toThrowError('Expected a record for test but received 42')
  })
})
