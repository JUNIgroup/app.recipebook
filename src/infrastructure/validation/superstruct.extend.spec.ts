import { any, boolean, is, number, object, string, StructError, type, validate } from 'superstruct'
import {
  base64String,
  int64String,
  nonArray,
  nullLiteral,
  oneOf,
  positiveIntegerString,
  rangeInclude,
} from './superstruct.extend'

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

describe('rangeInclude', () => {
  it('should accept a number in range', () => {
    const input = 42
    const result = validate(input, rangeInclude(number(), 0, 100))
    expect(result).toEqual([undefined, input])
  })

  it('should accept a number at the lower bound', () => {
    const input = 0
    const result = validate(input, rangeInclude(number(), 0, 100))
    expect(result).toEqual([undefined, input])
  })

  it('should accept a number at the upper bound', () => {
    const input = 100
    const result = validate(input, rangeInclude(number(), 0, 100))
    expect(result).toEqual([undefined, input])
  })

  it('should not accept a number below the lower bound', () => {
    const input = -1
    const [error] = validate(input, rangeInclude(number(), 0, 100))
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a 0 to 100 number but received -1')
  })

  it('should not accept a number above the upper bound', () => {
    const input = 101
    const [error] = validate(input, rangeInclude(number(), 0, 100))
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a 0 to 100 number but received 101')
  })
})

describe('nullLiteral', () => {
  it('should accept null', () => {
    const input = null
    const result = validate(input, nullLiteral())
    expect(result).toEqual([undefined, input])
  })

  it('should not accept undefined', () => {
    const input = undefined
    const [error] = validate(input, nullLiteral())
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value of type `null`, but received: `undefined`')
  })

  it('should not accept empty string', () => {
    const input = ''
    const [error] = validate(input, nullLiteral())
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value of type `null`, but received: `""`')
  })

  it('should not accept a number', () => {
    const input = 42
    const [error] = validate(input, nullLiteral())
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value of type `null`, but received: `42`')
  })

  it('should not accept an object', () => {
    const input = {}
    const [error] = validate(input, nullLiteral())
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value of type `null`, but received: `[object Object]`')
  })
})

describe('int64String', () => {
  it.each`
    input
    ${'0'}
    ${'-1'}
    ${'1'}
    ${'9223372036854775807'}
    ${'-9223372036854775808'}
  `('should accept a number string $input', ({ input }) => {
    const result = validate(input, int64String(string()))
    expect(result).toEqual([undefined, input])
  })

  it.each`
    input
    ${''}
    ${'foo'}
    ${'+123'}
    ${'123.45'}
    ${'0000123'}
    ${'0x123'}
    ${'0o123'}
    ${'0b101'}
    ${'9223372036854775808'}
    ${'-9223372036854775809'}
  `('should not accept a number string $input', ({ input }) => {
    const [error] = validate(input, int64String(string()))
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe(`Expected a string representing a 64-bit integer but received "${input}"`)
  })
})

describe('base64String', () => {
  const asBase64 = (input: string | Uint8Array) => Buffer.from(input).toString('base64')
  it.each`
    input
    ${''}
    ${'aGVsbG8/gd29yb+='}
    ${asBase64('hello world')}
  `('should accept a base64 string $input', ({ input }) => {
    const result = validate(input, base64String(string()))
    expect(result).toEqual([undefined, input])
  })

  it.each`
    input
    ${'aGVsbG8gd29ybGQ' /* no padding */}
    ${'aGVsbG8gd29ybGQ==' /* too much padding */}
    ${'äè&' /* invalid characters */}
  `('should not accept a base64 string $input', ({ input }) => {
    const [error] = validate(input, base64String(string()))
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe(`Expected a base64 string but received "${input}"`)
  })
})

describe('oneOf', () => {
  const oneOfStruct = oneOf({
    text: string(),
    count: number(),
    flag: boolean(),
  })

  it('should accept a text', () => {
    const input = { text: 'hello' }
    const result = validate(input, oneOfStruct)
    expect(result).toEqual([undefined, input])
  })

  it('should accept a count', () => {
    const input = { count: 3 }
    const result = validate(input, oneOfStruct)
    expect(result).toEqual([undefined, input])
  })

  it('should accept a flag', () => {
    const input = { flag: true }
    const result = validate(input, oneOfStruct)
    expect(result).toEqual([undefined, input])
  })

  it('should not accept an empty object', () => {
    const input = {}
    const [error] = validate(input, oneOfStruct)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected one of the following keys "text", "count", "flag" but received none')
  })

  it('should not accept an object with multiple keys', () => {
    const input = { text: 'hello', count: 3 }
    const [error] = validate(input, oneOfStruct)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected exactly one key but received "text", "count" (2)')
  })

  it('should not accept an object with an unknown key', () => {
    const input = { foo: 'bar' }
    const [error] = validate(input, oneOfStruct)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: foo -- Expected a value of type `never`, but received: `"bar"`')
  })

  it('should not accept an object with undefined value', () => {
    const input = { text: undefined }
    const [error] = validate(input, oneOfStruct)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('Expected a value for key text" not to be undefined')
  })

  it('should add path for deep check', () => {
    const wrapperStruct = object({ wrapper: oneOfStruct })
    const input = { wrapper: { text: 'hello', count: 3 } }
    const [error] = validate(input, wrapperStruct)
    expect(error).toBeInstanceOf(StructError)
    expect(error?.message).toBe('At path: wrapper -- Expected exactly one key but received "text", "count" (2)')
  })
})
