// @vitest-environment happy-dom

import { createDebugObserver, DebugObserver, DebugStorage } from './debug-observer'

describe('createDebugObserver', () => {
  let observer: DebugObserver

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    observer?.stop()
    vi.useRealTimers()
  })

  it('should create a debug observer', () => {
    // arrange
    const callback = vi.fn()

    // act
    observer = createDebugObserver(callback)

    // assert
    expect(observer).toBeDefined()
  })

  describe('localStorage', () => {
    it('should read the debug namespaces from the local storage', () => {
      // arrange
      const callback = vi.fn()
      vi.spyOn(localStorage, 'getItem')
      observer = createDebugObserver(callback)

      // act
      observer.read()

      // assert
      expect(localStorage.getItem).toHaveBeenCalledWith('debug')
    })

    it('should save the debug namespaces into the local storage', () => {
      // arrange
      const callback = vi.fn()
      vi.spyOn(localStorage, 'setItem')
      observer = createDebugObserver(callback)

      // act
      observer.save('foo')

      // assert
      expect(localStorage.setItem).toHaveBeenCalledWith('debug', 'foo')
    })
  })

  describe('custom storage ()', () => {
    let customStorage: DebugStorage

    beforeEach(() => {
      customStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      }
    })

    it('should read the debug namespaces from the custom storage', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage: customStorage })

      // act
      observer.read()

      // assert
      expect(customStorage.getItem).toHaveBeenCalledWith('debug')
    })

    it('should save the debug namespaces into the custom storage', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage: customStorage })

      // act
      observer.save('foo')

      // assert
      expect(customStorage.setItem).toHaveBeenCalledWith('debug', 'foo')
    })
  })

  describe('read', () => {
    let storage: DebugStorage

    beforeEach(() => {
      const data = new Map<string, string>()
      storage = {
        getItem: data.get.bind(data),
        setItem: data.set.bind(data),
      }
    })

    it('should initial read the debug namespaces (no entry)', () => {
      // arrange
      const callback = vi.fn()

      // act
      observer = createDebugObserver(callback, { storage })

      // assert
      expect(callback).toHaveBeenCalledWith(null)
    })

    it('should initial read the debug namespaces (empty entry)', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', '')

      // act
      observer = createDebugObserver(callback, { storage })

      // assert
      expect(callback).toHaveBeenCalledWith('')
    })

    it('should initial read the debug namespaces (non-empty entry)', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', 'foo')

      // act
      observer = createDebugObserver(callback, { storage })

      // assert
      expect(callback).toHaveBeenCalledWith('foo')
    })

    it('should read the debug namespaces on request', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage })

      // act
      storage.setItem('debug', 'foo')
      observer.read()

      // assert
      expect(callback).toHaveBeenCalledWith(null)
      expect(callback).toHaveBeenCalledWith('foo')
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should not read the debug namespaces on request if the value has not changed', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', 'foo')
      observer = createDebugObserver(callback, { storage })

      // act
      observer.read()

      // assert
      expect(callback).toHaveBeenCalledWith('foo')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it(`should read the debug namespaces on request and return the current value 'null' (no entry)`, () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage })

      // act
      const result = observer.read()

      // assert
      expect(result).toBe(null)
    })

    it('should read the debug namespaces on request and return the current value (entry)', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', 'foo')
      observer = createDebugObserver(callback, { storage })

      // act
      const result = observer.read()

      // assert
      expect(result).toBe('foo')
    })

    it('should read the debug namespace in intervals', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage, interval: 1000 })
      callback.mockClear()

      // act
      storage.setItem('debug', 'foo')
      vi.advanceTimersByTime(1000)

      // assert
      expect(callback).toHaveBeenCalledWith('foo')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should not read the debug namespace in intervals if the value has not changed', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', 'foo')
      observer = createDebugObserver(callback, { storage, interval: 1000 })
      callback.mockClear()

      // act
      vi.advanceTimersByTime(1000)

      // assert
      expect(callback).not.toHaveBeenCalled()
    })

    it('should only read the debug namespace in intervals if the value has changed in the meantime', () => {
      // arrange
      const callback = vi.fn()
      storage.setItem('debug', 'foo')
      observer = createDebugObserver(callback, { storage, interval: 1000 })
      callback.mockClear()

      // act
      vi.advanceTimersByTime(1000)
      vi.advanceTimersByTime(1000)
      storage.setItem('debug', 'bar')
      vi.advanceTimersByTime(1000)
      vi.advanceTimersByTime(1000)

      // assert
      expect(callback).toHaveBeenCalledWith('bar')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should not read the debug namespace in intervals if the observer is stopped', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage, interval: 1000 })
      callback.mockClear()

      // act
      storage.setItem('debug', 'foo')
      observer.stop()
      vi.advanceTimersByTime(1000)

      // assert
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('save', () => {
    let storage: DebugStorage

    beforeEach(() => {
      const data = new Map<string, string>()
      storage = {
        getItem: data.get.bind(data),
        setItem: data.set.bind(data),
      }
    })

    it('should save the debug namespaces', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage })

      // act
      observer.save('foo')

      // assert
      expect(storage.getItem('debug')).toBe('foo')
    })

    it('should inform the callback about the new value', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage })

      // act
      observer.save('foo')

      // assert
      expect(callback).toHaveBeenCalledWith('foo')
    })
  })

  describe('override key', () => {
    let storage: DebugStorage

    beforeEach(() => {
      storage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      }
    })

    it('should read the debug namespaces from the custom key', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage, key: 'debug-foo' })

      // act
      observer.read()

      // assert
      expect(storage.getItem).toHaveBeenCalledWith('debug-foo')
    })

    it('should save the debug namespaces for the custom key', () => {
      // arrange
      const callback = vi.fn()
      observer = createDebugObserver(callback, { storage, key: 'debug-foo' })

      // act
      observer.save('foo')

      // assert
      expect(storage.setItem).toHaveBeenCalledWith('debug-foo', 'foo')
    })
  })
})
