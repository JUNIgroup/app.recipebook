import { IDBFactory } from 'fake-indexeddb'
import { lastValueFrom } from 'rxjs'
import { createFakeLogger } from '../../utilities/logger/fake-logger.test-helper'
import { IdbService } from './idb/idb.service'
import { wrapRequest } from './idb/idb.transactions'
import { MockRdbService } from './mock-rdb/mock-rdb.service'
import { RdbData, RdbMeta, RdbService } from './rdb.service'

type TestStoreName = 'foo' | 'bar'

type TestRdbContext = {
  /** the instantiated rdb service */
  rdbService: RdbService<TestStoreName>

  /** clean up the database */
  cleanup?: () => Promise<void>

  /** set a document in the database, bypass the rdb service */
  setDoc<T extends RdbData>(storeName: TestStoreName, data: T, meta: RdbMeta): Promise<void>

  /** get all documents in the database sorted by ID, bypass the rdb service */
  getDocs(storeName: TestStoreName): Promise<{ data: RdbData; meta: RdbMeta }[]>
}

type TestRdbSetup = () => Promise<TestRdbContext>

async function mockRdbSetup(): Promise<TestRdbContext> {
  const mockRdbService = new MockRdbService()
  return {
    rdbService: mockRdbService,
    setDoc: async (storeName, data, meta) => mockRdbService.setDoc(storeName, data, meta),
    getDocs: async (storeName) => {
      const values = Object.values(mockRdbService.getStore(storeName))
      return values.sort((a, b) => a.data.id.localeCompare(b.data.id))
    },
  }
}

async function idbSetup(): Promise<TestRdbContext> {
  const fakeIndexedDB = new IDBFactory()
  const logger = createFakeLogger()
  const idbService = new IdbService<TestStoreName>(
    fakeIndexedDB,
    'test-db',
    1,
    ({ db }) => {
      db.createObjectStore('foo', { keyPath: 'data.id' })
      db.createObjectStore('bar', { keyPath: 'data.id' })
    },
    logger,
  )

  const combine = (data: RdbData, meta: RdbMeta) => ({ ...meta, data })
  const split = ({ data, ...meta }: ReturnType<typeof combine>) => ({ data, meta })

  return {
    rdbService: idbService,
    async cleanup() {
      await wrapRequest(fakeIndexedDB.deleteDatabase('foo'))
      await wrapRequest(fakeIndexedDB.deleteDatabase('bar'))
    },
    async setDoc(storeName, data, meta) {
      return new Promise<void>((resolve, reject) => {
        const { db } = idbService as unknown as { db: IDBDatabase }
        const tx = db.transaction(storeName, 'readwrite')
        tx.onerror = (error) => reject(error)
        tx.oncomplete = () => resolve()
        tx.objectStore(storeName).put(combine(data, meta))
        tx.commit()
      })
    },
    async getDocs(storeName) {
      return new Promise<{ data: RdbData; meta: RdbMeta }[]>((resolve, reject) => {
        const { db } = idbService as unknown as { db: IDBDatabase }
        const tx = db.transaction(storeName, 'readonly')
        tx.onerror = (error) => reject(error)
        // tx.oncomplete = () => resolve()
        const store = tx.objectStore(storeName)
        const request = store.getAll()
        request.onsuccess = () => {
          const values = request.result.map(split)
          resolve(values.sort((a, b) => a.data.id.localeCompare(b.data.id)))
        }
        tx.commit()
      })
    },
  }
}

