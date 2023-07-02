import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { EMPTY, of } from 'rxjs'
import { collectFrom } from '../../../../infrastructure/database/helpers/collect-from'
import { Logger } from '../../../../utilities/logger'
import { createFakeLogger } from '../../../../utilities/logger/fake-logger.test-helper'
import { CollectionPath, Database } from '../database'
import { IdbCacheDatabase } from './idb-cache-database'
import { IDBStorage } from './utils'

describe('IdbCacheDatabase', () => {
  let logger: Logger<'business'>
  let indexedDB: IDBFactory
  let database: Database

  beforeEach(() => {
    logger = createFakeLogger({ console: true })
    indexedDB = new IDBFactory()
    database = {
      getDocs: () => EMPTY,
      putDoc: () => Promise.reject(new Error('not implemented')),
    }
  })

  describe('constructor', () => {
    type InternalStorage = { storage: Promise<IDBStorage> }

    it('should create a new database with default settings', async () => {
      // arrange
      const options = {
        indexedDB,
        cacheName: 'test-cache',
      }

      // act
      const instance = new IdbCacheDatabase(logger, database, options)
      await (instance as unknown as InternalStorage).storage

      // assert
      const structure = await extractDatabasesStructure(indexedDB)
      expect(structure).toEqual({
        'test-cache': {
          version: 1,
          storeNames: ['cache'],
          indexNames: ['cache/lastUpdate'],
        },
      })
    })

    it('should create a new database with given settings', async () => {
      const options = {
        indexedDB,
        cacheName: 'test-cache',
        storeName: 'foo-store',
        indexName: 'bar-index',
      }

      // act
      const instance = new IdbCacheDatabase(logger, database, options)
      await (instance as unknown as InternalStorage).storage

      // assert
      const structure = await extractDatabasesStructure(indexedDB)
      expect(structure).toEqual({
        'test-cache': {
          version: 1,
          storeNames: ['foo-store'],
          indexNames: ['foo-store/bar-index'],
        },
      })
    })
  })

  describe('putDoc', () => {
    const cacheName = 'test-cache'

    it('should put document to inner database', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc = { id: 'foo-bar', rev: 1 }

      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 100,
        doc,
      })

      // act
      await instance.putDoc(collectionPath, doc)

      // assert
      expect(database.putDoc).toHaveBeenCalledWith(collectionPath, doc)
    })

    it('should return the document from inner database', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc = { id: 'foo-bar', rev: 1 }
      const innerDoc = { id: 'foo-bar', rev: 1, foo: 'bar' }

      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 100,
        doc: innerDoc,
      })

      // act
      const result = await instance.putDoc(collectionPath, doc)

      // assert
      expect(result).toEqual({
        lastUpdate: 100,
        doc: innerDoc,
      })
    })

    it('should write bucket document from inner database to cache', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc = { id: 'foo-bar', rev: 1 }
      const innerDoc = { id: 'foo-bar', rev: 1, foo: 'bar' }

      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 100,
        doc: innerDoc,
      })

      // act
      await instance.putDoc(collectionPath, doc)

      // assert
      const allEntries = await getAll(indexedDB, cacheName, 'cache')
      expect(allEntries).toEqual([
        {
          parent: 'foo',
          doc: innerDoc,
          lastUpdate: 100,
        },
      ])
    })

    it('should write collection document from inner database to cache', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo', bucketId: 'foo-123', collection: 'bar' }
      const doc = { id: 'foo-bar', rev: 1 }
      const innerDoc = { id: 'foo-bar', rev: 1, foo: 'bar' }

      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 100,
        doc: innerDoc,
      })

      // act
      await instance.putDoc(collectionPath, doc)

      // assert
      const allEntries = await getAll(indexedDB, cacheName, 'cache')
      expect(allEntries).toEqual([
        {
          parent: 'foo/foo-123/bar',
          doc: innerDoc,
          lastUpdate: 100,
        },
      ])
    })

    it('should write multiple documents from inner database to cache', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc1 = { id: 'foo-bar', rev: 1 }
      const doc2 = { id: 'foo-baz', rev: 1 }
      const innerDoc1 = { id: 'foo-bar', rev: 1, foo: 'bar' }
      const innerDoc2 = { id: 'foo-baz', rev: 1, foo: 'baz' }

      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 100,
        doc: innerDoc1,
      })
      vi.spyOn(database, 'putDoc').mockResolvedValueOnce({
        lastUpdate: 200,
        doc: innerDoc2,
      })

      // act
      await instance.putDoc(collectionPath, doc1)
      await instance.putDoc(collectionPath, doc2)

      // assert
      const allEntries = await getAll(indexedDB, cacheName, 'cache')
      expect(allEntries).toEqual([
        {
          parent: 'foo',
          doc: innerDoc1,
          lastUpdate: 100,
        },
        {
          parent: 'foo',
          doc: innerDoc2,
          lastUpdate: 200,
        },
      ])
    })

    it('should reject with exception from inner database', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc = { id: 'foo-bar', rev: 1 }
      const error = new Error('test error')

      vi.spyOn(database, 'putDoc').mockRejectedValue(error)

      // act
      const result = instance.putDoc(collectionPath, doc)

      // assert
      await expect(result).rejects.toBe(error)
    })

    it('should not write anything to cache, if inner database rejects', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc = { id: 'foo-bar', rev: 1 }
      const error = new Error('test error')

      vi.spyOn(database, 'putDoc').mockRejectedValue(error)

      // act
      const result = instance.putDoc(collectionPath, doc)

      // assert
      await expect(result).rejects.toBe(error)
      const allEntries = await getAll(indexedDB, cacheName, 'cache')
      expect(allEntries).toEqual([])
    })
  })

  describe('getDocs', () => {
    const cacheName = 'test-cache'
    let timer: number

    beforeEach(() => {
      timer = 100
      vi.spyOn(database, 'putDoc').mockImplementation(async (path, doc) => {
        timer += 10
        return {
          lastUpdate: timer,
          doc,
        }
      })
    })

    it('should return all bucket documents from cache in put order, if after is not specified', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const doc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const doc3 = { id: 'foo-baz', rev: 1, info: 'baz' }

      await instance.putDoc(collectionPath, doc1)
      await instance.putDoc(collectionPath, doc2)
      await instance.putDoc(collectionPath, doc3)

      // act
      const result = await collectFrom(instance.getDocs(collectionPath))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 110, doc: doc1 },
        { lastUpdate: 120, doc: doc2 },
        { lastUpdate: 130, doc: doc3 },
      ])
    })

    it('should return all bucket documents after given timestamp', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const doc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const doc3 = { id: 'foo-baz', rev: 1, info: 'baz' }
      const doc4 = { id: 'foo-qux', rev: 1, info: 'qux' }

      await instance.putDoc(collectionPath, doc1)
      await instance.putDoc(collectionPath, doc2)
      await instance.putDoc(collectionPath, doc3)
      await instance.putDoc(collectionPath, doc4)

      const after = 120

      // act
      const result = await collectFrom(instance.getDocs(collectionPath, after))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 130, doc: doc3 },
        { lastUpdate: 140, doc: doc4 },
      ])
    })

    it('should include deletions after given timestamp', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const doc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const doc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const doc3 = { id: 'foo-baz', rev: 1, info: 'baz' }
      const doc4 = { id: 'foo-qux', rev: 1, info: 'qux' }
      const del1 = { id: 'foo-foo', rev: 2, __deleted: true }

      await instance.putDoc(collectionPath, doc1)
      await instance.putDoc(collectionPath, doc2)
      await instance.putDoc(collectionPath, doc3)
      await instance.putDoc(collectionPath, doc4)
      await instance.putDoc(collectionPath, del1)

      const after = 120

      // act
      const result = await collectFrom(instance.getDocs(collectionPath, after))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 130, doc: doc3 },
        { lastUpdate: 140, doc: doc4 },
        { lastUpdate: 150, doc: del1 },
      ])
    })

    it('should return all collection documents after given timestamp', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo', bucketId: 'foo-123', collection: 'bar' }
      const doc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const doc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const doc3 = { id: 'foo-baz', rev: 1, info: 'baz' }
      const doc4 = { id: 'foo-qux', rev: 1, info: 'qux' }

      await instance.putDoc(collectionPath, doc1)
      await instance.putDoc(collectionPath, doc2)
      await instance.putDoc(collectionPath, doc3)
      await instance.putDoc(collectionPath, doc4)

      const after = 120

      // act
      const result = await collectFrom(instance.getDocs(collectionPath, after))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 130, doc: doc3 },
        { lastUpdate: 140, doc: doc4 },
      ])
    })

    it('should return only requested collection documents', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const bucketPath: CollectionPath = { bucket: 'foo' }
      const collectionPath1: CollectionPath = { bucket: 'foo', bucketId: 'foo-123', collection: 'bar' }
      const collectionPath2: CollectionPath = { bucket: 'foo', bucketId: 'foo-123', collection: 'qux' }
      const collectionPath3: CollectionPath = { bucket: 'foo', bucketId: 'foo-456', collection: 'bar' }
      const doc1 = { id: 'doc1', rev: 1, info: 'foo' }
      const doc2 = { id: 'doc2', rev: 1, info: 'bar' }
      const doc3 = { id: 'doc3', rev: 1, info: 'qux-a' }
      const doc4 = { id: 'doc4', rev: 1, info: 'qux-b' }
      const doc5 = { id: 'doc5', rev: 1, info: 'baz' }

      await instance.putDoc(bucketPath, doc1)
      await instance.putDoc(collectionPath1, doc2)
      await instance.putDoc(collectionPath2, doc3)
      await instance.putDoc(collectionPath2, doc4)
      await instance.putDoc(collectionPath3, doc5)

      // act
      const bucketDocs = await collectFrom(instance.getDocs(bucketPath))
      const foo123BarDocs = await collectFrom(instance.getDocs(collectionPath1))
      const foo123QuxDocs = await collectFrom(instance.getDocs(collectionPath2))
      const foo456BarDocs = await collectFrom(instance.getDocs(collectionPath3))

      // assert
      expect(bucketDocs.flat()).toEqual([{ lastUpdate: 110, doc: doc1 }])
      expect(foo123BarDocs.flat()).toEqual([{ lastUpdate: 120, doc: doc2 }])
      expect(foo123QuxDocs.flat()).toEqual([
        { lastUpdate: 130, doc: doc3 },
        { lastUpdate: 140, doc: doc4 },
      ])
      expect(foo456BarDocs.flat()).toEqual([{ lastUpdate: 150, doc: doc5 }])
    })

    it.each`
      count | after        | innerAfter
      ${0}  | ${undefined} | ${undefined}
      ${4}  | ${undefined} | ${undefined}
      ${0}  | ${120}       | ${120}
      ${4}  | ${120}       | ${120}
    `(
      'should request documents from inner database with after $innerAfter, if after is $after and cache has $count elements',
      async ({ count, after, innerAfter }) => {
        // arrange
        const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
        const collectionPath: CollectionPath = { bucket: 'foo' }
        for (let i = 0; i < count; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await instance.putDoc(collectionPath, { id: `doc-${i}`, rev: 1 })
        }
        vi.spyOn(database, 'getDocs')

        // act
        await collectFrom(instance.getDocs(collectionPath, after))

        // assert
        expect(database.getDocs).toHaveBeenCalledWith(collectionPath, innerAfter)
      },
    )

    it('should return inner database documents, after the cache documents', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const cacheDoc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const cacheDoc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const cacheDoc3 = { id: 'foo-baz', rev: 1, info: 'baz' }
      const cacheDoc4 = { id: 'foo-qux', rev: 1, info: 'qux' }
      const innerDoc1 = { id: 'foo-foo', rev: 2, info: 'foo' }
      const innerDoc2 = { id: 'new-doc', rev: 1, info: 'new' }

      await instance.putDoc(collectionPath, cacheDoc1)
      await instance.putDoc(collectionPath, cacheDoc2)
      await instance.putDoc(collectionPath, cacheDoc3)
      await instance.putDoc(collectionPath, cacheDoc4)

      vi.spyOn(database, 'getDocs').mockReturnValueOnce(
        of([
          { lastUpdate: 200, doc: innerDoc1 },
          { lastUpdate: 210, doc: innerDoc2 },
        ]),
      )

      // act
      const result = await collectFrom(instance.getDocs(collectionPath))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 110, doc: cacheDoc1 },
        { lastUpdate: 120, doc: cacheDoc2 },
        { lastUpdate: 130, doc: cacheDoc3 },
        { lastUpdate: 140, doc: cacheDoc4 },
        { lastUpdate: 200, doc: innerDoc1 },
        { lastUpdate: 210, doc: innerDoc2 },
      ])
    })

    it('should inner database documents in cache for next request', async () => {
      // arrange
      const instance = new IdbCacheDatabase(logger, database, { indexedDB, IDBKeyRange, cacheName })
      const collectionPath: CollectionPath = { bucket: 'foo' }
      const cacheDoc1 = { id: 'foo-foo', rev: 1, info: 'foo' }
      const cacheDoc2 = { id: 'foo-bar', rev: 1, info: 'bar' }
      const cacheDoc3 = { id: 'foo-baz', rev: 1, info: 'baz' }
      const cacheDoc4 = { id: 'foo-qux', rev: 1, info: 'qux' }
      const innerDoc1 = { id: 'foo-foo', rev: 2, info: 'foo' }
      const innerDoc2 = { id: 'new-doc', rev: 1, info: 'new' }

      await instance.putDoc(collectionPath, cacheDoc1)
      await instance.putDoc(collectionPath, cacheDoc2)
      await instance.putDoc(collectionPath, cacheDoc3)
      await instance.putDoc(collectionPath, cacheDoc4)

      vi.spyOn(database, 'getDocs').mockReturnValueOnce(
        of([
          { lastUpdate: 200, doc: innerDoc1 },
          { lastUpdate: 210, doc: innerDoc2 },
        ]),
      )
      await collectFrom(instance.getDocs(collectionPath))
      vi.spyOn(database, 'getDocs').mockReturnValueOnce(EMPTY)

      // act
      const result = await collectFrom(instance.getDocs(collectionPath, 140))

      // assert
      expect(result.flat()).toEqual([
        { lastUpdate: 200, doc: innerDoc1 },
        { lastUpdate: 210, doc: innerDoc2 },
      ])
    })
  })
})

