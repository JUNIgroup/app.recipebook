import { Observable } from 'rxjs'
import { Doc } from '../database-types'

export type IDBStorage = {
  idb: IDBDatabase
  storeName: string
  indexName: string
}

export type CacheEntity = {
  parent: string
  doc: Doc
  lastUpdate: number
}

/**
 * Open the indexedDB database.
 *
 * @param indexedDB the indexedDB factory
 * @param idbName the name of the database
 * @param storeName the name of the store
 * @param indexName the name of the index
 * @param indexKeys the keys of the index
 * @returns the indexedDB database
 */
export function openIdb(
  indexedDB: IDBFactory,
  idbName: string,
  storeName: string,
  indexName: string,
): Promise<IDBStorage> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(idbName)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(storeName, { keyPath: ['parent', 'doc.id'] })
      store.createIndex(indexName, ['parent', 'lastUpdate', 'doc.id'], { multiEntry: false, unique: false })
    }
  }).then((idb) => ({ idb, storeName, indexName }))
}

export function clearCache({ idb, storeName }: IDBStorage): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const transaction = idb.transaction(storeName, 'readwrite')
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
    const store = transaction.objectStore(storeName)
    store.clear()
  })
}

export function write({ idb, storeName }: IDBStorage, entity: CacheEntity): Promise<void> {
  const transaction = idb.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  return new Promise<void>((resolve, reject) => {
    const request = store.put(entity)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export function writeAll({ idb, storeName }: IDBStorage, entities: CacheEntity[]): Promise<void> {
  const transaction = idb.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  return new Promise<void>((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
    entities.forEach((entity) => {
      const request = store.put(entity)
      request.onerror = () => reject(request.error)
    })
  })
}

export function createKeyRange(parent: string, after = Number.NEGATIVE_INFINITY) {
  return IDBKeyRange.bound([parent, after, '\uFFFF'], [parent, Number.POSITIVE_INFINITY])
}

export function readIndex({ idb, storeName, indexName }: IDBStorage, range?: IDBKeyRange): Observable<CacheEntity[]> {
  return new Observable<CacheEntity[]>((subscriber) => {
    const transaction = idb.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.index(indexName).getAll(range)
    request.onerror = () => subscriber.error(request.error)
    request.onsuccess = () => {
      subscriber.next(request.result)
      subscriber.complete()
    }
  })
}
