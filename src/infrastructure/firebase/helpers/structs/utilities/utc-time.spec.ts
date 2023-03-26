import { assert, StructError } from 'superstruct'
import { formatTimestamp, parseUtcTimeString, utcTimeString } from './utc-time'

describe('utcTimeString', () => {
  const struct = utcTimeString()

  it.each`
    input
    ${'2020-01-01T00:00:00Z'}
    ${'2020-01-01T00:00:00.000Z'}
    ${'2020-01-01T00:00:00.000000Z'}
    ${'2020-01-01T00:00:00.000000000Z'}
    ${'2020-01-01T00:00:00.000000001Z'}
    ${'2021-12-31T23:59:59.999999999Z'}
  `('should accept $input', ({ input }) => {
    // act
    const result = struct.validate(input)

    // assert
    expect(result).toEqual([undefined, input])
  })

  it.each`
    input                                | why
    ${'2020-01-01T00:00:00'}             | ${'missing Z'}
    ${'2020-01-01T00:00:00.000000000'}   | ${'missing Z'}
    ${'2020-01-01T00:00:00.0000000000Z'} | ${'too many digits in fractional seconds'}
    ${'2020-01-01T00:00:00.0000+01:00'}  | ${'not UTC "Zulu" time'}
    ${'foo bar'}                         | ${'not a date string'}
  `('should reject $input ($why)', ({ input }) => {
    // act
    const [error] = struct.validate(input)

    // assert
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toEqual(`Expected a UTC time, but received: ${input}`)
  })

  function cross(axis: Record<string, string[]>): { [key: string]: string }[] {
    let samples = [{}] as { [key: string]: string }[]
    Object.keys(axis).forEach((key) => {
      const basis = samples
      samples = []
      axis[key].forEach((value) => {
        basis.forEach((sample) => {
          samples.push({ ...sample, [key]: value })
        })
      })
    })
    return samples
  }

  describe('test date at the values limits', () => {
    const dateSamples = cross({
      month: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
      day: ['01', '02', '28', '29', '30', '31'],
    }).map(({ month, day }) => `2020-${month}-${day}`)

    it.each(dateSamples)('should accept date %s', (dateString) => {
      // arrange
      const input = `${dateString}T00:00:00Z`

      // act
      const result = struct.validate(input)
      const date = Date.parse(input)

      // assert
      expect(result).toEqual([undefined, input])
      expect(date).not.toBeNaN()
    })
  })

  describe('test time at the values limits', () => {
    const timeSamples = cross({
      hour: ['00', '01', '23', '24'],
      min: ['00', '01', '59', '60'],
      sec: ['00', '01', '59', '60'],
      milliseconds: ['', '.0', '.000', '.001', '.999'],
    }).map(({ hour, min, sec, milliseconds }) => `${hour}:${min}:${sec}${milliseconds}`)

    const acceptedTimeSamples = timeSamples.filter((sample) => !Number.isNaN(Date.parse(`2020-01-01T${sample}Z`)))
    const rejectedTimeSamples = timeSamples.filter((sample) => Number.isNaN(Date.parse(`2020-01-01T${sample}Z`)))

    it.each(acceptedTimeSamples)('should accept time %s', (timeString) => {
      // arrange
      const input = `2020-01-01T${timeString}Z`

      // act
      const result = struct.validate(input)

      // assert
      expect(result).toEqual([undefined, input])
    })

    it.each(rejectedTimeSamples)('should reject time %s', (timeString) => {
      // arrange
      const input = `2020-01-01T${timeString}`

      // act
      const [error] = struct.validate(input)

      // assert
      expect(error).toBeInstanceOf(StructError)
      expect(error?.message).toEqual(`Expected a UTC time, but received: ${input}`)
    })
  })
})

describe('parseUtcTimeString', () => {
  it.each`
    input                               | time              | nano
    ${'2020-01-01T00:00:00Z'}           | ${1577836800_000} | ${0}
    ${'2021-12-31T23:59:59Z'}           | ${1640995199_000} | ${0}
    ${'2021-12-31T23:59:59.8Z'}         | ${1640995199_800} | ${0}
    ${'2021-12-31T23:59:59.876Z'}       | ${1640995199_876} | ${0}
    ${'2021-12-31T23:59:59.8765Z'}      | ${1640995199_876} | ${500000}
    ${'2021-12-31T23:59:59.87654Z'}     | ${1640995199_876} | ${540000}
    ${'2021-12-31T23:59:59.876543210Z'} | ${1640995199_876} | ${543210}
  `('should parse a UTC time string "$input"', ({ input, time, nano }) => {
    // act
    const result = parseUtcTimeString(input)

    // assert
    expect(result).toEqual({ time, nano })
  })

  it.each`
    input
    ${'2020-12-31T24:00:00Z'}
    ${'9999-12-31T24:00:00.0Z'}
    ${'9999-12-31T24:00:00.000Z'}
    ${'9999-12-31T24:00:00.000000000Z'}
  `('should parse a UTC time string "$input" with 24:00:00 time', ({ input }) => {
    // arrange
    assert(input, utcTimeString())

    // act
    const result = parseUtcTimeString(input)

    // assert
    expect(result).toMatchObject({
      time: expect.any(Number),
      nano: expect.any(Number),
    })
    expect(result.time).not.toBeNaN()
  })
})

describe('formatTimestamp', () => {
  it.each`
    timestamp                                    | expected
    ${{ time: 1577836800_000, nano: 0 }}         | ${'2020-01-01T00:00:00Z'}
    ${{ time: 1577836800_123, nano: 0 }}         | ${'2020-01-01T00:00:00.123Z'}
    ${{ time: 1577836800_123, nano: 1 }}         | ${'2020-01-01T00:00:00.123000001Z'}
    ${{ time: 1577836800_123, nano: 450_000 }}   | ${'2020-01-01T00:00:00.12345Z'}
    ${{ time: 1577836800_123, nano: 456_789 }}   | ${'2020-01-01T00:00:00.123456789Z'}
    ${{ time: 1640995199_876, nano: 543_210 }}   | ${'2021-12-31T23:59:59.87654321Z'}
    ${{ time: -62135596799_877, nano: 456_789 }} | ${'0001-01-01T00:00:00.123456789Z'}
  `('should format a timestamp $timestamp', ({ timestamp, expected }) => {
    // act
    const result = formatTimestamp(timestamp)

    // assert
    expect(result).toEqual(expected)
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
    const timestamp = parseUtcTimeString(original)
    const timestampString = formatTimestamp(timestamp ?? { time: 0, nano: 0 })

    // assert
    expect(timestampString).toEqual(formatted)
  })
})
