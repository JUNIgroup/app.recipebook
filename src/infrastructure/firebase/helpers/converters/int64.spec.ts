import { parseInt64 } from './int64'

describe('parseInt64', () => {
  it('should return a integer number for a safe integer value', () => {
    // arrange
    const value = '42'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(42)
  })

  it('should return a number for zero', () => {
    // arrange
    const value = '0'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(0)
  })

  it('should return a number for the largest safe integer value', () => {
    // arrange
    const value = '9007199254740991'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('should return a number for the smallest safe integer value', () => {
    // arrange
    const value = '-9007199254740991'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(Number.MIN_SAFE_INTEGER)
  })

  it('should return a bigint number for a unsafe integer value', () => {
    // arrange
    const value = '1152921504606846976' // 2^60

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(1152921504606846976n)
  })

  it('should return a bigint number for one above the largest safe integer value', () => {
    // arrange
    const value = '9007199254740992'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(9007199254740992n)
  })

  it('should return a bigint number for one below the smallest safe integer value', () => {
    // arrange
    const value = '-9007199254740992'

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(-9007199254740992n)
  })

  it('should return a bigint number for the largest signed 64-bit integer value', () => {
    // arrange
    const value = '9223372036854775807' // 2^63 - 1

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(9223372036854775807n)
  })

  it('should return a bigint number for the smallest signed 64-bit integer value', () => {
    // arrange
    const value = '-9223372036854775808' // -2^63

    // act
    const result = parseInt64(value)

    // assert
    expect(result).toBe(-9223372036854775808n)
  })

  it('should throw error for a value one above the largest signed 64-bit integer value', () => {
    // arrange
    const value = '9223372036854775808' // 2^63

    // act
    const act = () => parseInt64(value)

    // assert
    expect(act).toThrowError(
      'Expected an int64 value in range of [-9223372036854775808,9223372036854775807] but received 9223372036854775808',
    )
  })

  it('should throw error for a value one below the smallest signed 64-bit integer value', () => {
    // arrange
    const value = '-9223372036854775809' // -2^63 - 1

    // act
    const act = () => parseInt64(value)

    // assert
    expect(act).toThrowError(
      'Expected an int64 value in range of [-9223372036854775808,9223372036854775807] but received -9223372036854775809',
    )
  })

  it('should throw error for a non integer value', () => {
    // arrange
    const value = 'foo'

    // act
    const act = () => parseInt64(value)

    // assert
    expect(act).toThrowError('Expected a string representing of an int64 value but received foo')
  })
})