function openDB(indexedDB: IDBFactory, database: string): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

type DatabasesStructure = {
  [database: string]: {
    version: number
    storeNames: string[]
    indexNames: string[]
  }
}

/* eslint-disable no-restricted-syntax, no-await-in-loop */
async function extractDatabasesStructure(indexedDB: IDBFactory): Promise<DatabasesStructure> {
  const structure: DatabasesStructure = {}
  const databases = await indexedDB.databases()
  for (const database of databases) {
    const { name: databaseName = '', version = Number.NaN } = database
    structure[databaseName] = { version, storeNames: [], indexNames: [] }

    const db = await openDB(indexedDB, databaseName)
    const storeNames = Array.from(db.objectStoreNames)
    for (const storeName of storeNames) {
      structure[databaseName].storeNames.push(storeName)
      const indexNames = Array.from(db.transaction(storeName).objectStore(storeName).indexNames)
      for (const indexName of indexNames) {
        structure[databaseName].indexNames.push(`${storeName}/${indexName}`)
      }
    }
  }
  return structure
}
/* eslint-enable no-restricted-syntax, no-await-in-loop */

function getAll(indexedDB: IDBFactory, databaseName: string, storeName: string) {
  return new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open(databaseName)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(storeName)
      const store = transaction.objectStore(storeName)
      const all = store.getAll()
      all.onsuccess = () => resolve(all.result)
    }
  })
}
