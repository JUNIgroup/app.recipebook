import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { collectFrom } from '../../../../infrastructure/database/helpers/collect-from'
import { CacheEntity, IDBStorage, clearCache, createKeyRange, openIdb, readIndex, write, writeAll } from './utils'

describe('idb-utils', () => {
  const idbName = 'test-idb'
  const storeName = 'test-store'
  const indexName = 'test-index'

  let fakeIndexedDB: IDBFactory
  let storage: IDBStorage

  beforeEach(async () => {
    fakeIndexedDB = new IDBFactory()
  })

  afterEach(() => {
    storage?.idb?.close()
  })

  describe('openIdb', () => {
    it('should open the database', async () => {
      // act
      storage = await openIdb(fakeIndexedDB, idbName, storeName, indexName)

      // assert
      expect(storage).toBeDefined()
      expect(storage.idb.name, 'idb name').toBe(idbName)
      expect(storage.idb.objectStoreNames, 'store name').toContain(storeName)
      expect(storage.idb.transaction(storeName).objectStore(storeName).indexNames, 'index name').toContain(indexName)
    })
  })

  describe('open database', () => {
    const root1 = { parent: '', doc: { id: 'root-1', rev: 2 }, lastUpdate: 32 }
    const bar23 = { parent: 'bar', doc: { id: 'bar-23', rev: 2 }, lastUpdate: 4 }
    const bar17 = { parent: 'bar', doc: { id: 'bar-17', rev: 2 }, lastUpdate: 30 }
    const baz42 = { parent: 'baz', doc: { id: 'baz-42', rev: 2 }, lastUpdate: 57 }
    const foo12 = { parent: 'foo', doc: { id: 'foo-12', rev: 2 }, lastUpdate: 1 }

    beforeEach(async () => {
      storage = await openIdb(fakeIndexedDB, idbName, storeName, indexName)
    })

    describe('write', () => {
      it('should write a entity', async () => {
        // arrange
        const entity = foo12

        // act
        await write(storage, entity)

        // assert
        const result = await execute<CacheEntity[]>(storage.idb.transaction(storeName).objectStore(storeName).getAll())
        expect(result).toEqual([entity])
      })
    })

    describe('writeAll', () => {
      it('should write multiple entities', async () => {
        // act
        await writeAll(storage, [root1, foo12, bar17, bar23, baz42])

        // assert
        const result = await execute<CacheEntity[]>(storage.idb.transaction(storeName).objectStore(storeName).getAll())
        expect(result).toEqual([root1, bar17, bar23, baz42, foo12])
      })
    })

    describe('clearCache', () => {
      it('should clear the cache', async () => {
        await writeAll(storage, [root1, bar23, bar17, baz42, foo12])

        // act
        await clearCache(storage)

        // assert
        const result = await execute<CacheEntity[]>(storage.idb.transaction(storeName).objectStore(storeName).getAll())
        expect(result).toEqual([])
      })
    })

    describe('readAll', () => {
      beforeEach(async () => {
        await writeAll(storage, [root1, bar23, bar17, baz42, foo12])
      })
      it('should read all entities', async () => {
        // arrange
        const range = undefined

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result.flat().map((e) => e.doc.id)).toEqual(['root-1', 'bar-23', 'bar-17', 'baz-42', 'foo-12'])
        expect(result).toEqual([[root1, bar23, bar17, baz42, foo12]])
      })

      it('should read entities with filter parent ba*', async () => {
        // arrange
        const range = IDBKeyRange.bound(['ba'], ['ba\ufffe'])

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result.flat().map((e) => e.doc.id)).toEqual(['bar-23', 'bar-17', 'baz-42'])
        expect(result).toEqual([[bar23, bar17, baz42]])
      })

      it('should read entities with parent ""', async () => {
        // arrange
        const parent = ''
        const after = undefined
        const range = createKeyRange(parent, after, IDBKeyRange.bound)

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result.flat().map((e) => e.doc.id)).toEqual(['root-1'])
        expect(result).toEqual([[root1]])
      })

      it('should read entities with parent bar', async () => {
        // arrange
        const parent = 'bar'
        const after = undefined
        const range = createKeyRange(parent, after, IDBKeyRange.bound)

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result.flat().map((e) => e.doc.id)).toEqual(['bar-23', 'bar-17'])
        expect(result).toEqual([[bar23, bar17]])
      })

      it(`should read entities with parent bar and lastUpdate > ${bar23.lastUpdate}`, async () => {
        // arrange
        const parent = 'bar'
        const after = bar23.lastUpdate
        const range = createKeyRange(parent, after, IDBKeyRange.bound)

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result.flat().map((e) => e.doc.id)).toEqual(['bar-17'])
        expect(result).toEqual([[bar17]])
      })

      it(`should read entities with parent bar and lastUpdate > 100_000`, async () => {
        // arrange
        const parent = 'bar'
        const after = 100_000
        const range = createKeyRange(parent, after, IDBKeyRange.bound)

        // act
        const result = await collectFrom(readIndex(storage, range))

        // assert
        expect(result).toEqual([[]])
      })
    })
  })
})

function execute<T>(request: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
