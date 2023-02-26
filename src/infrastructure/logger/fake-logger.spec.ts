import { FakeLogger } from './fake-logger.test-helper'

describe('FakeLogger', () => {
  it('should instantiate', () => {
    const logger = new FakeLogger()
    expect(logger).toBeInstanceOf(FakeLogger)
  })

  describe.each`
    args                                              | text
    ${[]}                                             | ${''}
    ${['foo']}                                        | ${'foo'}
    ${['foo', 'bar']}                                 | ${'foo bar'}
    ${['foo %d+%d=%d', 1, 2, 3]}                      | ${'foo 1+2=3'}
    ${['foo "%s", "%s"', 'bar']}                      | ${'foo "bar", "%s"'}
    ${['foo!', { bar: 123, baz: {} }]}                | ${'foo! { bar: 123, baz: {} }'}
    ${['foo %o!', { bar: 123, baz: true }]}           | ${'foo { bar: 123, baz: true }!'}
    ${['foo %O!', { bar: 123, baz: { flag: true } }]} | ${'foo { bar: 123, baz: { flag: true } }!'}
  `('formatted $text', ({ args, text }) => {
    it('should call output for log formatted text', () => {
      const logger = new FakeLogger()
      logger.log(...args)
      expect(logger.output).toHaveBeenCalledWith(`[LOG  ] ${text}`)
    })

    it('should add line with log formatted text', () => {
      const logger = new FakeLogger()
      logger.log(...args)
      expect(logger.lines).toEqual([`[LOG  ] ${text}`])
    })

    it('should call output for error formatted text', () => {
      const logger = new FakeLogger()
      logger.error(...args)
      expect(logger.output).toHaveBeenCalledWith(`[ERROR] ${text}`)
    })

    it('should add line with error formatted text', () => {
      const logger = new FakeLogger()
      logger.error(...args)
      expect(logger.lines).toEqual([`[ERROR] ${text}`])
    })
  })

  describe('end', () => {
    it('should call output for end', () => {
      const logger = new FakeLogger()
      logger.end()
      expect(logger.output).toHaveBeenCalledWith('[END  ] ')
    })

    it('should add line for end', () => {
      const logger = new FakeLogger()
      logger.end()
      expect(logger.lines).toEqual([`[END  ] `])
    })
  })
})
