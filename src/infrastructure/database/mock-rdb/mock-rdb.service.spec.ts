import { MockRdbService } from './mock-rdb.service'
import { RdbMeta } from '../rdb.service'

type Subject<T> = Promise<T> & { resolve: (value: T) => void; reject: (reason?: unknown) => void }

function subject<T>(): Subject<T> {
  let resolve: (value: T) => void = () => {}
  let reject: (reason?: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  }) as Subject<T>
  promise.resolve = resolve
  promise.reject = reject
  return promise
}

describe(MockRdbService.name, () => {
  let mockRdbService: MockRdbService<'Foo' | 'Bar'>

  beforeEach(() => {
    mockRdbService = new MockRdbService()
  })

  describe('.openDB', () => {
    it('should open a database', async () => {
      const blocked = subject<string>()
      const opened = subject<string>()
      const failed = subject<string>()

      mockRdbService.openDB({
        onBlocked: () => blocked.resolve('onBlocked'),
        onError: () => failed.resolve('onError'),
        onOpen: () => opened.resolve('onOpen'),
      })

      await blocked
      const result = await Promise.race([opened, failed])

      expect(result).toEqual('onOpen')
    })

    it('should open a database with delay', async () => {
      const openDelay = subject<void>()
      const blocked = subject<string>()
      const opened = subject<string>()
      const failed = subject<string>()

      mockRdbService.openDelay = () => openDelay
      mockRdbService.openDB({
        onBlocked: () => blocked.resolve('onBlocked'),
        onError: () => failed.resolve('onError'),
        onOpen: () => opened.resolve('onOpen'),
      })

      await blocked
      openDelay.resolve()
      const result = await Promise.race([opened, failed])

      expect(result).toEqual('onOpen')
    })
  })

  describe('.executeReadTransaction', () => {
    beforeEach(async () => {
      const opened = subject<void>()
      mockRdbService.openDB({
        onBlocked: () => {},
        onOpen: () => opened.resolve(undefined),
        onError: (error) => opened.reject(error),
      })
      await opened
      mockRdbService.setDoc('Foo', { id: 'foo-1' }, { changeIndex: 2 })
      mockRdbService.setDoc('Foo', { id: 'foo-2' }, { changeIndex: 8 })
      mockRdbService.setDoc('Bar', { id: 'bar-1' }, { changeIndex: 1 })
    })

    it('should allow to read a document', async () => {
      const [meta, result] = await mockRdbService.executeReadTransaction('Foo', {
        onTransaction: (tx) => tx.get('Foo', 'foo-1'),
      })
      expect({ meta, result }).toEqual({
        meta: { 'foo-1': { changeIndex: 2 } },
        result: { id: 'foo-1' },
      })
    })

    it('should allow to read with unknown id', async () => {
      const [meta, result] = await mockRdbService.executeReadTransaction('Foo', {
        onTransaction: (tx) => tx.get('Foo', 'unknown-id'),
      })
      expect({ meta, result }).toEqual({
        meta: { 'unknown-id': { changeIndex: NaN, deleted: true } },
        result: null,
      })
    })

    it('should allow to read all documents', async () => {
      const [meta, result] = await mockRdbService.executeReadTransaction('Foo', {
        onTransaction: (tx) => tx.getAll('Foo'),
      })
      expect({ meta, result }).toEqual({
        meta: {
          'foo-1': { changeIndex: 2 },
          'foo-2': { changeIndex: 8 },
        },
        result: [{ id: 'foo-1' }, { id: 'foo-2' }],
      })
    })
  })

  describe('.executeUpdateTransaction', () => {
    beforeEach(async () => {
      const opened = subject<void>()
      mockRdbService.openDB({
        onBlocked: () => {},
        onOpen: () => opened.resolve(undefined),
        onError: (error) => opened.reject(error),
      })
      await opened
      mockRdbService.setDoc('Foo', { id: 'foo-1' }, { changeIndex: 2 })
      mockRdbService.setDoc('Foo', { id: 'foo-2' }, { changeIndex: 8 })
      mockRdbService.setDoc('Bar', { id: 'bar-1' }, { changeIndex: 1 })
    })

    it('should allow to add a document', async () => {
      const data = { id: 'foo-3', payload: 'bla' }
      let beforeMeta: Record<string, RdbMeta> = {}
      const [afterMeta] = await mockRdbService.executeUpdateTransaction('Foo', {
        onTransaction: (tx) => tx.add('Foo', data),
        validatePreviousMeta: (meta) => {
          beforeMeta = meta
        },
      })
      const store = mockRdbService.getStore('Foo')
      expect({ beforeMeta, afterMeta, store }).toEqual({
        beforeMeta: { 'foo-3': { changeIndex: NaN, deleted: true } },
        afterMeta: { 'foo-3': { changeIndex: 0 } },
        store: {
          'foo-1': { data: { id: 'foo-1' }, meta: { changeIndex: 2 } },
          'foo-2': { data: { id: 'foo-2' }, meta: { changeIndex: 8 } },
          'foo-3': { data: { id: 'foo-3', payload: 'bla' }, meta: { changeIndex: 0 } },
        },
      })
    })

    it('should allow to update a document', async () => {
      const data = { id: 'foo-1', payload: 'bla' }
      let beforeMeta: Record<string, RdbMeta> = {}
      const [afterMeta] = await mockRdbService.executeUpdateTransaction('Foo', {
        onTransaction: (tx) => tx.update('Foo', data),
        validatePreviousMeta: (meta) => {
          beforeMeta = meta
        },
      })
      const store = mockRdbService.getStore('Foo')
      expect({ beforeMeta, afterMeta, store }).toEqual({
        beforeMeta: { 'foo-1': { changeIndex: 2 } },
        afterMeta: { 'foo-1': { changeIndex: 3 } },
        store: {
          'foo-1': { data: { id: 'foo-1', payload: 'bla' }, meta: { changeIndex: 3 } },
          'foo-2': { data: { id: 'foo-2' }, meta: { changeIndex: 8 } },
        },
      })
    })

    it('should allow to delete a document', async () => {
      let beforeMeta: Record<string, RdbMeta> = {}
      const [afterMeta] = await mockRdbService.executeUpdateTransaction('Foo', {
        onTransaction: (tx) => tx.delete('Foo', 'foo-2'),
        validatePreviousMeta: (meta) => {
          beforeMeta = meta
        },
      })
      const store = mockRdbService.getStore('Foo')
      expect({ beforeMeta, afterMeta, store }).toEqual({
        beforeMeta: { 'foo-2': { changeIndex: 8 } },
        afterMeta: { 'foo-2': { changeIndex: 9, deleted: true } },
        store: {
          'foo-1': { data: { id: 'foo-1' }, meta: { changeIndex: 2 } },
          'foo-2': { data: { id: 'foo-2' }, meta: { changeIndex: 9, deleted: true } },
        },
      })
    })

    it('should exclusive lock same store', async () => {
      const data = { id: 'foo-1', payload: 'bla' }
      let beforeMeta: Record<string, RdbMeta> = {}
      const tx1 = mockRdbService.executeReadTransaction('Foo', {
        onTransaction: async (tx) => tx.getAll('Foo'),
      })
      const tx2 = mockRdbService.executeUpdateTransaction('Foo', {
        onTransaction: async (tx) => {
          await tx.update('Foo', data)
          await tx.delete('Foo', 'foo-2')
        },
        validatePreviousMeta: (meta) => {
          beforeMeta = meta
        },
      })
      const tx3 = mockRdbService.executeReadTransaction('Foo', {
        onTransaction: async (tx) => tx.getAll('Foo'),
      })

      const [[meta1, result1], [afterMeta], [meta3, result3]] = await Promise.all([tx1, tx2, tx3])
      expect({ meta1, result1, beforeMeta, afterMeta, meta3, result3 }).toEqual({
        meta1: {
          'foo-1': { changeIndex: 2 },
          'foo-2': { changeIndex: 8 },
        },
        result1: [{ id: 'foo-1' }, { id: 'foo-2' }],
        beforeMeta: {
          'foo-1': { changeIndex: 2 },
          'foo-2': { changeIndex: 8 },
        },
        afterMeta: {
          'foo-1': { changeIndex: 3 },
          'foo-2': { changeIndex: 9, deleted: true },
        },
        meta3: {
          'foo-1': { changeIndex: 3 },
          'foo-2': { changeIndex: 9, deleted: true },
        },
        result3: [{ id: 'foo-1', payload: 'bla' }],
      })
    })
  })
})
