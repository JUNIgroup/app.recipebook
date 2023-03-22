import { Base64Data, createBase64Data, formatBase64Data, isBase64Data, parseBase64Data } from './base64data'

const Base64DataTypeTag: Pick<Base64Data, typeof Symbol.toStringTag> = { [Symbol.toStringTag]: 'Base64Data' }

describe('parseBase64Data', () => {
  it('should parse a Base64Data', () => {
    // arrange
    const value = 'aGVsbG8gd29ybGQ=' // 'hello world'

    // act
    const base64Data = parseBase64Data(value)

    // assert
    expect(base64Data).toEqual({ data: 'aGVsbG8gd29ybGQ=', ...Base64DataTypeTag })
  })

  it.each`
    value
    ${null}
    ${undefined}
    ${42}
    ${{ foo: 'bar' }}
  `('should throw error for an non-string data', ({ value }) => {
    // act
    const act = () => parseBase64Data(value)

    // assert
    expect(act).toThrow('Expected a string for Base64Data but received')
  })
})

describe('formatBase64Data', () => {
  it('should format a Base64Data', () => {
    // arrange
    const value = { data: 'aGVsbG8gd29ybGQ=', ...Base64DataTypeTag }

    // act
    const base64Data = formatBase64Data(value)

    // assert
    expect(base64Data).toEqual('aGVsbG8gd29ybGQ=')
  })
})

describe('createBase64Data', () => {
  it('should create a Base64Data', () => {
    // arrange
    const data = 'aGVsbG8gd29ybGQ='

    // act
    const base64Data = createBase64Data(data)

    // assert
    expect(base64Data).toEqual({ data, ...Base64DataTypeTag })
  })
})

describe('isBase64Data', () => {
  it('should return true for a Base64Data', () => {
    // arrange
    const value = { data: 'aGVsbG8gd29ybGQ=', ...Base64DataTypeTag }

    // act
    const result = isBase64Data(value)

    // assert
    expect(result).toBe(true)
  })

  it('should return false for a "Base64Data" without toStringTag symbol', () => {
    // arrange
    const value = { data: 'aGVsbG8gd29ybGQ=' }

    // act
    const result = isBase64Data(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non Base64Data', () => {
    // arrange
    const value = { foo: 42 }

    // act
    const result = isBase64Data(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non object', () => {
    // arrange
    const value = 'foo'

    // act
    const result = isBase64Data(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for null', () => {
    // arrange
    const value = null

    // act
    const result = isBase64Data(value)

    // assert
    expect(result).toBe(false)
  })
})
