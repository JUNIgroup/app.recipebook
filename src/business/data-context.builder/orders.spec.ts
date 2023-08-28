import { byNumber, byString, reverseOrder } from './orders'

describe('byString', () => {
  it.each`
    a        | b        | extractor                         | expected
    ${'foo'} | ${'bar'} | ${(x: string) => x}               | ${1}
    ${'bar'} | ${'baz'} | ${(x: string) => x}               | ${-1}
    ${'qux'} | ${'qux'} | ${(x: string) => x}               | ${0}
    ${'QUX'} | ${'qux'} | ${(x: string) => x}               | ${1}
    ${'QUX'} | ${'qux'} | ${(x: string) => x.toLowerCase()} | ${0}
  `('should compare two items $a and $b by the extracted string', ({ a, b, extractor, expected }) => {
    // arrange
    const order = byString(extractor)

    // act
    const result = order(a, b)

    // assert
    expect(result).toBe(expected)
  })

  it('should sort an array by extracted strings', () => {
    // arrange
    const array = [
      { v: 'foo' },
      { v: 'bar' },
      { v: 'baz' },
      { v: 'qux' },
      { v: 'quux' },
      { v: 'corge' },
      { v: 'grault' },
      { v: 'garply' },
      { v: 'waldo' },
      { v: 'fred' },
      { v: 'plugh' },
      { v: 'xyzzy' },
      { v: 'thud' },
    ]
    const order = byString((o: { v: string }) => o.v)

    // act
    const result = array.sort(order)

    // assert
    expect(result).toEqual([
      { v: 'bar' },
      { v: 'baz' },
      { v: 'corge' },
      { v: 'foo' },
      { v: 'fred' },
      { v: 'garply' },
      { v: 'grault' },
      { v: 'plugh' },
      { v: 'quux' },
      { v: 'qux' },
      { v: 'thud' },
      { v: 'waldo' },
      { v: 'xyzzy' },
    ])
  })
})

describe('byNumber', () => {
  it.each`
    a                          | b                          | extractor               | expected
    ${1}                       | ${2}                       | ${(x: number) => x}     | ${-1}
    ${2}                       | ${1}                       | ${(x: number) => x}     | ${1}
    ${1}                       | ${1}                       | ${(x: number) => x}     | ${0}
    ${-1}                      | ${1}                       | ${(x: number) => x}     | ${-1}
    ${-1}                      | ${1}                       | ${(x: number) => x * x} | ${0}
    ${Number.MIN_SAFE_INTEGER} | ${Number.MAX_SAFE_INTEGER} | ${(x: number) => x}     | ${-1}
  `('should compare two items $a and $b by the extracted number', ({ a, b, extractor, expected }) => {
    // arrange
    const order = byNumber(extractor)

    // act
    const result = order(a, b)

    // assert
    expect(result).toBe(expected)
  })

  it('should sort an array by extracted numbers', () => {
    // arrange
    // shuffle the array to make sure the order is not the native order
    const array = [
      { v: 7 },
      { v: 4 },
      { v: 1 },
      { v: 10 },
      { v: 13 },
      { v: 2 },
      { v: 5 },
      { v: 8 },
      { v: 11 },
      { v: 3 },
      { v: 6 },
      { v: 9 },
      { v: 12 },
    ]
    const order = byNumber((o: { v: number }) => o.v)

    // act
    const result = array.sort(order)

    // assert
    expect(result).toEqual([
      { v: 1 },
      { v: 2 },
      { v: 3 },
      { v: 4 },
      { v: 5 },
      { v: 6 },
      { v: 7 },
      { v: 8 },
      { v: 9 },
      { v: 10 },
      { v: 11 },
      { v: 12 },
      { v: 13 },
    ])
  })
})

describe('invertOrder', () => {
  it('should switch argument of inner order', () => {
    // arrange
    const innerOrder = vi.fn()
    const order = reverseOrder(innerOrder)

    // act
    order(1, 2)

    // assert
    expect(innerOrder).toHaveBeenCalledWith(2, 1)
  })
})
