import { deepEqual, expiresAt } from './utilities'

describe('expiresAt', () => {
  it('should return the time plus the expiresIn in milliseconds', () => {
    const time = new Date('2021-01-01T00:00:00.000Z').getTime()
    const expiresIn = '3600'
    const expected = new Date('2021-01-01T01:00:00.000Z').getTime()
    const actual = expiresAt(time, expiresIn)
    expect(actual).toBe(expected)
  })
})

describe('deepEqual', () => {
  it('should return true if the objects are same object', () => {
    const a = { a: 1, b: 2 }
    const b = a // same
    expect(deepEqual(a, b)).toBe(true)
  })

  it('should return true if the objects are null', () => {
    const a = null
    const b = null
    expect(deepEqual(a, b)).toBe(true)
  })

  it('should return true if the objects are undefined', () => {
    const a = undefined
    const b = undefined
    expect(deepEqual(a, b)).toBe(true)
  })

  it('should return true if the objects are equal', () => {
    const a = { a: 1, b: 2 }
    const b = { a: 1, b: 2 }
    expect(deepEqual(a, b)).toBe(true)
  })

  it('should return false if the one objects is null', () => {
    const a = { a: 1, b: 2 }
    const b = null
    expect(deepEqual(a, b)).toBe(false)
  })

  it('should return false if the one objects is undefined', () => {
    const a = undefined
    const b = { a: 1, b: 2 }
    expect(deepEqual(a, b)).toBe(false)
  })

  it('should return false comparing null and undefined', () => {
    const a = null
    const b = undefined
    expect(deepEqual(a, b)).toBe(false)
  })

  it('should return false if the objects are not equal', () => {
    const a = { a: 1, b: 2 }
    const b = { a: 1, b: 3 }
    expect(deepEqual(a, b)).toBe(false)
  })

  it('should return false if the objects have different keys', () => {
    const a = { a: 1, b: 2 }
    const b = { a: 1, b: 2, c: 3 }
    expect(deepEqual(a, b)).toBe(false)
  })
})
