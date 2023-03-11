import { ConsoleLog } from './console-log'
import { FakeConsole } from './console-log.test-helper'

describe('ConsoleLog', () => {
  describe('.info', () => {
    it('should log info messages, if log is enabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.info('Hello world!')

      // assert
      expect(console.innerInfo).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should not log info messages, if log is disabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)

      // act
      log.info('Hello world!')

      // assert
      expect(console.innerInfo).not.toHaveBeenCalled()
    })

    it('should log info messages with additional data', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.info('Hello world!', 'foo', 'bar')

      // assert
      expect(console.innerInfo).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!', 'foo', 'bar')
    })

    it('should record location of info call in stack', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      function functionCallingInfo() {
        log.info('Hello world!')
      }

      // act
      functionCallingInfo()

      // assert
      expect(console.stack[0]).toStartWith('functionCallingInfo')
    })
  })

  describe('.details', () => {
    it('should log details messages if log is enabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.details('Hello world!')

      // assert
      expect(console.innerDebug).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should not log details messages if log is disabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)

      // act
      log.details('Hello world!')

      // assert
      expect(console.innerDebug).not.toHaveBeenCalled()
    })

    it('should log details messages with additional data', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.details('Hello world!', 'foo', 'bar')

      // assert
      expect(console.innerDebug).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!', 'foo', 'bar')
    })

    it('should record location of details call in stack', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      function functionCallingDetails() {
        log.details('Hello world!')
      }

      // act
      functionCallingDetails()

      // assert
      expect(console.stack[0]).toStartWith('functionCallingDetails')
    })
  })

  describe('.warn', () => {
    it('should log warn messages if log is enabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.warn('Hello world!')

      // assert
      expect(console.innerWarn).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should log warn messages also if log is disabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)

      // act
      log.warn('Hello world!')

      // assert
      expect(console.innerWarn).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should log warn messages with additional data', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.warn('Hello world!', 'foo', 'bar')

      // assert
      expect(console.innerWarn).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!', 'foo', 'bar')
    })

    it('should record location of warn call in stack', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      function functionCallingWarn() {
        log.warn('Hello world!')
      }

      // act
      functionCallingWarn()

      // assert
      expect(console.stack[0]).toStartWith('functionCallingWarn')
    })
  })

  describe('.error', () => {
    it('should log error messages if log is enabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.error('Hello world!')

      // assert
      expect(console.innerError).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should log error messages also if log is disabled', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)

      // act
      log.error('Hello world!')

      // assert
      expect(console.innerError).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!')
    })

    it('should log error messages with additional data', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.error('Hello world!', 'foo', 'bar')

      // assert
      expect(console.innerError).toHaveBeenCalledWith('[%s] %s', 'test', 'Hello world!', 'foo', 'bar')
    })

    it('should record location of error call in stack', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      function functionCallingError() {
        log.error('Hello world!')
      }

      // act
      functionCallingError()

      // assert
      expect(console.stack[0]).toStartWith('functionCallingError')
    })
  })

  describe('.enabled', () => {
    it('should return true if log is enabled by constructor', () => {
      // arrange
      const console = new FakeConsole()

      // act
      const log = new ConsoleLog('test', console, true)

      // assert
      expect(log.enabled).toBe(true)
    })

    it('should return false if log is disabled by constructor', () => {
      // arrange
      const console = new FakeConsole()

      // act
      const log = new ConsoleLog('test', console, false)

      // assert
      expect(log.enabled).toBe(false)
    })

    it('should return true if log is enabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)

      // act
      log.setEnabled(true)

      // assert
      expect(log.enabled).toBe(true)
    })

    it('should return false if log is disabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)

      // act
      log.setEnabled(false)

      // assert
      expect(log.enabled).toBe(false)
    })

    it('should no longer log info messages if log is disabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      log.setEnabled(false)

      // act
      log.info('Hello world!')

      // assert
      expect(console.innerInfo).not.toHaveBeenCalled()
    })

    it('should now log info messages if log is enabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)
      log.setEnabled(true)

      // act
      log.info('Hello world!')

      // assert
      expect(console.innerInfo).toHaveBeenCalled()
    })

    it('should no longer log details messages if log is disabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      log.setEnabled(false)

      // act
      log.details('Hello world!')

      // assert
      expect(console.innerDebug).not.toHaveBeenCalled()
    })

    it('should now log details messages if log is enabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, false)
      log.setEnabled(true)

      // act
      log.details('Hello world!')

      // assert
      expect(console.innerDebug).toHaveBeenCalled()
    })

    it('should still log warn messages if log is disabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      log.setEnabled(false)

      // act
      log.warn('Hello world!')

      // assert
      expect(console.innerWarn).toHaveBeenCalled()
    })

    it('should still log error messages if log is disabled by setter', () => {
      // arrange
      const console = new FakeConsole()
      const log = new ConsoleLog('test', console, true)
      log.setEnabled(false)

      // act
      log.error('Hello world!')

      // assert
      expect(console.innerError).toHaveBeenCalled()
    })
  })
})
