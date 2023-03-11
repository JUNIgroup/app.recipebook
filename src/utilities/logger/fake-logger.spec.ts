import { createFakeLogger, FakeLog } from './fake-logger.test-helper'

describe('createFakeLogger', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should create a logger', () => {
    // act
    const logger = createFakeLogger()

    // assert
    expect(logger).toBeInstanceOf(Function)
  })

  describe('fakeLogger', () => {
    it('should create a fake log', () => {
      // arrange
      const logger = createFakeLogger()

      // act
      const log = logger('test')

      // assert
      expect(log).toBeInstanceOf(FakeLog)
    })

    it('should return the same log for the same namespace', () => {
      // arrange
      const logger = createFakeLogger()

      // act
      const log1 = logger('test')
      const log2 = logger('test')

      // assert
      expect(log1).toBe(log2)
    })

    it('should return different logs for different namespaces', () => {
      // arrange
      const logger = createFakeLogger()

      // act
      const log1 = logger('test')
      const log2 = logger('test2')

      // assert
      expect(log1).not.toBe(log2)
    })

    it('should create a fake log, which does not log to the console by default', () => {
      // arrange
      vi.spyOn(console, 'log')
      const logger = createFakeLogger()
      const log = logger('test')

      // act
      log.info('Hello world!')

      // assert
      // eslint-disable-next-line no-console
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should create a fake log, which logs to the console if configured', () => {
      // arrange
      vi.spyOn(console, 'log')
      const logger = createFakeLogger({ console: true })
      const log = logger('test')

      // act
      log.info('Hello world!')

      // assert
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalled()
    })

    it('should create a fake log, which logs to the stream if configured', () => {
      // arrange
      const stream = vi.fn()
      const logger = createFakeLogger({ console: stream })
      const log = logger('test')

      // act
      log.info('Hello world!')

      // assert
      expect(stream).toHaveBeenCalled()
    })
  })
})

describe('FakeLog', () => {
  it('should log info messages', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.info('Hello world!')

    // assert
    expect(log.entries).toEqual([{ level: 'info', message: 'Hello world!', more: [] }])
  })

  it('should log info messages with additional data', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.info('Hello world!', 'foo', 'bar')

    // assert
    expect(log.entries).toEqual([{ level: 'info', message: 'Hello world!', more: ['foo', 'bar'] }])
  })

  it('should log details messages', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.details('Hello world!')

    // assert
    expect(log.entries).toEqual([{ level: 'details', message: 'Hello world!', more: [] }])
  })

  it('should log details messages with additional data', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.details('Hello world!', 'foo', 'bar')

    // assert
    expect(log.entries).toEqual([{ level: 'details', message: 'Hello world!', more: ['foo', 'bar'] }])
  })

  it('should log warn messages', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.warn('Hello world!')

    // assert
    expect(log.entries).toEqual([{ level: 'warn', message: 'Hello world!', more: [] }])
  })

  it('should log warn messages with additional data', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.warn('Hello world!', 'foo', 'bar')

    // assert
    expect(log.entries).toEqual([{ level: 'warn', message: 'Hello world!', more: ['foo', 'bar'] }])
  })

  it('should log error messages', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.error('Hello world!')

    // assert
    expect(log.entries).toEqual([{ level: 'error', message: 'Hello world!', more: [] }])
  })

  it('should log error messages with additional data', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.error('Hello world!', 'foo', 'bar')

    // assert
    expect(log.entries).toEqual([{ level: 'error', message: 'Hello world!', more: ['foo', 'bar'] }])
  })

  it('should log more data as json to lines', () => {
    // arrange
    const log = new FakeLog('test')

    // act
    log.info('Hello world!', { foo: 'bar' })

    // assert
    expect(log.lines).toEqual(['[info|test] Hello world! {"foo":"bar"}'])
  })

  it('should log more data as json to console', () => {
    // arrange
    const stream = vi.fn()
    const log = new FakeLog('test', { console: stream })

    // act
    log.info('Hello world!', { foo: 'bar' })

    // assert
    expect(stream).toHaveBeenCalledWith('[info|test] Hello world! {"foo":"bar"}')
  })

  describe('multiple entries logged', () => {
    let log: FakeLog

    beforeEach(() => {
      // arrange
      log = new FakeLog('test')

      // act
      log.info('A info message')
      log.info('A info message with more', 'foo', 'bar')
      log.details('A details message')
      log.details('A details message with more', 'foo', 'bar')
      log.warn('A warn message')
      log.warn('A warn message with more', 'foo', 'bar')
      log.error('A error message')
      log.error('A error message with more', 'foo', 'bar')
    })

    it('should return entries', () => {
      // assert
      expect(log.entries).toEqual([
        { level: 'info', message: 'A info message', more: [] },
        { level: 'info', message: 'A info message with more', more: ['foo', 'bar'] },
        { level: 'details', message: 'A details message', more: [] },
        { level: 'details', message: 'A details message with more', more: ['foo', 'bar'] },
        { level: 'warn', message: 'A warn message', more: [] },
        { level: 'warn', message: 'A warn message with more', more: ['foo', 'bar'] },
        { level: 'error', message: 'A error message', more: [] },
        { level: 'error', message: 'A error message with more', more: ['foo', 'bar'] },
      ])
    })

    it('should return messages', () => {
      // assert
      expect(log.messages).toEqual([
        'A info message',
        'A info message with more',
        'A details message',
        'A details message with more',
        'A warn message',
        'A warn message with more',
        'A error message',
        'A error message with more',
      ])
    })

    it('should return logged lines', () => {
      // assert
      expect(log.lines).toEqual([
        '[info|test] A info message',
        '[info|test] A info message with more "foo" "bar"',
        '[details|test] A details message',
        '[details|test] A details message with more "foo" "bar"',
        '[warn|test] A warn message',
        '[warn|test] A warn message with more "foo" "bar"',
        '[error|test] A error message',
        '[error|test] A error message with more "foo" "bar"',
      ])
    })
  })
})
