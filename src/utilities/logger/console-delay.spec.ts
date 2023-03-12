import { createDelay } from './console-delay'

describe('createDelay', () => {
  it('should return an object with toString function', () => {
    // act
    const delay = createDelay()

    // assert
    expect(delay).toMatchObject({ toString: expect.any(Function) })
  })
})

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initial return an whitespace string of length 6', () => {
    // arrange
    const delay = createDelay()

    // act
    const result = delay.toString()

    // assert
    expect(result).toHaveLength(6)
    expect(result).toBe('      ')
  })

  it('should return an whitespace string of length 6 in first call after a delay', () => {
    // arrange
    const delay = createDelay()

    // act
    vi.advanceTimersByTime(100)
    const result = delay.toString()

    // assert
    expect(result).toHaveLength(6)
    expect(result).toBe('      ')
  })

  it.each`
    ms                    | expected
    ${0}                  | ${'      '}
    ${1}                  | ${'      '}
    ${2}                  | ${'  +2ms'}
    ${9}                  | ${'  +9ms'}
    ${10}                 | ${' +10ms'}
    ${99}                 | ${' +99ms'}
    ${100}                | ${'+100ms'}
    ${999}                | ${'+999ms'}
    ${1000}               | ${' +1.0s'}
    ${1001}               | ${' +1.0s'}
    ${99949}              | ${'+99.9s'}
    ${99950}              | ${' +1.7m'}
    ${100000}             | ${' +1.7m'}
    ${1000000}            | ${'+16.7m'}
    ${60000 * 99 + 56999} | ${'+99.9m'}
    ${10000000}           | ${'«long»'}
  `('should return the string $expected of length 6 after a delay of $ms ms between two calls', ({ ms, expected }) => {
    // arrange
    const delay = createDelay()
    delay.toString()

    // act
    vi.advanceTimersByTime(ms)
    const result = delay.toString()

    // assert
    expect(result).toHaveLength(6)
    expect(result).toBe(expected)
  })

  it('should return each call its own delay string', () => {
    // arrange
    const delay = createDelay()
    const results = []

    // act
    vi.advanceTimersByTime(32)
    results.push(delay.toString())
    vi.advanceTimersByTime(17)
    results.push(delay.toString())
    vi.advanceTimersByTime(24)
    results.push(delay.toString())
    vi.advanceTimersByTime(1)
    results.push(delay.toString())
    vi.advanceTimersByTime(1223)
    results.push(delay.toString())
    vi.advanceTimersByTime(8)
    results.push(delay.toString())

    // assert
    expect(results).toEqual([
      '      ', // initial call
      ' +17ms',
      ' +24ms',
      '      ', // <= 1ms
      ' +1.2s',
      '  +8ms',
    ])
  })

  it('should use delay as string representation', () => {
    // arrange
    const delay = createDelay()
    delay.toString()

    // act
    vi.advanceTimersByTime(32)
    const result = `The delay is ${delay}!`

    // assert
    expect(result).toBe('The delay is  +32ms!')
  })
})
