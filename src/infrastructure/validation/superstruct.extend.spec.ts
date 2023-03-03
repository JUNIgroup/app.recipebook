import { any, is, object, StructError, type, validate } from 'superstruct'
import { nonArray, positiveIntegerString } from './superstruct.extend'

describe('superstruct', () => {
  it('should accept for object an empty object', () => {
    const input = {}
    const result = validate(input, object())
    expect(result).toEqual([undefined, input])
  })

  it('should not accept but accept for object an array', () => {
    const input = [1, 2, 3]
    const result = validate(input, object())
    expect(result).not.toEqual([expect.any(StructError), undefined])
    expect(result).toEqual([undefined, input])
  })

  it('should not accept for object null value', () => {
    const input = null
    const result = validate(input, object())
    expect(result).toEqual([expect.any(StructError), undefined])
  })
})

describe('positiveIntegerString', () => {
  it('should accept a string with numbers', () => {
    const input = '123'
    const value = is(input, positiveIntegerString)
    expect(value).toEqual(true)
  })

  it('should accept a timestamp (now)', () => {
    const input = `${Date.now()}`
    const result = validate(input, positiveIntegerString)
    expect(result).toEqual([undefined, input])
  })

  it('should accept a timestamp (far in the future)', () => {
    const farFuture = new Date('9999-12-31T23:59:59.999Z')
    const input = `${farFuture.getTime()}`
    const result = validate(input, positiveIntegerString)
    expect(result).toEqual([undefined, input])
  })

  it('should accept MAX_SAFE_INTEGER', () => {
    const max = Number.MAX_SAFE_INTEGER
    const input = `${max}`
    const result = validate(input, positiveIntegerString)
    expect(result).toEqual([undefined, input])
  })

  it('should fail for empty string', () => {
    const input = ''
    const [error] = validate(input, positiveIntegerString)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a string matching `/^\\d{1,16}$/` but received ""')
  })

  it('should fail for non-number string', () => {
    const input = 'foo-bar'
    const [error] = validate(input, positiveIntegerString)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a string matching `/^\\d{1,16}$/` but received "foo-bar"')
  })

  it('should fail for partial non-number string', () => {
    const input = '42-foo'
    const [error] = validate(input, positiveIntegerString)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a string matching `/^\\d{1,16}$/` but received "42-foo"')
  })

  it('should fail for negative number string', () => {
    const input = '-42'
    const [error] = validate(input, positiveIntegerString)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a string matching `/^\\d{1,16}$/` but received "-42"')
  })
})

describe('nonArray', () => {
  it('should accept for non-array object an empty object', () => {
    const input = {}
    const result = validate(input, nonArray(object()))
    expect(result).toEqual([undefined, input])
  })

  it('should accept for non-array object an object with properties', () => {
    const input = { foo: 'bar' }
    const result = validate(input, nonArray(object({ foo: any() })))
    expect(result).toEqual([undefined, input])
  })

  it('should not accept for non-array object an array', () => {
    const input = [1, 2, 3]
    const result = validate(input, nonArray(object()))
    expect(result).toEqual([expect.any(StructError), undefined])
  })

  it('should accept for non-array type an empty object', () => {
    const input = {}
    const result = validate(input, nonArray(type({})))
    expect(result).toEqual([undefined, input])
  })

  it('should accept for non-array type an object with properties', () => {
    const input = { foo: 'bar' }
    const result = validate(input, nonArray(type({})))
    expect(result).toEqual([undefined, input])
  })

  it('should not accept for non-array type an array', () => {
    const input = [1, 2, 3]
    const result = validate(input, nonArray(type({})))
    expect(result).toEqual([expect.any(StructError), undefined])
  })
})
