import { ConsoleLog } from './console-log'
import { FakeConsole } from './console-log.test-helper'
import { createConsoleLogger } from './console-logger'

describe('createConsoleLogger', () => {
  it('should create a console logger (callable)', () => {
    // act
    const logger = createConsoleLogger()

    // assert
    expect(logger).toBeInstanceOf(Function)
  })

  it('should create a console logger (with members)', () => {
    // act
    const logger = createConsoleLogger()

    // assert
    expect(logger).toBeInstanceOf(Object)
  })

  it('should create a console logger with expected members', () => {
    // act
    const logger = createConsoleLogger()

    // assert
    expect(logger.enableLogs).toBeInstanceOf(Function)
    expect(logger.disableAll).toBeInstanceOf(Function)
  })
})

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('.call', () => {
    it('should return a console log', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      const log = logger('test:foo')

      // assert
      expect(log).toBeInstanceOf(ConsoleLog)
    })

    it('should return the same log for the same namespace', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      const log1 = logger('test:foo')
      const log2 = logger('test:foo')

      // assert
      expect(log1).toBe(log2)
    })

    it('should return different logs for different namespaces', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      const log1 = logger('test:foo')
      const log2 = logger('test:bar')

      // assert
      expect(log1).not.toBe(log2)
    })

    it('should return a console log, which logs to the console by default', () => {
      // arrange
      vi.spyOn(console, 'error')
      const logger = createConsoleLogger()
      const log = logger('test:foo')

      // act
      // we use 'error' here, because 'error' is not disabled
      log.error('Hello world!')

      // assert
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalled()
    })

    it('should return a console log, which logs to specified console', () => {
      // arrange
      const console = new FakeConsole()
      const logger = createConsoleLogger({ console })
      const log = logger('test:foo')

      // act
      // we use 'error' here, because 'error' is not disabled
      log.error('Hello world!')

      // assert
      expect(console.innerError).toHaveBeenCalled()
    })

    it('should return a console log, which use the specified namespace', () => {
      // arrange
      const console = new FakeConsole()
      const logger = createConsoleLogger<'FooBar'>({ console })
      const log = logger('FooBar:baz')

      // act
      // we use 'error' here, because 'error' is not disabled
      log.error('Hello world!')

      // assert
      const argsOfFirstCall = console.innerError.mock.calls[0]
      expect(argsOfFirstCall).toInclude('FooBar:baz')
    })
  })

  describe('.enableLogs', () => {
    it('should enable matching logs, which are created later', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      logger.enableLogs('foo:*')
      const log = logger('foo:bar')

      // assert
      expect(log.enabled).toBe(true)
    })

    it('should disable mismatching logs, which are created later', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      logger.enableLogs('foo:*')
      const log = logger('bar:foo')

      // assert
      expect(log.enabled).toBe(false)
    })

    it('should enable matching logs, which are created before', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      const log = logger('foo:bar')
      logger.enableLogs('foo:*')

      // assert
      expect(log.enabled).toBe(true)
    })

    it('should disable mismatching logs, which are created before', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      const log = logger('bar:foo')
      logger.enableLogs('foo:*')

      // assert
      expect(log.enabled).toBe(false)
    })
  })

  describe('.disableAll', () => {
    it('should disable all logs, which are created later', () => {
      // arrange
      const logger = createConsoleLogger()

      // act
      logger.disableAll()
      const log = logger('foo:bar')

      // assert
      expect(log.enabled).toBe(false)
    })

    it('should disable all logs, which are created before', () => {
      // arrange
      const logger = createConsoleLogger()
      logger.enableLogs('foo:*')

      // act
      const log = logger('foo:bar')
      logger.disableAll()

      // assert
      expect(log.enabled).toBe(false)
    })
  })
})
