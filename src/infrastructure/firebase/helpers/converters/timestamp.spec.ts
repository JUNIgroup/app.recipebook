import {
  compareTimestamps,
  createTimestamp,
  formatTimestamp,
  isTimestamp,
  parseTimestamp,
  Timestamp,
} from './timestamp'

const TimestampTypeTag: Pick<Timestamp, typeof Symbol.toStringTag> = { [Symbol.toStringTag]: 'Timestamp' }

describe('parseTimestamp', () => {
  it('should parse a timestamp string', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00.000000000Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800000, nano: 0, ...TimestampTypeTag })
  })

  it('should parse a timestamp string without fraction', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800000, nano: 0, ...TimestampTypeTag })
  })

  it('should parse a timestamp string without milliseconds', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00.000Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800000, nano: 0, ...TimestampTypeTag })
  })

  it('should parse a timestamp string with nanoseconds', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00.123456789Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800123, nano: 456789, ...TimestampTypeTag })
  })

  it('should parse a very early timestamp with nanoseconds', () => {
    // arrange
    const timestampString = '0001-01-01T00:00:00.123456789Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: -62135596799877, nano: 456789, ...TimestampTypeTag })
  })

  it('should parse a timestamp string with the shortest fractional part', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00.1Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800100, nano: 0, ...TimestampTypeTag })
  })

  it('should parse a timestamp string with the shortest fractional nanoseconds part', () => {
    // arrange
    const timestampString = '2020-01-01T00:00:00.0001Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 1577836800000, nano: 100000, ...TimestampTypeTag })
  })

  it('should parse a timestamp string without zeros', () => {
    // arrange
    const timestampString = '2143-12-31T17:28:59.94241345Z'

    // act
    const timestamp = parseTimestamp(timestampString)

    // assert
    expect(timestamp).toEqual({ time: 5490869339942, nano: 413450, ...TimestampTypeTag })
  })

  it('should throw an error if the value is not a string', () => {
    // act
    const act = () => parseTimestamp(123)

    // assert
    expect(act).toThrowError('Expected a string for timestamp but received 123')
  })

  it('should throw an error if the value is not a timestamp string', () => {
    // act
    const act = () => parseTimestamp('2020-01-01')

    // assert
    expect(act).toThrowError('Expected a timestamp in RFC3339 format but received 2020-01-01')
  })
})

describe('formatTimestamp', () => {
  it('should format a timestamp without nanoseconds', () => {
    // arrange
    const timestamp = { time: 1577836800000, nano: 0, ...TimestampTypeTag }

    // act
    const timestampString = formatTimestamp(timestamp)

    // assert
    expect(timestampString).toEqual('2020-01-01T00:00:00Z')
  })

  it('should format a timestamp with nanoseconds', () => {
    // arrange
    const timestamp = { time: 1577836800123, nano: 456789, ...TimestampTypeTag }

    // act
    const timestampString = formatTimestamp(timestamp)

    // assert
    expect(timestampString).toEqual('2020-01-01T00:00:00.123456789Z')
  })

  it('should format a very early timestamp with nanoseconds', () => {
    // arrange
    const timestamp = { time: -62135596799877, nano: 456789, ...TimestampTypeTag }

    // act
    const timestampString = formatTimestamp(timestamp)

    // assert
    expect(timestampString).toEqual('0001-01-01T00:00:00.123456789Z')
  })

  it('should format a timestamp with the shortest fractional part', () => {
    // arrange
    const timestamp = { time: 1577836800123, nano: 456000, ...TimestampTypeTag }

    // act
    const timestampString = formatTimestamp(timestamp)

    // assert
    expect(timestampString).toEqual('2020-01-01T00:00:00.123456Z')
  })

  it.each`
    original                            | formatted
    ${'2020-01-01T00:00:00.000000000Z'} | ${'2020-01-01T00:00:00Z'}
    ${'2020-01-01T00:00:00Z'}           | ${'2020-01-01T00:00:00Z'}
    ${'2020-01-01T00:00:00.12Z'}        | ${'2020-01-01T00:00:00.12Z'}
    ${'2020-01-01T00:00:00.120000000Z'} | ${'2020-01-01T00:00:00.12Z'}
    ${'2020-01-01T00:00:00.123456Z'}    | ${'2020-01-01T00:00:00.123456Z'}
    ${'2020-01-01T00:00:00.1234560Z'}   | ${'2020-01-01T00:00:00.123456Z'}
    ${'2020-01-01T00:00:00.123456000Z'} | ${'2020-01-01T00:00:00.123456Z'}
    ${'2020-01-01T00:00:00.123456789Z'} | ${'2020-01-01T00:00:00.123456789Z'}
    ${'0001-01-01T00:00:00.123456789Z'} | ${'0001-01-01T00:00:00.123456789Z'}
    ${'2143-12-31T17:28:59.94241345Z'}  | ${'2143-12-31T17:28:59.94241345Z'}
  `('should format the parsed timestamp $original to the semantic equivalent $formatted', ({ original, formatted }) => {
    // act
    const timestamp = parseTimestamp(original)
    const timestampString = formatTimestamp(timestamp)

    // assert
    expect(timestampString).toEqual(formatted)
  })
})

