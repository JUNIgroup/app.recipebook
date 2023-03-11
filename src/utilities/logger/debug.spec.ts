import { createDebugMatcher } from './debug'

describe('createDebugMatcher', () => {
  it('should return a matcher', () => {
    // act
    const matcher = createDebugMatcher('')

    // assert
    expect(matcher).toBeInstanceOf(Function)
  })

  it(`should matcher for '*' match everything`, () => {
    // act
    const matcher = createDebugMatcher('*')

    // assert
    expect(matcher('foo')).toBe(true)
    expect(matcher('bar')).toBe(true)
  })

  it('should matcher for empty string match nothing', () => {
    // act
    const matcher = createDebugMatcher('')

    // assert
    expect(matcher('foo')).toBe(false)
  })

  it(`should matcher for 'foo' match 'foo'`, () => {
    // act
    const matcher = createDebugMatcher('foo')

    // assert
    expect(matcher('foo')).toBe(true)
  })

  it.each(['bar', 'afoo', 'fool'])(`should matcher for 'foo' not match '%s'`, (other) => {
    // act
    const matcher = createDebugMatcher('foo')

    // assert
    expect(matcher(other)).toBe(false)
  })

  it.each(['foo:bar', 'foo:baz'])(`should matcher for 'foo:*' match '%s'`, (other) => {
    // act
    const matcher = createDebugMatcher('foo:*')

    // assert
    expect(matcher(other)).toBe(true)
  })

  it(`should matcher for 'foo:*,-foo:baz' match 'foo:bar`, () => {
    // act
    const matcher = createDebugMatcher('foo:*,-foo:baz')

    // assert
    expect(matcher('foo:bar')).toBe(true)
  })

  it(`should matcher for 'foo:*,-foo:baz' not match 'foo:baz`, () => {
    // act
    const matcher = createDebugMatcher('foo:*,-foo:baz')

    // assert
    expect(matcher('foo:baz')).toBe(false)
  })

  describe('corner cases of namespaces', () => {
    it(`should matcher for '-foo:baz,*' (unusual order) not match 'foo:baz`, () => {
      // act
      const matcher = createDebugMatcher('foo:*,-foo:baz')

      // assert
      expect(matcher('foo:baz')).toBe(false)
    })

    it(`should matcher for '  foo   bar  , ,,  baz' (unusual separators) match 'foo', 'bar' and 'baz'`, () => {
      // act
      const matcher = createDebugMatcher('  foo   bar  , ,,  baz')

      // assert
      expect(matcher('foo')).toBe(true)
      expect(matcher('bar')).toBe(true)
      expect(matcher('baz')).toBe(true)
    })

    it(`should matcher for 'foo\\*' match 'foo\\bar'`, () => {
      // act
      const matcher = createDebugMatcher('foo\\*')

      // assert
      expect(matcher('foo\\bar')).toBe(true)
    })

    it(`should matcher for 'foo{*' match 'foo{bar}'`, () => {
      // act
      const matcher = createDebugMatcher('foo{*')

      // assert
      expect(matcher('foo{bar}')).toBe(true)
    })
  })
})