describe.each([
  { name: 'MockRdbService', setup: mockRdbSetup }, //
  { name: 'IdbService', setup: idbSetup }, //
])('$name', ({ setup }: { setup: TestRdbSetup }) => {
  let context: TestRdbContext

  beforeEach(async () => {
    context = await setup()
  })

  afterEach(async () => {
    context.cleanup?.()
  })

  it('should create a service', () => {
    expect(context.rdbService).toBeTruthy()
  })

  describe('.openDB', () => {
    it('should open a database', async () => {
      const state = await lastValueFrom(context.rdbService.openDB())

      expect(state).toEqual('open')
    })
  })

  describe('DB is open', () => {
    beforeEach(async () => {
      await lastValueFrom(context.rdbService.openDB())
      await context.setDoc('foo', { id: 'foo-1' }, { changeIndex: 2 })
      await context.setDoc('foo', { id: 'foo-2' }, { changeIndex: 8 })
      await context.setDoc('bar', { id: 'bar-1' }, { changeIndex: 1 })
    })

    describe('.executeReadTransaction', () => {
      it('should allow to read a document', async () => {
        const [meta, result] = await context.rdbService.executeReadTransaction('foo', {
          onTransaction: (tx) => tx.get('foo', 'foo-1'),
        })
        expect({ meta, result }).toEqual({
          meta: { 'foo-1': { changeIndex: 2 } },
          result: { id: 'foo-1' },
        })
      })

      it('should allow to read with unknown id', async () => {
        const [meta, result] = await context.rdbService.executeReadTransaction('foo', {
          onTransaction: (tx) => tx.get('foo', 'unknown-id'),
        })
        expect({ meta, result }).toEqual({
          meta: { 'unknown-id': { changeIndex: NaN, deleted: true } },
          result: null,
        })
      })

      it('should allow to read all documents', async () => {
        const [meta, result] = await context.rdbService.executeReadTransaction('foo', {
          onTransaction: (tx) => tx.getAll('foo'),
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
      it('should allow to add a document', async () => {
        const data = { id: 'foo-3', payload: 'bla' }
        let beforeMeta: Record<string, RdbMeta> = {}
        const [afterMeta] = await context.rdbService.executeUpdateTransaction('foo', {
          onTransaction: (tx) => tx.add('foo', data),
          validatePreviousMeta: (meta) => {
            beforeMeta = meta
          },
        })
        const docs = await context.getDocs('foo')
        expect({ beforeMeta, afterMeta, docs }).toEqual({
          beforeMeta: { 'foo-3': { changeIndex: NaN, deleted: true } },
          afterMeta: { 'foo-3': { changeIndex: 0 } },
          docs: [
            { data: { id: 'foo-1' }, meta: { changeIndex: 2 } },
            { data: { id: 'foo-2' }, meta: { changeIndex: 8 } },
            { data: { id: 'foo-3', payload: 'bla' }, meta: { changeIndex: 0 } },
          ],
        })
      })

      it('should allow to update a document', async () => {
        const data = { id: 'foo-1', payload: 'bla' }
        let beforeMeta: Record<string, RdbMeta> = {}
        const [afterMeta] = await context.rdbService.executeUpdateTransaction('foo', {
          onTransaction: (tx) => tx.update('foo', data),
          validatePreviousMeta: (meta) => {
            beforeMeta = meta
          },
        })
        const docs = await context.getDocs('foo')
        expect({ beforeMeta, afterMeta, docs }).toEqual({
          beforeMeta: { 'foo-1': { changeIndex: 2 } },
          afterMeta: { 'foo-1': { changeIndex: 3 } },
          docs: [
            { data: { id: 'foo-1', payload: 'bla' }, meta: { changeIndex: 3 } },
            { data: { id: 'foo-2' }, meta: { changeIndex: 8 } },
          ],
        })
      })

      it('should allow to delete a document', async () => {
        let beforeMeta: Record<string, RdbMeta> = {}
        const [afterMeta] = await context.rdbService.executeUpdateTransaction('foo', {
          onTransaction: (tx) => tx.delete('foo', 'foo-2'),
          validatePreviousMeta: (meta) => {
            beforeMeta = meta
          },
        })
        const docs = await context.getDocs('foo')
        expect({ beforeMeta, afterMeta, docs }).toEqual({
          beforeMeta: { 'foo-2': { changeIndex: 8 } },
          afterMeta: { 'foo-2': { changeIndex: 9, deleted: true } },
          docs: [
            { data: { id: 'foo-1' }, meta: { changeIndex: 2 } },
            { data: { id: 'foo-2' }, meta: { changeIndex: 9, deleted: true } },
          ],
        })
      })
    })

    describe('store lock', () => {
      it('should exclusive lock same store', async () => {
        const data = { id: 'foo-1', payload: 'bla' }
        let beforeMeta: Record<string, RdbMeta> = {}
        const tx1 = context.rdbService.executeReadTransaction('foo', {
          onTransaction: async (tx) => tx.getAll('foo'),
        })
        const tx2 = context.rdbService.executeUpdateTransaction('foo', {
          onTransaction: async (tx) => {
            await tx.update('foo', data)
            await tx.delete('foo', 'foo-2')
          },
          validatePreviousMeta: (meta) => {
            beforeMeta = meta
          },
        })
        const tx3 = context.rdbService.executeReadTransaction('foo', {
          onTransaction: async (tx) => tx.getAll('foo'),
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
})