describe('createTimestamp', () => {
  it('should create a timestamp with a time integer', () => {
    // arrange
    const time = 1577836800000
    // act
    const timestamp = createTimestamp(time)

    // assert
    expect(timestamp).toEqual({ time, nano: 0, ...TimestampTypeTag })
  })

  it('should create a timestamp with a time integer and nanoseconds', () => {
    // arrange
    const time = 1577836800000
    const nano = 123456789

    // act
    const timestamp = createTimestamp(time, nano)

    // assert
    expect(timestamp).toEqual({ time, nano, ...TimestampTypeTag })
  })

  it('should create a timestamp with a time Date and nanoseconds', () => {
    // arrange
    const time = 1577836800000
    const nano = 123456789
    const date = new Date(time)

    // act
    const timestamp = createTimestamp(date, nano)

    // assert
    expect(timestamp).toEqual({ time, nano, ...TimestampTypeTag })
  })
})

describe('isTimestamp', () => {
  it('should return true for a timestamp', () => {
    // arrange
    const timestamp = { time: 1577836800000, nano: 0, ...TimestampTypeTag }

    // act
    const result = isTimestamp(timestamp)

    // assert
    expect(result).toBe(true)
  })

  it('should return false for a "timestamp" without toStringTag symbol', () => {
    // arrange
    const timestamp = { time: 1577836800000, nano: 0 }

    // act
    const result = isTimestamp(timestamp)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non-timestamp', () => {
    // arrange
    const object = { foo: 'bar' }

    // act
    const result = isTimestamp(object)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non-object', () => {
    // arrange
    const value = 'foo'

    // act
    const result = isTimestamp(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a null', () => {
    // arrange
    const value = null

    // act
    const result = isTimestamp(value)

    // assert
    expect(result).toBe(false)
  })
})

describe('compareTimestamps', () => {
  it.each`
    timestamp1                                                | timestamp2                                                | sign  | description
    ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${0}  | ${'the timestamps are equal'}
    ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${{ time: 1577836800001, nano: 0, ...TimestampTypeTag }}  | ${-1} | ${'the first timestamp is earlier'}
    ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${{ time: 4732423313000, nano: 0, ...TimestampTypeTag }}  | ${-1} | ${'the first timestamp is much earlier'}
    ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${{ time: 1577836800000, nano: 8, ...TimestampTypeTag }}  | ${-1} | ${'the first timestamp is earlier by nanoseconds'}
    ${{ time: 1577836800000, nano: 8, ...TimestampTypeTag }}  | ${{ time: 1577836800000, nano: 0, ...TimestampTypeTag }}  | ${1}  | ${'the second timestamp is earlier by nanoseconds'}
    ${{ time: 1577836800000, nano: 8, ...TimestampTypeTag }}  | ${{ time: 1577836800001, nano: 0, ...TimestampTypeTag }}  | ${-1} | ${'the first timestamp is earlier by milliseconds but has higher nanoseconds value'}
    ${{ time: -9999999999999, nano: 0, ...TimestampTypeTag }} | ${{ time: 9999999999999, nano: 0, ...TimestampTypeTag }}  | ${-1} | ${'the timestamps with maximum distance in time (<)'}
    ${{ time: 9999999999999, nano: 0, ...TimestampTypeTag }}  | ${{ time: -9999999999999, nano: 0, ...TimestampTypeTag }} | ${1}  | ${'the timestamps with maximum distance in time (>)'}
  `('should return value with sign $sign if $description', ({ timestamp1, timestamp2, sign }) => {
    // act
    const result = compareTimestamps(timestamp1, timestamp2)

    // assert
    expect(Math.sign(result), `sign of ${result}`).toBe(sign)
  })
})
